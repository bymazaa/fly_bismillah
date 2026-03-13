// emails/NewBookingAdminEmail.tsx

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
    Button,
    Link,
} from '@react-email/components';
import * as React from 'react';

interface NewBookingAdminEmailProps {
    pnr: string;
    customerName: string;
    customerPhone: string;
    route: string;
    airline: string;
    flightDate: string;
    totalAmount: string;
    bookingId: string;
}

export default function NewBookingAdminEmail({
    pnr = 'ABC1234',
    customerName = 'John Doe',
    customerPhone = '+8801700000000',
    route = 'DAC ➝ JFK',
    airline = 'Emirates',
    flightDate = '12 Oct, 2025',
    totalAmount = '120,000',
    bookingId = '123',
}: NewBookingAdminEmailProps) {
    const year = new Date().getFullYear();
    const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://flybismillah.com'}/admin/bookings/${bookingId}`;

    return (
        <Html>
            <Tailwind>
                <Head />
                <Preview>
                    🔔 New booking — {pnr} | {customerName} | {route}
                </Preview>

                <Body className="bg-white font-sans my-0 mx-auto p-0">
                    <Container className="max-w-[560px] mx-auto px-4 py-6">
                        {/* ───── Header ───── */}
                        <Section className="text-center pb-5">
                            <Text className="text-[11px] uppercase tracking-[0.25em] text-slate-400 m-0 mb-2">
                                Fly Bismillah · Admin
                            </Text>
                            <Heading className="text-[22px] font-bold text-slate-900 m-0 leading-7">
                                New Booking Received 🔔
                            </Heading>
                            <Text className="text-[13px] text-slate-500 mt-2 mb-0">
                                A customer just placed a flight booking.
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
                                    backgroundColor: '#ecfdf5',
                                    border: '2px solid #a7f3d0',
                                    textAlign: 'center',
                                }}
                            >
                                <Text
                                    className="text-[32px] m-0 leading-none"
                                    style={{ lineHeight: '64px' }}
                                >
                                    📋
                                </Text>
                            </div>
                        </Section>

                        {/* ───── Status Badge ───── */}
                        <Section className="text-center mb-4">
                            <span
                                className="inline-block rounded-full text-[11px] font-bold uppercase px-4 py-2"
                                style={{
                                    letterSpacing: '0.12em',
                                    backgroundColor: '#fef3c7',
                                    color: '#92400e',
                                    border: '1px solid #fde68a',
                                }}
                            >
                                Action Required
                            </span>
                        </Section>

                        {/* ───── PNR ───── */}
                        <Section className="text-center pb-4">
                            <Text className="text-[10px] uppercase tracking-[0.2em] text-slate-400 m-0 mb-1">
                                Booking Reference / PNR
                            </Text>
                            <Text
                                className="font-mono text-[24px] font-bold m-0"
                                style={{
                                    letterSpacing: '0.12em',
                                    color: '#059669',
                                }}
                            >
                                {pnr}
                            </Text>
                        </Section>

                        <Hr className="border-slate-200 my-0" />

                        {/* ───── Customer Details ───── */}
                        <Section
                            className="rounded-xl px-4 py-4 my-5"
                            style={{
                                backgroundColor: '#f8fafb',
                                border: '1px solid #e8ecf0',
                            }}
                        >
                            <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-3">
                                👤 Customer
                            </Text>

                            <table
                                cellPadding={0}
                                cellSpacing={0}
                                width="100%"
                            >
                                <tr>
                                    <td style={{ padding: '6px 0' }}>
                                        <Text className="text-[12px] text-slate-500 m-0">
                                            Name
                                        </Text>
                                    </td>
                                    <td
                                        style={{
                                            padding: '6px 0',
                                            textAlign: 'right',
                                        }}
                                    >
                                        <Text className="text-[13px] font-semibold text-slate-800 m-0">
                                            {customerName}
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
                                            Phone
                                        </Text>
                                    </td>
                                    <td
                                        style={{
                                            padding: '6px 0',
                                            textAlign: 'right',
                                        }}
                                    >
                                        <Link
                                            href={`tel:${customerPhone}`}
                                            className="text-[13px] font-semibold no-underline"
                                            style={{ color: '#4f46e5' }}
                                        >
                                            {customerPhone}
                                        </Link>
                                    </td>
                                </tr>
                            </table>
                        </Section>

                        {/* ───── Booking Details ───── */}
                        <Section
                            className="rounded-xl px-4 py-4 mb-5"
                            style={{
                                backgroundColor: '#f8fafb',
                                border: '1px solid #e8ecf0',
                            }}
                        >
                            <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-3">
                                ✈️ Booking Details
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
                                            Airline
                                        </Text>
                                    </td>
                                    <td
                                        style={{
                                            padding: '6px 0',
                                            textAlign: 'right',
                                        }}
                                    >
                                        <Text className="text-[13px] font-semibold text-slate-800 m-0">
                                            {airline}
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
                                            {flightDate}
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
                                            Total Value
                                        </Text>
                                    </td>
                                    <td
                                        style={{
                                            padding: '6px 0',
                                            textAlign: 'right',
                                        }}
                                    >
                                        <span
                                            className="inline-block rounded-full text-[12px] font-bold px-3 py-1"
                                            style={{
                                                backgroundColor: '#ecfdf5',
                                                color: '#059669',
                                                border: '1px solid #a7f3d0',
                                            }}
                                        >
                                            {totalAmount} USD
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </Section>

                        {/* ───── Next Steps ───── */}
                        <Section
                            className="rounded-xl px-4 py-4 mb-5"
                            style={{
                                backgroundColor: '#eef2ff',
                                borderLeft: '3px solid #6366f1',
                            }}
                        >
                            <Text
                                className="text-[10px] font-bold uppercase tracking-[0.2em] m-0 mb-2"
                                style={{ color: '#4f46e5' }}
                            >
                                🎯 Next Steps
                            </Text>
                            <Text
                                className="text-[11px] m-0 leading-[18px]"
                                style={{ color: '#312e81' }}
                            >
                                •{' '}
                                <span className="font-bold">Review</span>{' '}
                                booking details in the dashboard.
                            </Text>
                            <Text
                                className="text-[11px] m-0 mt-1 leading-[18px]"
                                style={{ color: '#312e81' }}
                            >
                                •{' '}
                                <span className="font-bold">Verify</span>{' '}
                                payment and passenger information.
                            </Text>
                            <Text
                                className="text-[11px] m-0 mt-1 leading-[18px]"
                                style={{ color: '#312e81' }}
                            >
                                •{' '}
                                <span className="font-bold">Issue</span>{' '}
                                the e‑ticket or follow up with customer.
                            </Text>
                        </Section>

                        {/* ───── CTA Button ───── */}
                        <Section className="text-center my-6">
                            <Button
                                href={dashboardLink}
                                className="rounded-full font-bold text-[14px] text-white px-10 py-4 no-underline inline-block"
                                style={{
                                    background:
                                        'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                                }}
                            >
                                📂 Open in Dashboard
                            </Button>
                            <Text className="text-[11px] text-slate-400 mt-3 mb-0">
                                PNR:{' '}
                                <span
                                    className="font-mono font-bold"
                                    style={{ color: '#059669' }}
                                >
                                    {pnr}
                                </span>
                            </Text>
                        </Section>

                        {/* ───── Urgency ───── */}
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
                                ⏰ Time Sensitive
                            </Text>
                            <Text
                                className="text-[11px] m-0 leading-[18px]"
                                style={{ color: '#92400e' }}
                            >
                                • Process within{' '}
                                <span className="font-bold">
                                    30–60 minutes
                                </span>{' '}
                                for best experience.
                            </Text>
                            <Text
                                className="text-[11px] m-0 mt-1 leading-[18px]"
                                style={{ color: '#92400e' }}
                            >
                                • Customer is{' '}
                                <span className="font-bold">
                                    waiting for confirmation
                                </span>{' '}
                                and may call.
                            </Text>
                        </Section>

                        <Hr className="border-slate-200 my-0" />

                        {/* ───── Footer ───── */}
                        <Section className="text-center py-5">
                            <Text className="text-[12px] text-slate-500 m-0">
                                Auto-generated from{' '}
                                <span
                                    className="font-semibold"
                                    style={{ color: '#059669' }}
                                >
                                    Fly Bismillah
                                </span>{' '}
                                booking system.
                            </Text>
                            <Text className="text-[10px] text-slate-400 mt-4 mb-0">
                                © {year} Fly Bismillah · All rights
                                reserved
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}