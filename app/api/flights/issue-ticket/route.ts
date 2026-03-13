// app/api/dashboard/bookings/issue-ticket/route.ts

import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { hasPermission } from '@/app/api/lib/auth';
import { sendTicketIssuedEmail } from '@/app/emails/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const duffel = new Duffel({
    token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

const ACTOR = 'issue-ticket-api';

function adminNote(msg: string) {
    return { note: msg, addedBy: ACTOR, createdAt: new Date() };
}

function mapDocsForDb(docs: any[]) {
    return (docs || []).map((d: any) => ({
        unique_identifier: d.unique_identifier || '',
        docType: d.type || 'electronic_ticket',
        url: d.url || '',
    }));
}

// ✅ Date → String converter (prevents React "[object Date]" crash)
function safeStringDate(value: any): string {
    if (!value) return new Date().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return new Date(value).toISOString();
    return String(value);
}

// ── Rate Limiter ──
const rateMap = new Map<string, { count: number; start: number }>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const d = rateMap.get(ip) || { count: 0, start: now };
    if (now - d.start > 60_000) {
        d.count = 1;
        d.start = now;
    } else {
        d.count++;
    }
    rateMap.set(ip, d);
    return d.count > 5;
}

function extractFlightDetails(order: any) {
    const slices = order.slices || [];
    const firstSlice = slices[0];
    const lastSlice = slices[slices.length - 1];
    const firstSeg = firstSlice?.segments?.[0];

    return {
        airline:
            firstSeg?.marketing_carrier?.name ||
            firstSeg?.operating_carrier?.name ||
            'Airline',
        route: `${firstSlice?.origin?.iata_code || firstSeg?.origin?.iata_code || '???'} → ${lastSlice?.destination?.iata_code || lastSlice?.segments?.slice(-1)[0]?.destination?.iata_code || '???'}`,
        departureDate:
            firstSeg?.departing_at ||
            firstSlice?.departing_at ||
            new Date().toISOString(),
    };
}

export async function POST(req: Request) {
    const auth = await hasPermission('booking', 'edit');
    if (!auth.success) return auth.response;

    let bookingIdForError: string | null = null;

    // ✅ Track whether payment was captured to prevent
    //    the catch block from incorrectly reverting it
    let paymentWasCaptured = false;

    try {
        const ip =
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown';

        if (isRateLimited(ip)) {
            return NextResponse.json(
                { success: false, message: 'Too many attempts. Wait 1 minute.' },
                { status: 429 },
            );
        }

        const body = await req.json();
        const { bookingId } = body as { bookingId?: string };
        bookingIdForError = bookingId || null;

        if (!bookingId) {
            return NextResponse.json(
                { success: false, message: 'Booking ID is required.' },
                { status: 400 },
            );
        }

        await dbConnect();

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return NextResponse.json(
                { success: false, message: 'Booking not found.' },
                { status: 404 },
            );
        }

        if (!booking.duffelOrderId) {
            return NextResponse.json(
                { success: false, message: 'No Duffel order linked.' },
                { status: 400 },
            );
        }

        if (booking.status === 'issued' && booking.emailSent) {
            return NextResponse.json(
                { success: false, message: 'Ticket already issued and email sent.' },
                { status: 400 },
            );
        }

        if ((booking.retryCount || 0) >= 5) {
            return NextResponse.json(
                { success: false, message: 'Max retry limit (5) reached.' },
                { status: 403 },
            );
        }

        // ── If payment was already captured in a previous attempt ──
        if (booking.paymentStatus === 'captured') {
            paymentWasCaptured = true;
        }

        // ── Fetch Order ──
        let order: any;
        try {
            const res = await duffel.orders.get(booking.duffelOrderId);
            order = res.data;
        } catch (err: any) {
            return NextResponse.json(
                { success: false, message: 'Duffel API connection failed.' },
                { status: 502 },
            );
        }

        if (order.cancellation || order.cancelled_at) {
            await Booking.findByIdAndUpdate(bookingId, {
                $set: { status: 'cancelled' },
                $push: { adminNotes: adminNote(`❌ Cancelled on Duffel.`) },
            });
            return NextResponse.json(
                { success: false, message: 'Airline cancelled this booking.' },
                { status: 400 },
            );
        }

        const expiresAt =
            order.payment_status?.payment_required_by ||
            order.payment_status?.price_guarantee_expires_at;

        if (expiresAt && new Date(expiresAt) < new Date()) {
            await Booking.findByIdAndUpdate(bookingId, {
                $set: { status: 'expired' },
                $push: { adminNotes: adminNote(`⏰ Expired. Deadline: ${expiresAt}`) },
            });
            return NextResponse.json(
                { success: false, message: 'Booking expired.' },
                { status: 400 },
            );
        }

        // ══════════════════════════════════════
        // PAYMENT
        // ══════════════════════════════════════
        let paymentId = booking.payment_id || '';
        let needsPayment = true;

        // If documents already exist, payment was already done
        if (order.documents && order.documents.length > 0) {
            needsPayment = false;
            paymentWasCaptured = true;
        }

        if (needsPayment) {
            const amount = order.total_amount;
            const currency = order.total_currency;

            if (!amount || !currency) {
                return NextResponse.json(
                    { success: false, message: 'Amount/currency missing.' },
                    { status: 400 },
                );
            }

            try {
                const payRes = await duffel.payments.create({
                    order_id: booking.duffelOrderId,
                    payment: { amount, currency, type: 'balance' },
                });

                const payment = payRes.data as any;

                if (!payment || payment.status !== 'succeeded') {
                    throw new Error(
                        payment?.failure_reason || `Payment failed (${payment?.status})`,
                    );
                }

                paymentId = payment.id;
                paymentWasCaptured = true;


const clientPaid = `${booking.pricing?.total_amount} ${booking.pricing?.currency}`;
const duffelPaid = `${order.base_amount} ${booking.pricing?.currency}`;
const paymentMethod = booking.clientPayWith === 'stripe' ? 'Stripe Card' : 'Wallet Balance';
const markupAmount = (booking.pricing?.markup || 0);

await Booking.findByIdAndUpdate(bookingId, {
    $set: {
        paymentStatus: 'captured',
        payment_id: paymentId,
        lastRetryAt: new Date(),
    },
    $push: {
        adminNotes: adminNote(
            `✅ Payment Captured & Linked.
             💰 Client Paid: ${clientPaid} via ${paymentMethod}
             ✈️ Duffel Paid: ${duffelPaid} (Base Fare)
             📈 Net Markup: ${markupAmount.toFixed(2)} ${booking.pricing?.currency}
             🆔 Payment ID: ${paymentId}
             Action: Ready for Ticket Issuance.`
        ),
    },
});
            } catch (payErr: any) {
                const errCode = payErr?.response?.data?.errors?.[0]?.code || '';
                const errMsg = payErr?.response?.data?.errors?.[0]?.message || '';

                if (errCode === 'order_already_paid' || /already.*paid/i.test(errMsg)) {
                    needsPayment = false;
                    paymentWasCaptured = true;

                    if (booking.paymentStatus !== 'captured') {
                        await Booking.findByIdAndUpdate(bookingId, {
                            $set: { paymentStatus: 'captured' },
                            $push: {
                                adminNotes: adminNote(
                                    `💰 Duffel confirms already paid. Synced paymentStatus → captured.`,
                                ),
                            },
                        }).catch(() => {});
                    }
                } else {
                    throw payErr;
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // SINGLE DOCUMENT CHECK (Event-Driven — No Polling)
        // ══════════════════════════════════════════════════════════════
        let latestOrder: any;

        if (!needsPayment && order.documents && order.documents.length > 0) {
            latestOrder = order;
        } else {
            try {
                const res = await duffel.orders.get(booking.duffelOrderId);
                latestOrder = res.data;
            } catch (err: any) {
                await Booking.findByIdAndUpdate(bookingId, {
                    $set: { paymentStatus: 'captured' },
                    $push: {
                        adminNotes: adminNote(
                            `⚠️ Payment captured but failed to re-fetch order. Webhook will handle. Error: ${err.message}`,
                        ),
                    },
                });
                return NextResponse.json({
                    success: true,
                    message: 'Payment successful. Ticket is generating in the background...',
                    ticketIssued: false,
                    paymentId,
                });
            }
        }

        const hasDocs = latestOrder.documents && latestOrder.documents.length > 0;

        // ──────────────────────────────────────
        // CASE A: Delayed Ticket (No documents yet)
        // ──────────────────────────────────────
        if (!hasDocs) {
            await Booking.findByIdAndUpdate(bookingId, {
                $set: {
                    paymentStatus: 'captured',
                    payment_id: paymentId,
                },
                $push: {
                    adminNotes: adminNote(
                        `💳 Payment captured. Waiting for airline to generate tickets (Webhook will issue). Payment ID: ${paymentId}`,
                    ),
                },
            });

            return NextResponse.json({
                success: true,
                message: 'Payment successful. Ticket is generating in the background...',
                ticketIssued: false,
                paymentId,
            });
        }

        // ──────────────────────────────────────
        // CASE B: Instant Ticket (Documents found)
        // ──────────────────────────────────────
        const dbDocs = mapDocsForDb(latestOrder.documents);
        const pnr = latestOrder.booking_reference || booking.pnr || 'N/A';
        const flight = extractFlightDetails(latestOrder);

        // ✅ Set emailSent: true FIRST as a lock to prevent webhook duplicate
        await Booking.findByIdAndUpdate(bookingId, {
            $set: {
                status: 'issued',
                pnr,
                documents: dbDocs,
                paymentStatus: 'captured',
                payment_id: paymentId,
                emailSent: true, // 🔒 Lock
                retryCount: 0,
            },
            $push: {
                adminNotes: adminNote(
                    `🎫 Ticket issued instantly. PNR: ${pnr}. Docs: ${dbDocs.length}. Payment ID: ${paymentId}`,
                ),
            },
        });

        // ════════════════════════════════════════════════
        // ✅ SEND EMAIL (Awaited for Serverless safety)
        //
        // ✅ FIX: departureDate is sanitized via safeStringDate()
        //    to prevent React "[object Date]" crash.
        //    MongoDB stores Date objects, but React email
        //    templates need strings.
        // ════════════════════════════════════════════════
        const emailData = {
            pnr,
            contact: {
                email: booking.contact?.email || '',
                phone: booking.contact?.phone || '',
            },
            passengers: (booking.passengers || []).map((p: any) => ({
                title: p.title || '',
                firstName: p.firstName || p.first_name || '',
                lastName: p.lastName || p.last_name || '',
                type: p.type || p.passenger_type || 'adult',
            })),
            flightDetails: {
                airline: booking.flightDetails?.airline || flight.airline,
                route: booking.flightDetails?.route || flight.route,
                // ✅ FIX: Always convert to string — never pass Date object
                departureDate: safeStringDate(
                    booking.flightDetails?.departureDate || flight.departureDate,
                ),
            },
            documents: dbDocs.map((d: any) => ({
                url: d.url,
                unique_identifier: d.unique_identifier,
            })),
        };

        console.log('📧 Email data:', JSON.stringify({
            to: emailData.contact.email,
            pnr: emailData.pnr,
            passengers: emailData.passengers.length,
            docs: emailData.documents.length,
            departureDate: emailData.flightDetails.departureDate,
        }));

        if (emailData.contact.email) {
            try {
                const emailResult = await sendTicketIssuedEmail(emailData);

             
                if (emailResult.success) {
                    await Booking.findByIdAndUpdate(bookingId, {
                        $push: {
                            adminNotes: adminNote(
                                `📧 Issued Email sent to ${emailData.contact.email}. ID: ${emailData.pnr}`,
                            ),
                        },
                    }).catch(() => {});
                } else {
                    // Email failed — revert the lock so webhook can retry
                    await Booking.findByIdAndUpdate(bookingId, {
                        $set: { emailSent: false },
                        $push: {
                            adminNotes: adminNote(
                                `⚠️ Email failed (lock reverted). Error: ${JSON.stringify(emailResult.error)}`,
                            ),
                        },
                    }).catch(() => {});
                }
            } catch (emailErr: any) {
                console.error('❌ Email crashed:', emailErr?.message || emailErr);

                // Unexpected crash — revert the lock so webhook can retry
                await Booking.findByIdAndUpdate(bookingId, {
                    $set: { emailSent: false },
                    $push: {
                        adminNotes: adminNote(
                            `⚠️ Email crashed (lock reverted). Error: ${emailErr?.message || 'Unknown'}`,
                        ),
                    },
                }).catch(() => {});
            }
        } else {
            // No email address — revert lock, add note
            await Booking.findByIdAndUpdate(bookingId, {
                $set: { emailSent: false },
                $push: {
                    adminNotes: adminNote(
                        `⚠️ No email address on booking. Lock reverted for webhook.`,
                    ),
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Payment confirmed & Ticket Issued Successfully!',
            ticketIssued: true,
            paymentId,
        });
    } catch (error: any) {
        let errorMessage = 'Payment failed. Try again.';
        let statusCode = 400;

        const duffelErrors = error?.response?.data?.errors;
        const firstError = Array.isArray(duffelErrors) ? duffelErrors[0] : null;

        if (firstError) {
            const code = firstError.code || '';
            const msg = firstError.message || '';

            const errorMap: Record<string, string> = {
                order_requires_instant_payment: 'Instant payment required. Create new booking.',
                order_expired: 'Booking expired.',
                insufficient_balance: 'Duffel balance insufficient.',
                order_already_paid: 'Already paid.',
                order_not_found: 'Order not found.',
            };

            errorMessage = errorMap[code] || msg || errorMessage;
            statusCode = error?.response?.status || 400;

            if (code === 'order_expired' || /expired/i.test(msg)) {
                if (bookingIdForError) {
                    await Booking.findByIdAndUpdate(bookingIdForError, {
                        $set: { status: 'expired' },
                        $push: { adminNotes: adminNote(`⏰ Auto-expired: ${msg}`) },
                    }).catch(() => {});
                }
            }
        } else if (error?.response?.status >= 500) {
            errorMessage = 'Airline system unavailable.';
            statusCode = 502;
        } else if (error?.message) {
            errorMessage = error.message;
        }

        // ✅ Only set paymentStatus:'failed' if payment was NOT already captured
        if (bookingIdForError) {
            const failureUpdate: any = {
                lastRetryAt: new Date(),
            };

            if (!paymentWasCaptured) {
                failureUpdate.paymentStatus = 'failed';
            }

            await Booking.findByIdAndUpdate(bookingIdForError, {
                $inc: { retryCount: 1 },
                $set: failureUpdate,
                $push: {
                    adminNotes: adminNote(
                        `❌ Failed: ${errorMessage}${paymentWasCaptured ? ' (⚠️ Payment was captured — NOT reverted)' : ''}`,
                    ),
                },
            }).catch(() => {});
        }

        return NextResponse.json({ success: false, message: errorMessage }, { status: statusCode });
    }
}