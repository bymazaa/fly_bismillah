// emails/BookingProcessingEmail.tsx

import {
    Html,
    Head,
    Preview,
    Body,
    Container,
    Section,
    Text,
    Hr,
    Heading,
    Tailwind,
    Link,
} from '@react-email/components';
import * as React from 'react';

interface BookingProcessingEmailProps {
    customerName: string;
    bookingReference: string;
    route: string;
    flightDate: string;
}

const STATUS_STEPS = [
    { step: 'Booking Received', status: 'done' as const, icon: '✅' },
    { step: 'Ticketing In Progress', status: 'current' as const, icon: '🔄' },
    { step: 'E‑Ticket Issued', status: 'pending' as const, icon: '⬜' },
];

export default function BookingProcessingEmail({
    customerName = 'Traveler',
    bookingReference = 'PENDING',
    route = 'N/A',
    flightDate = 'Soon',
}: BookingProcessingEmailProps) {
    const year = new Date().getFullYear();

    return (
        <Html>
            <Tailwind>
                <Head />
                <Preview>
                    We&apos;re processing your booking (Ref: {bookingReference})
                </Preview>

                <Body className="bg-white font-sans my-0 mx-auto p-0">
                    <Container className="max-w-[560px] mx-auto px-4 py-6">
                        {/* ───── Header ───── */}
                        <Section className="text-center pb-5">
                            <Text className="text-[11px] uppercase tracking-[0.25em] text-slate-400 m-0 mb-2">
                                Fly Bismillah
                            </Text>
                            <Heading className="text-[22px] font-bold text-slate-900 m-0 leading-7">
                                Your Booking Is Being Processed
                            </Heading>
                            <Text className="text-[13px] text-slate-500 mt-2 mb-0">
                                We&apos;ll share your confirmed e‑ticket as soon as
                                it&apos;s issued.
                            </Text>
                        </Section>

                        <Hr className="border-slate-200 my-0" />

                        {/* ───── Status Icon ───── */}
                        <Section className="text-center py-5">
                            <div
                                className="inline-block rounded-full"
                                style={{
                                    width: 64,
                                    height: 64,
                                    lineHeight: '64px',
                                    backgroundColor: '#eef2ff',
                                    border: '2px solid #c7d2fe',
                                    textAlign: 'center',
                                }}
                            >
                                <Text
                                    className="text-[32px] m-0 leading-none"
                                    style={{ lineHeight: '64px' }}
                                >
                                    ⏳
                                </Text>
                            </div>
                        </Section>

                        {/* ───── Status Badge ───── */}
                        <Section className="text-center mb-4">
                            <span
                                className="inline-block rounded-full text-[11px] font-bold uppercase px-4 py-2"
                                style={{
                                    letterSpacing: '0.12em',
                                    backgroundColor: '#eef2ff',
                                    color: '#4338ca',
                                    border: '1px solid #c7d2fe',
                                }}
                            >
                                Processing
                            </span>
                        </Section>

                        <Hr className="border-slate-200 my-0" />

                        {/* ───── Booking Reference ───── */}
                        <Section className="text-center py-4">
                            <Text className="text-[10px] uppercase tracking-[0.2em] text-slate-400 m-0 mb-1">
                                Booking Reference
                            </Text>
                            <Text
                                className="font-mono text-[24px] font-bold m-0"
                                style={{
                                    letterSpacing: '0.12em',
                                    color: '#4f46e5',
                                }}
                            >
                                {bookingReference}
                            </Text>
                        </Section>

                        <Hr className="border-slate-200 my-0" />

                        {/* ───── Greeting ───── */}
                        <Section className="mt-5 mb-2">
                            <Text className="text-[14px] text-slate-800 leading-[24px] m-0">
                                Dear{' '}
                                <span className="font-semibold">
                                    {customerName}
                                </span>
                                ,
                            </Text>
                            <Text className="text-[14px] text-slate-600 leading-[24px] mt-3 mb-0">
                                We&apos;ve successfully received your flight
                                booking request. Our ticketing team is now
                                verifying your details and processing your
                                reservation.
                            </Text>
                        </Section>

                        {/* ───── Flight Summary ───── */}
                        <Section
                            className="rounded-xl px-4 py-4 my-5"
                            style={{
                                backgroundColor: '#f8fafb',
                                border: '1px solid #e8ecf0',
                            }}
                        >
                            <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-3">
                                ✈️ Flight Summary
                            </Text>

                            <table
                                cellPadding={0}
                                cellSpacing={0}
                                width="100%"
                            >
                                <tr>
                                    <td style={{ padding: '6px 0' }}>
                                        <Text className="text-[12px] text-slate-500 m-0">
                                            Route
                                        </Text>
                                    </td>
                                    <td
                                        style={{
                                            padding: '6px 0',
                                            textAlign: 'right',
                                        }}
                                    >
                                        <Text className="text-[13px] font-semibold text-slate-800 m-0">
                                            {route}
                                        </Text>
                                    </td>
                                </tr>
                                <tr
                                    style={{
                                        borderTop: '1px solid #f1f5f9',
                                    }}
                                >
                                    <td style={{ padding: '6px 0' }}>
                                        <Text className="text-[12px] text-slate-500 m-0">
                                            Travel Date
                                        </Text>
                                    </td>
                                    <td
                                        style={{
                                            padding: '6px 0',
                                            textAlign: 'right',
                                        }}
                                    >
                                        <Text className="text-[13px] font-semibold text-slate-800 m-0">
                                            📅 {flightDate}
                                        </Text>
                                    </td>
                                </tr>
                            </table>
                        </Section>

                        {/* ───── Status Steps ───── */}
                        <Section
                            className="rounded-xl px-4 py-4 mb-5"
                            style={{
                                backgroundColor: '#f8fafb',
                                border: '1px solid #e8ecf0',
                            }}
                        >
                            <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-3">
                                📊 Booking Status
                            </Text>

                            <table
                                cellPadding={0}
                                cellSpacing={0}
                                width="100%"
                            >
                                {STATUS_STEPS.map((item, i) => (
                                    <tr
                                        key={i}
                                        style={{
                                            borderTop:
                                                i > 0
                                                    ? '1px solid #f1f5f9'
                                                    : 'none',
                                        }}
                                    >
                                        <td
                                            style={{
                                                width: 28,
                                                padding: '8px 0',
                                                verticalAlign: 'middle',
                                            }}
                                        >
                                            <Text className="m-0 text-[14px]">
                                                {item.icon}
                                            </Text>
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px 0',
                                                verticalAlign: 'middle',
                                            }}
                                        >
                                            <Text
                                                className="m-0 text-[12px]"
                                                style={{
                                                    color:
                                                        item.status === 'done'
                                                            ? '#065f46'
                                                            : item.status ===
                                                                'current'
                                                              ? '#4338ca'
                                                              : '#94a3b8',
                                                    fontWeight:
                                                        item.status ===
                                                        'current'
                                                            ? 700
                                                            : 500,
                                                }}
                                            >
                                                {item.step}
                                            </Text>
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px 0',
                                                textAlign: 'right',
                                                verticalAlign: 'middle',
                                            }}
                                        >
                                            <span
                                                className="inline-block rounded-full text-[9px] font-bold uppercase px-3 py-1"
                                                style={{
                                                    letterSpacing: '0.08em',
                                                    backgroundColor:
                                                        item.status === 'done'
                                                            ? '#ecfdf5'
                                                            : item.status ===
                                                                'current'
                                                              ? '#eef2ff'
                                                              : '#f1f5f9',
                                                    color:
                                                        item.status === 'done'
                                                            ? '#065f46'
                                                            : item.status ===
                                                                'current'
                                                              ? '#4338ca'
                                                              : '#94a3b8',
                                                }}
                                            >
                                                {item.status === 'done'
                                                    ? 'Complete'
                                                    : item.status === 'current'
                                                      ? 'In Progress'
                                                      : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </table>
                        </Section>

                        {/* ───── What Happens Next ───── */}
                        <Section
                            className="rounded-xl px-4 py-4 mb-5"
                            style={{
                                backgroundColor: '#ecfdf5',
                                borderLeft: '3px solid #10b981',
                            }}
                        >
                            <Text
                                className="text-[10px] font-bold uppercase tracking-[0.2em] m-0 mb-2"
                                style={{ color: '#059669' }}
                            >
                                ✅ What happens next?
                            </Text>
                            <Text
                                className="text-[11px] m-0 leading-[18px]"
                                style={{ color: '#065f46' }}
                            >
                                • Our team confirms availability and
                                fares.
                            </Text>
                            <Text
                                className="text-[11px] m-0 mt-1 leading-[18px]"
                                style={{ color: '#065f46' }}
                            >
                                • Your ticket is issued by the airline.
                            </Text>
                            <Text
                                className="text-[11px] m-0 mt-1 leading-[18px]"
                                style={{ color: '#065f46' }}
                            >
                                • You receive a separate email with your{' '}
                                <span className="font-bold">
                                    confirmed E‑Ticket
                                </span>
                                .
                            </Text>
                        </Section>

                        {/* ───── Reminder ───── */}
                        <Section
                            className="rounded-xl px-4 py-3 mb-5"
                            style={{
                                backgroundColor: '#fffbeb',
                                borderLeft: '3px solid #f59e0b',
                            }}
                        >
                            <Text
                                className="text-[10px] font-bold uppercase tracking-[0.2em] m-0 mb-2"
                                style={{ color: '#d97706' }}
                            >
                                ⚠ Please Note
                            </Text>
                            <Text
                                className="text-[11px] m-0 leading-[18px]"
                                style={{ color: '#92400e' }}
                            >
                                If you don&apos;t receive a confirmation
                                within{' '}
                                <span className="font-bold">
                                    30–60 minutes
                                </span>
                                , please contact our support team to verify
                                your booking status.
                            </Text>
                        </Section>

                        {/* ───── Need Help ───── */}
                        <Section
                            className="rounded-xl px-4 py-3 mb-5"
                            style={{
                                backgroundColor: '#eff6ff',
                                borderLeft: '3px solid #3b82f6',
                            }}
                        >
                            <Text
                                className="text-[10px] font-bold uppercase tracking-[0.2em] m-0 mb-2"
                                style={{ color: '#1d4ed8' }}
                            >
                                💬 Need Help?
                            </Text>
                            <Text
                                className="text-[11px] m-0 leading-[18px]"
                                style={{ color: '#1e40af' }}
                            >
                                Reply to this email or{' '}
                                <Link
                                    href="https://flybismillah.com/contact"
                                    className="font-bold no-underline"
                                    style={{ color: '#1d4ed8' }}
                                >
                                    contact support
                                </Link>{' '}
                                — we&apos;re here 24/7.
                            </Text>
                        </Section>

                        <Hr className="border-slate-200 my-0" />

                        {/* ───── Footer ───── */}
                        <Section className="text-center py-5">
                            <Text className="text-[12px] text-slate-500 m-0">
                                Thank you for choosing{' '}
                                <span
                                    className="font-semibold"
                                    style={{ color: '#4f46e5' }}
                                >
                                    Fly Bismillah
                                </span>{' '}
                                ✨
                            </Text>
                            <Text className="text-[10px] text-slate-400 mt-4 mb-0">
                                © {year} Fly Bismillah · All rights reserved
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}