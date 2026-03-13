// app/api/duffel/webhook/route.ts

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import {
    sendTicketIssuedEmail,
    sendBookingProcessingEmail,
    sendNewBookingAdminNotification,
} from '@/app/emails/email';
import { format, parseISO } from 'date-fns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const duffel = new Duffel({
    token: process.env.DUFFEL_ACCESS_TOKEN || '',
});

const WEBHOOK_ACTOR = 'duffel-webhook';

// ================================================================
// HELPERS
// ================================================================

function createAdminNote(message: string) {
    return {
        note: message,
        addedBy: WEBHOOK_ACTOR,
        createdAt: new Date(),
    };
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ✅ FIX: .filter(doc => doc.url) সরিয়েছি
// test mode এ URL empty থাকে, filter করলে সব বাদ যায়
function mapDocsForDb(duffelDocs: any[]) {
    return (duffelDocs || []).map((doc: any) => ({
        unique_identifier: doc.unique_identifier || '',
        docType: doc.type || 'electronic_ticket',
        url: doc.url || '',
    }));
}

// ================================================================
// 🔒 Verify Signature
// ================================================================
function verifySignature(
    rawBody: string,
    signature: string,
    secret: string,
): boolean {
    const timestampMatch = signature.match(/t=([^,]+)/);
    const hashMatch = signature.match(/v2=([^,]+)/);

    const timestamp = timestampMatch?.[1]?.trim();
    const receivedHash = hashMatch?.[1]?.trim();

    if (!timestamp || !receivedHash) return false;

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedHash = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');

    const receivedBuffer = Buffer.from(receivedHash);
    const expectedBuffer = Buffer.from(expectedHash);

    if (receivedBuffer.length !== expectedBuffer.length)
        return false;

    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

// ================================================================
// 🔍 Fetch Order
// ================================================================
async function fetchOrder(orderId: string): Promise<any | null> {
    try {
        const res = await duffel.orders.get(orderId);
        return res.data;
    } catch (err: any) {
        console.error(
            `❌ Duffel fetch failed [${orderId}]:`,
            err.message,
        );
        return null;
    }
}

// ================================================================
// 📧 Build Email Data — matches BookingData interface
// ================================================================
function buildEmailData(bookingDoc: any, order: any, dbDocs: any[]) {
    const slices = order.slices || [];
    const firstSlice = slices[0];
    const lastSlice = slices[slices.length - 1];
    const firstSegment = firstSlice?.segments?.[0];

    const originName =
        firstSlice?.origin?.city_name ||
        firstSlice?.origin?.iata_code ||
        'Origin';

    const destinationName =
        lastSlice?.destination?.city_name ||
        lastSlice?.destination?.iata_code ||
        'Destination';

    const passengers = (bookingDoc.passengers || []).map(
        (p: any) => ({
            title: p.title || '',
            firstName: p.firstName || p.first_name || '',
            lastName: p.lastName || p.last_name || '',
            type: p.type || p.passenger_type || 'adult',
        }),
    );

    return {
        pnr: order.booking_reference || bookingDoc.pnr || 'N/A',
        contact: {
            email: bookingDoc.contact?.email || '',
            phone: bookingDoc.contact?.phone || '',
        },
        passengers,
        flightDetails: {
            airline:
                bookingDoc.flightDetails?.airline ||
                firstSegment?.operating_carrier?.name ||
                firstSegment?.marketing_carrier?.name ||
                order.owner?.name ||
                'Airline',
            route:
                bookingDoc.flightDetails?.route ||
                `${originName} - ${destinationName}`,
            departureDate:
                bookingDoc.flightDetails?.departureDate ||
                firstSegment?.departing_at ||
                order.created_at ||
                new Date().toISOString(),
        },
        documents: (dbDocs || []).map((d: any) => ({
            url: d.url || '',
            unique_identifier: d.unique_identifier || '',
        })),
    };
}

// ================================================================
// 📧 Confirmation Emails (order.created)
// ================================================================
async function sendConfirmationEmails(
    booking: any,
    order: any,
): Promise<void> {
    try {
        const primary = booking.passengers?.[0];
        const passengerName = primary
            ? `${primary.title || ''} ${primary.firstName || primary.first_name || ''} ${primary.lastName || primary.last_name || ''}`.trim()
            : 'Traveler';

        const pnr =
            order.booking_reference || booking.pnr || 'N/A';

        let flightDate: string;
        try {
            const rawDate = booking.flightDetails?.departureDate;
            const parsed =
                typeof rawDate === 'string'
                    ? parseISO(rawDate)
                    : new Date(rawDate || Date.now());

            flightDate = isNaN(parsed.getTime())
                ? 'Date not available'
                : format(parsed, 'dd MMM, yyyy');
        } catch {
            flightDate = 'Date not available';
        }

        const route = booking.flightDetails?.route || 'N/A';

        if (booking.contact?.email) {
            await sendBookingProcessingEmail({
                to: booking.contact.email,
                customerName: passengerName,
                bookingReference: pnr,
                route,
                flightDate,
            });
            console.log(
                `📧 Confirmation → ${booking.contact.email}`,
            );
        }

        await sendNewBookingAdminNotification({
            pnr,
            customerName: passengerName,
            customerPhone: booking.contact?.phone || 'N/A',
            route,
            airline: booking.flightDetails?.airline || 'N/A',
            flightDate,
            totalAmount: booking.pricing?.total_amount || 0,
            bookingId: booking._id.toString(),
        });
        console.log(`📧 Admin notification | PNR: ${pnr}`);
    } catch (emailError: any) {
        console.error(
            `❌ Confirmation email failed:`,
            emailError.message,
        );
    }
}

// ================================================================
// 🎫 handleTicketIssuance — TICKET ISSUE + EMAIL
// ================================================================
async function handleTicketIssuance(
    bookingId: string,
    duffelOrderId: string,
): Promise<boolean> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        console.log(`ℹ️ Booking not found: ${bookingId}`);
        return false;
    }

    if (booking.status === 'issued' && booking.emailSent) {
        console.log(`ℹ️ Already issued & emailed. Skip.`);
        return true;
    }

    const order = await fetchOrder(duffelOrderId);
    if (!order) {
        await Booking.findByIdAndUpdate(bookingId, {
            $push: {
                adminNotes: createAdminNote(
                    `❌ Duffel API failed. Order: ${duffelOrderId}`,
                ),
            },
        });
        return false;
    }

    // ✅ FIX: URL filter সরিয়েছি
    // আগে: (order.documents || []).filter((doc: any) => doc.url)
    // এখন: documents array আছে কিনা শুধু সেটাই চেক
    const rawDocs = order.documents || [];

    if (rawDocs.length === 0) {
        console.log(`⏳ No documents yet for ${duffelOrderId}`);
        return false;
    }

    const dbDocs = mapDocsForDb(rawDocs);
    const pnr = order.booking_reference || booking.pnr || 'N/A';

    // ── DB Update: status=issued ──
    if (booking.status !== 'issued') {
        await Booking.findByIdAndUpdate(bookingId, {
            $set: {
                status: 'issued',
                pnr,
                documents: dbDocs,
                paymentStatus: 'captured',
            },
            $push: {
                adminNotes: createAdminNote(
                    `🎫 Ticket issued via webhook. PNR: ${pnr}. Docs: ${dbDocs.length}`,
                ),
            },
        });
        console.log(`🎫 ${bookingId} → issued | PNR: ${pnr}`);
    }

    // ── Email ──
    if (!booking.emailSent) {
        if (!booking.contact?.email) {
            await Booking.findByIdAndUpdate(bookingId, {
                $push: {
                    adminNotes: createAdminNote(
                        `⚠️ Ticket issued but no email address.`,
                    ),
                },
            });
            return true;
        }

        const emailData = buildEmailData(booking, order, dbDocs);

        try {
            await sendTicketIssuedEmail(emailData);

            await Booking.findByIdAndUpdate(bookingId, {
                $set: { emailSent: true },
                $push: {
                    adminNotes: createAdminNote(
                        `📧 Email sent to ${emailData.contact.email}`,
                    ),
                },
            });
            console.log(
                `✅ Email sent | PNR: ${pnr} | To: ${emailData.contact.email}`,
            );
        } catch (err: any) {
            console.error(`❌ Email failed:`, err.message);
            await Booking.findByIdAndUpdate(bookingId, {
                $set: { emailSent: false },
                $push: {
                    adminNotes: createAdminNote(
                        `❌ Email FAILED: ${err.message}`,
                    ),
                },
            });
        }
    }

    return true;
}

// ================================================================
// 🔄 MAIN WEBHOOK HANDLER
// ================================================================

// ================================================================
// 🔄 MAIN WEBHOOK HANDLER
// ================================================================
export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const signature =
            req.headers.get('x-duffel-signature') ||
            req.headers.get('X-Duffel-Signature');

        if (!signature) {
            return NextResponse.json(
                { message: 'Missing signature' },
                { status: 401 },
            );
        }

        const secret = process.env.DUFFEL_WEBHOOK_SECRET;
        if (!secret) {
            console.error('❌ DUFFEL_WEBHOOK_SECRET missing');
            return NextResponse.json(
                { message: 'Server error' },
                { status: 500 },
            );
        }

        if (!verifySignature(rawBody, signature, secret)) {
            console.error('❌ Signature verification failed');
            return NextResponse.json(
                { message: 'Invalid signature' },
                { status: 403 },
            );
        }

        let event: any;
        try {
            event = JSON.parse(rawBody);
        } catch {
            return NextResponse.json(
                { message: 'Invalid JSON' },
                { status: 400 },
            );
        }

        const { type, data: rawData } = event;
        const data = rawData?.object ?? rawData ?? {};

        console.log(
            `🔔 Webhook: [${type}] | Keys: ${Object.keys(data).join(', ') || 'empty'}`,
        );

        await dbConnect();

        switch (type) {
            // ════════════════════════════════════════
            // ✅ ORDER CREATED
            // ════════════════════════════════════════
            case 'order.created': {
                const orderId = data.id;
                if (!orderId) break;

                const booking = await Booking.findOne({
                    duffelOrderId: orderId,
                });
                if (!booking) {
                    console.warn(
                        `⚠️ order.created: No booking for ${orderId}`,
                    );
                    break;
                }

                const order = await fetchOrder(orderId);
                if (!order) {
                    await Booking.findByIdAndUpdate(booking._id, {
                        $set: { status: 'held' },
                        $push: {
                            adminNotes: createAdminNote(
                                `Order created but Duffel fetch failed. Order: ${orderId}`,
                            ),
                        },
                    });
                    break;
                }

                if (
                    booking.status === 'held' &&
                    !booking.confirmationEmailSent
                ) {
                    try {
                        await sendConfirmationEmails(
                            booking,
                            order,
                        );
                        await Booking.findByIdAndUpdate(
                            booking._id,
                            {
                                $set: {
                                    confirmationEmailSent: true,
                                },
                                $push: {
                                    adminNotes: createAdminNote(
                                        `📧 Confirmation email sent to ${booking.contact?.email || 'N/A'}`,
                                    ),
                                },
                            },
                        );
                    } catch (error: any) {
                        await Booking.findByIdAndUpdate(
                            booking._id,
                            {
                                $push: {
                                    adminNotes: createAdminNote(
                                        `❌ Confirmation email failed: ${error.message}`,
                                    ),
                                },
                            },
                        );
                    }
                }
                break;
            }

            // ════════════════════════════════════════
            // ❌ ORDER CREATION FAILED
            // ════════════════════════════════════════
            case 'order.creation_failed': {
                const orderId = data.id || data.order_id;
                if (!orderId) break;

                const failureReason =
                    data?.failure_reason ||
                    data?.message ||
                    'Unknown';

                await Booking.findOneAndUpdate(
                    { duffelOrderId: orderId },
                    {
                        $set: { status: 'failed' },
                        $push: {
                            adminNotes: createAdminNote(
                                `❌ Order creation failed: ${failureReason}`,
                            ),
                        },
                    },
                );
                console.log(
                    `❌ Order failed | ${orderId} | ${failureReason}`,
                );
                break;
            }

            // ════════════════════════════════════════
            // 🔄 ORDER CHANGED — DELAYED TICKET FALLBACK
            // ════════════════════════════════════════
            case 'air.order.changed': {
                const orderId = data.order_id || data.id;
                if (!orderId) {
                    console.warn('⚠️ air.order.changed: No orderId found. Skipping.');
                    break;
                }

                const booking = await Booking.findOne({
                    duffelOrderId: orderId,
                });

                if (!booking) {
                    console.warn(
                        `⚠️ air.order.changed: No booking for ${orderId}`,
                    );
                    break;
                }

                const isFullyProcessed =
                    booking.status === 'issued' && booking.emailSent === true;

                if (!isFullyProcessed) {
                    // ── Not fully processed yet ──

                    if (booking.paymentStatus !== 'captured') {
                        // Payment hasn't been captured by issue-ticket API yet.
                        // Ignore — issue-ticket API will handle everything.
                        console.log(
                            `⏭️ air.order.changed: Payment not captured yet for ${orderId}. Ignoring.`,
                        );
                        break;
                    }

                    // ✅ Payment IS captured but ticket not issued — delayed ticket fallback
                    console.log(
                        `🎯 air.order.changed: Delayed ticket fallback for ${orderId}`,
                    );

                    await Booking.findByIdAndUpdate(booking._id, {
                        $push: {
                            adminNotes: createAdminNote(
                                `🔔 Webhook: Delayed ticket detected. Attempting issuance for order ${orderId}.`,
                            ),
                        },
                    }).catch(() => {});

                    await handleTicketIssuance(
                        booking._id.toString(),
                        orderId,
                    );
                } else {
                    // ── Already fully issued & emailed — just sync/refresh docs ──
                    console.log(
                        `🔄 air.order.changed: Already issued. Refreshing docs for ${orderId}`,
                    );

                    try {
                        const order = await fetchOrder(orderId);

                        if (order?.documents?.length > 0) {
                            const dbDocs = mapDocsForDb(order.documents);
                            const latestPnr =
                                order.booking_reference || booking.pnr || 'N/A';

                            await Booking.findByIdAndUpdate(booking._id, {
                                $set: {
                                    documents: dbDocs,
                                    pnr: latestPnr,
                                },
                                $push: {
                                    adminNotes: createAdminNote(
                                        `🔄 Docs refreshed via webhook. PNR: ${latestPnr}. Docs: ${dbDocs.length}. Order: ${orderId}`,
                                    ),
                                },
                            });
                        }
                    } catch (fetchErr: any) {
                        console.error(
                            `⚠️ Failed to refresh docs for ${orderId}:`,
                            fetchErr.message,
                        );
                        await Booking.findByIdAndUpdate(booking._id, {
                            $push: {
                                adminNotes: createAdminNote(
                                    `⚠️ Webhook: Doc refresh failed. Error: ${fetchErr.message}`,
                                ),
                            },
                        }).catch(() => {});
                    }

                    console.log(
                        `ℹ️ Order changed (post-issuance) | PNR: ${booking.pnr}`,
                    );
                }
                break;
            }

            // ════════════════════════════════════════
            // 📋 CANCELLATION REQUESTED
            // ════════════════════════════════════════
            case 'order_cancellation.created': {
                const orderId = data.order_id;
                if (!orderId) break;

                await Booking.findOneAndUpdate(
                    { duffelOrderId: orderId },
                    {
                        $push: {
                            adminNotes: createAdminNote(
                                `📋 Cancellation requested. ID: ${data.id || 'N/A'}`,
                            ),
                        },
                    },
                );
                console.log(
                    `📋 Cancellation requested | ${orderId}`,
                );
                break;
            }

            // ════════════════════════════════════════
            // ✅ CANCELLATION CONFIRMED
            // ════════════════════════════════════════
            case 'order_cancellation.confirmed': {
                const orderId = data.order_id;
                if (!orderId) break;

                const order = await fetchOrder(orderId);
                const refundInfo = order
                    ? `Refund: ${order.total_amount || 'N/A'} ${order.total_currency || ''}`
                    : 'Could not fetch refund details';

                await Booking.findOneAndUpdate(
                    { duffelOrderId: orderId },
                    {
                        $set: {
                            status: 'cancelled',
                            paymentStatus: 'refunded',
                        },
                        $push: {
                            adminNotes: createAdminNote(
                                `❌ Cancellation confirmed. ${refundInfo}. ID: ${data.id || 'N/A'}`,
                            ),
                        },
                    },
                );
                console.log(
                    `❌ Cancellation confirmed | ${orderId}`,
                );
                break;
            }

            // ════════════════════════════════════════
            // ⚠️ AIRLINE CHANGE
            // ════════════════════════════════════════
            case 'order.airline_initiated_change_detected': {
                const orderId = data.id || data.order_id;
                if (!orderId) break;

                const order = await fetchOrder(orderId);

                await Booking.findOneAndUpdate(
                    { duffelOrderId: orderId },
                    {
                        $set: {
                            airlineInitiatedChanges:
                                order || data,
                        },
                        $push: {
                            adminNotes: createAdminNote(
                                `⚠️ Airline schedule change. Order: ${orderId}. Review required.`,
                            ),
                        },
                    },
                );
                console.log(
                    `⚠️ Airline change | ${orderId}`,
                );
                break;
            }

            // ════════════════════════════════════════
            // 🏓 PING
            // ════════════════════════════════════════
            case 'ping.triggered': {
                console.log('🏓 Ping OK');
                break;
            }

            // ════════════════════════════════════════
            // 🔕 IGNORED EVENTS
            // ════════════════════════════════════════
            case 'air.payment.succeeded':
            case 'air.payment.failed':
            case 'air.payment.pending':
            case 'air.payment.cancelled':
            default: {
                console.log(`❓ Unhandled: ${type}`);
            }
        }

        return NextResponse.json(
            { success: true },
            { status: 200 },
        );
    } catch (error: any) {
        console.error(
            '🔥 Webhook error:',
            error.message,
            error.stack,
        );
        return NextResponse.json(
            { success: false, message: 'Internal error' },
            { status: 200 },
        );
    }
}