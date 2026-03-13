// app/api/dashboard/bookings/initiate-card/route.ts

import { NextResponse } from 'next/server';
import axios from 'axios';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { hasPermission } from '@/app/api/lib/auth';
import { decrypt } from '../utils';

export const dynamic = 'force-dynamic';

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

const ACTOR = 'initiate-card-api';

// ================================================================
// HELPERS
// ================================================================

/**
 * Create admin note matching schema structure:
 * { note: String, addedBy: String, createdAt: Date }
 */
function createAdminNote(message: string) {
  return {
    note: message,
    addedBy: ACTOR,
    createdAt: new Date(),
  };
}

// ================================================================
// RATE LIMITER (In-memory, per-instance)
// ================================================================

const rateLimitMap = new Map<
  string,
  { count: number; startTime: number }
>();

function isRateLimited(ip: string): boolean {
  const windowMs = 60 * 1000;
  const maxRequests = 5;
  const now = Date.now();
  const clientData = rateLimitMap.get(ip) || {
    count: 0,
    startTime: now,
  };

  if (now - clientData.startTime > windowMs) {
    clientData.count = 1;
    clientData.startTime = now;
  } else {
    clientData.count++;
  }

  rateLimitMap.set(ip, clientData);
  return clientData.count > maxRequests;
}

// ================================================================
// POST /api/dashboard/bookings/initiate-card
//
// Admin-only. Tokenizes a stored card via Duffel Card Vault and
// handles 3D Secure authentication if required.
//
// Flow:
// 1. Decrypt stored card number from DB
// 2. Tokenize via Duffel Card Vault (api.duffel.cards)
// 3. If 3DS required → create PaymentIntent → return client_token
// 4. If no 3DS → return card_id for direct payment
//
// Frontend then either:
// - Shows 3DS popup (SHOW_3DS_POPUP action)
// - Proceeds to issue-ticket API (PROCEED_TO_PAY action)
// ================================================================

export async function POST(req: Request) {
  // ── Admin Authentication ──
  const auth = await hasPermission("booking","edit")
  if (!auth.success) return auth.response;

  let bookingIdForError: string | null = null;

  // ── Rate Limiting ──
  const ip =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown-ip';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        success: false,
        message:
          'Too many attempts. Please wait 1 minute.',
      },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const { bookingId, cvv } = body as {
      bookingId?: string;
      cvv?: string;
    };

    bookingIdForError = bookingId || null;

    // ── Input Validation ──
    if (!bookingId || !cvv) {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking ID and CVV are required',
        },
        { status: 400 },
      );
    }

    // ── Database Connection & Booking Lookup ──
    await dbConnect();
    const booking: any = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking not found',
        },
        { status: 404 },
      );
    }

    // ── Booking State Validation ──
    // Prevent card tokenization for bookings in terminal states
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Cannot process card for a cancelled booking.',
        },
        { status: 400 },
      );
    }

    if (booking.status === 'expired') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Booking has expired. Please create a new one.',
        },
        { status: 400 },
      );
    }

    if (
      booking.status === 'issued' &&
      booking.emailSent
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Ticket already issued. No payment needed.',
        },
        { status: 400 },
      );
    }

    if (booking.paymentStatus === 'captured') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Payment already captured for this booking.',
        },
        { status: 400 },
      );
    }

    if (!booking.paymentInfo?.cardNumber) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No card attached to this booking',
        },
        { status: 400 },
      );
    }

    if (!booking.duffelOrderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No Duffel order linked to this booking.',
        },
        { status: 400 },
      );
    }

    // ── Card Decryption ──
    let cardInfo: {
      number: string;
      cvc: string;
      expMonth: string;
      expYear: string;
      name: string;
      address: any;
    };

    try {
      const decryptedNumber = decrypt(
        booking.paymentInfo.cardNumber,
      );
      const [expMonth, expYearShort] = (
        booking.paymentInfo.expiryDate || ''
      ).split('/');
      const expYearFull =
        expYearShort && expYearShort.length === 2
          ? `20${expYearShort}`
          : expYearShort;

      if (
        !decryptedNumber ||
        !expMonth ||
        !expYearFull
      ) {
        throw new Error('Invalid card data');
      }

      cardInfo = {
        number: decryptedNumber,
        cvc: cvv,
        expMonth,
        expYear: expYearFull,
        name: booking.paymentInfo.cardName,
        address:
          booking.paymentInfo.billingAddress || {},
      };
    } catch (err) {
      console.error('Decryption Error:', err);

      // Log decryption failure
      await Booking.findByIdAndUpdate(bookingId, {
        $push: {
          adminNotes: createAdminNote(
            'Card decryption failed during initiate-card attempt.',
          ),
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Failed to decrypt card data',
        },
        { status: 500 },
      );
    }

    // ════════════════════════════════════════════════════
    // CARD TOKENIZATION (Duffel Card Vault)
    //
    // Sends raw card data to api.duffel.cards which
    // returns a card_id token. Raw card data never
    // touches our backend after this point.
    // ════════════════════════════════════════════════════

    console.log(
      '💳 Tokenizing card with Duffel vault...',
    );

    const tokenResponse = await axios.post(
      'https://api.duffel.cards/payments/cards',
      {
        data: {
          number: cardInfo.number,
          cvc: cardInfo.cvc,
          expiry_month: cardInfo.expMonth,
          expiry_year: cardInfo.expYear,
          name: cardInfo.name,
          address_line_1:
            cardInfo.address.street || null,
          address_city:
            cardInfo.address.city || null,
          address_country_code:
            cardInfo.address.country || 'US',
          address_postal_code:
            cardInfo.address.zipCode || null,
          multi_use: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DUFFEL_ACCESS_TOKEN}`,
          'Duffel-Version': 'v2',
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      },
    );

    const cardData = tokenResponse.data.data;
    const cardId: string = cardData.id;

    // 3D Secure check — can be string or object depending on Duffel version
    const threeDS =
      cardData.three_d_secure_usage as any;
    const requires3DS =
      typeof threeDS === 'string'
        ? threeDS === 'required'
        : !!threeDS?.required;

    console.log(
      '✅ Card tokenized:',
      cardId,
      '| 3DS:',
      threeDS,
    );

    // Log successful tokenization
    await Booking.findByIdAndUpdate(bookingId, {
      $push: {
        adminNotes: createAdminNote(
          `Card tokenized successfully. Card ID: ${cardId}. 3DS required: ${requires3DS}. Card ending: ****${cardInfo.number.slice(-4)}`,
        ),
      },
    });

    // ── Amount Validation ──
    const amountToCharge: number | undefined =
      booking.pricing?.total_amount;
    const currency: string =
      booking.pricing?.currency || 'USD';

    if (!amountToCharge) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No amount found for this booking',
        },
        { status: 400 },
      );
    }

    // ════════════════════════════════════════════════════
    // CASE A: 3D SECURE REQUIRED
    //
    // Create PaymentIntent → Confirm with card_id →
    // If requires_action → return client_token for
    // frontend 3DS popup
    // ════════════════════════════════════════════════════

    if (requires3DS) {
      try {
        console.log(
          '🔒 3DS required. Creating Payment Intent...',
        );

        const paymentIntent =
          await duffel.paymentIntents.create({
            amount: amountToCharge.toString(),
            currency,
          } as any);

        const intentId = paymentIntent.data.id;

        // Attempt to confirm the intent with the tokenized card
        try {
          await axios.post(
            `https://api.duffel.com/payments/payment_intents/${intentId}/actions/confirm`,
            {
              data: {
                payment_method: {
                  type: 'card',
                  card_id: cardId,
                },
              },
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.DUFFEL_ACCESS_TOKEN}`,
                'Duffel-Version': 'v2',
                'Content-Type': 'application/json',
              },
            },
          );

          // Rare case: Confirmed without OTP challenge
          await Booking.findByIdAndUpdate(
            bookingId,
            {
              $set: {
                paymentStatus: 'authorized',
                'paymentInfo.threeDSecureSessionId':
                  intentId,
              },
              $push: {
                adminNotes: createAdminNote(
                  `3DS check passed without OTP. Payment Intent: ${intentId}. Card accepted directly.`,
                ),
              },
            },
          );

          return NextResponse.json({
            success: true,
            action: 'PROCEED_TO_PAY',
            card_id: cardId,
            message:
              'Card accepted without OTP challenge.',
          });
        } catch (confirmError: any) {
          // Expected path: 3DS requires user action (OTP)
          console.warn(
            'Payment Intent requires action (expected for 3DS):',
            confirmError?.response?.data
              ?.errors?.[0]?.message ||
              confirmError?.message,
          );

          // Fetch updated intent to get client_token
          const updatedIntent =
            await duffel.paymentIntents.get(
              intentId,
            );

          if (
            updatedIntent.data.status ===
            'requires_action'
          ) {
            // Save 3DS session and update payment status
            await Booking.findByIdAndUpdate(
              bookingId,
              {
                $set: {
                  paymentStatus:
                    'requires_action',
                  'paymentInfo.threeDSecureSessionId':
                    intentId,
                },
                $push: {
                  adminNotes: createAdminNote(
                    `3DS OTP verification required. Payment Intent: ${intentId}. Awaiting customer authentication.`,
                  ),
                },
              },
            );

            return NextResponse.json({
              success: true,
              action: 'SHOW_3DS_POPUP',
              card_id: cardId,
              client_token:
                updatedIntent.data.client_token,
              payment_intent_id:
                updatedIntent.data.id,
              message:
                'OTP verification required.',
            });
          }

          // Unexpected state — not requires_action
          throw confirmError;
        }
      } catch (intentError: any) {
        console.error(
          'Payment Intent / 3DS failed:',
          intentError?.response?.data ||
            intentError?.message,
        );

        // Log 3DS failure
        await Booking.findByIdAndUpdate(bookingId, {
          $push: {
            adminNotes: createAdminNote(
              `3DS initiation failed. Error: ${intentError?.response?.data?.errors?.[0]?.message || intentError?.message || 'Unknown'}`,
            ),
          },
        });

        return NextResponse.json(
          {
            success: false,
            message:
              'Failed to initiate 3DS security check.',
            debug: intentError?.message,
          },
          { status: 400 },
        );
      }
    }

    // ════════════════════════════════════════════════════
    // CASE B: NO 3DS REQUIRED
    //
    // Card tokenized and ready for direct payment.
    // Frontend should call issue-ticket API next.
    // ════════════════════════════════════════════════════

    await Booking.findByIdAndUpdate(bookingId, {
      $set: {
        paymentStatus: 'authorized',
      },
      $push: {
        adminNotes: createAdminNote(
          `Card authorized (no 3DS required). Card ID: ${cardId}. Ready for payment. Amount: ${amountToCharge} ${currency}`,
        ),
      },
    });

    return NextResponse.json({
      success: true,
      action: 'PROCEED_TO_PAY',
      card_id: cardId,
      message: 'Card secure. Proceeding to charge.',
    });
  } catch (error: any) {
    // ── Duffel Error Extraction ──
    const status = error?.response?.status;
    const errBody = error?.response?.data;
    const firstErr = Array.isArray(errBody?.errors)
      ? errBody.errors[0]
      : null;

    console.error(
      'Initiate Card API Error:',
      JSON.stringify(
        errBody || error?.message,
        null,
        2,
      ),
    );

    // Determine error message for response
    let errorMessage =
      error?.message ||
      'Failed to process card information';
    let errorCode = 'INTERNAL_ERROR';
    let responseStatus = 500;

    if (
      status === 403 &&
      firstErr?.code === 'unavailable_feature'
    ) {
      // Duffel card vault not enabled
      errorMessage =
        'Duffel card vault / card payments feature is not enabled for this account. Please contact help@duffel.com to enable payments.';
      errorCode = 'UNAVAILABLE_FEATURE';
      responseStatus = 403;
    } else if (status && firstErr) {
      // Other Duffel API error
      errorMessage =
        firstErr.message || 'Duffel API error';
      errorCode =
        firstErr.code || 'DUFFEL_ERROR';
      responseStatus = status;
    }

    // Log failure to admin notes
    if (bookingIdForError) {
      try {
        await Booking.findByIdAndUpdate(
          bookingIdForError,
          {
            $push: {
              adminNotes: createAdminNote(
                `Card initiation failed. Code: ${errorCode}. Error: ${errorMessage}`,
              ),
            },
          },
        );
      } catch (updateErr) {
        console.error(
          'Failed to log card error to admin notes:',
          updateErr,
        );
      }
    }

    // ── Error Responses ──
    if (
      errorCode === 'UNAVAILABLE_FEATURE'
    ) {
      return NextResponse.json(
        {
          success: false,
          code: errorCode,
          message: errorMessage,
          duffel_message: firstErr?.message,
        },
        { status: responseStatus },
      );
    }

    if (status && firstErr) {
      return NextResponse.json(
        {
          success: false,
          code: errorCode,
          title: firstErr.title,
          message: errorMessage,
          documentation_url:
            firstErr.documentation_url,
        },
        { status: responseStatus },
      );
    }

    return NextResponse.json(
      {
        success: false,
        code: errorCode,
        message: errorMessage,
      },
      { status: responseStatus },
    );
  }
}