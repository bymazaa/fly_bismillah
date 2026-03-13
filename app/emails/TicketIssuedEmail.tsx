// emails/TicketIssuedEmail.tsx

import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
    Tailwind,
} from '@react-email/components';
import * as React from 'react';

interface Props {
    customerName: string;
    pnr: string;
    airline: string;
    flightDate: string;
    route: string;
    ticketUrl: string;
    passengers: { name: string; type: string }[];
}

export default function TicketIssuedEmail({
    customerName = 'Valued Customer',
    pnr = 'N/A',
    airline = 'Airline',
    flightDate = 'N/A',
    route = 'N/A',
    ticketUrl = '',
    passengers = [],
}: Props) {
    const year = new Date().getFullYear();
    const hasDownload = ticketUrl && ticketUrl.startsWith('http');

    // Passenger type labels
    const typeLabel = (type: string) => {
        const map: Record<string, string> = {
            adult: 'Adult',
            child: 'Child',
            infant: 'Infant',
            infant_without_seat: 'Infant',
        };
        return map[type?.toLowerCase()] || type || 'Adult';
    };

    return (
        <Html>
            <Tailwind>
                <Head />
                <Preview>
                    ✈️ E-Ticket Issued — PNR: {pnr} | {route}
                </Preview>

                <Body className="bg-white font-sans my-0 mx-auto p-0">
                    <Container className="max-w-[560px] mx-auto px-4 py-6">
                        {/* ───── Header ───── */}
                        <Section className="text-center pb-5">
                            <Text className="text-[11px] uppercase tracking-[0.25em] text-slate-400 m-0 mb-2">
                                Fly Bismillah
                            </Text>
                            <Heading className="text-[22px] font-bold text-slate-900 m-0 leading-7">
                                E-Ticket Issued Successfully ✈️
                            </Heading>
                            <Text className="text-[13px] text-slate-500 mt-2 mb-0">
                                Your flight ticket has been confirmed and issued.
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
                                    🎫
                                </Text>
                            </div>
                        </Section>

                        {/* ───── Status Badge ───── */}
                        <Section className="text-center mb-4">
                            <span
                                className="inline-block rounded-full text-[11px] font-bold uppercase px-4 py-2"
                                style={{
                                    letterSpacing: '0.12em',
                                    backgroundColor: '#ecfdf5',
                                    color: '#065f46',
                                    border: '1px solid #a7f3d0',
                                }}
                            >
                                Ticket Confirmed
                            </span>
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
                                Your e-ticket for{' '}
                                <span className="font-semibold text-slate-800">
                                    {airline}
                                </span>{' '}
                                flight has been{' '}
                                <span
                                    className="font-bold"
                                    style={{ color: '#059669' }}
                                >
                                    successfully issued
                                </span>
                                . Below are your booking details.
                            </Text>
                        </Section>

                        {/* ───── Flight Details ───── */}
                        <Section
                            className="rounded-xl px-4 py-4 my-5"
                            style={{
                                backgroundColor: '#f8fafb',
                                border: '1px solid #e8ecf0',
                            }}
                        >
                            <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-3">
                                ✈️ Flight Details
                            </Text>

                            <table
                                cellPadding={0}
                                cellSpacing={0}
                                width="100%"
                            >
                                <tr>
                                    <td style={{ padding: '6px 0' }}>
                                        <Text className="text-[12px] text-slate-500 m-0">
                                            PNR / Booking Ref
                                        </Text>
                                    </td>
                                    <td
                                        style={{
                                            padding: '6px 0',
                                            textAlign: 'right',
                                        }}
                                    >
                                        <Text
                                            className="text-[13px] font-bold m-0"
                                            style={{ color: '#1a56db' }}
                                        >
                                            {pnr}
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
                                        <Text className="text-[12px] font-semibold text-slate-800 m-0">
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
                                            Route
                                        </Text>
                                    </td>
                                    <td
                                        style={{
                                            padding: '6px 0',
                                            textAlign: 'right',
                                        }}
                                    >
                                        <Text className="text-[12px] font-semibold text-slate-800 m-0">
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
                                            Flight Date
                                        </Text>
                                    </td>
                                    <td
                                        style={{
                                            padding: '6px 0',
                                            textAlign: 'right',
                                        }}
                                    >
                                        <Text className="text-[12px] font-semibold text-slate-800 m-0">
                                            {flightDate}
                                        </Text>
                                    </td>
                                </tr>
                            </table>
                        </Section>

                        {/* ───── Passengers ───── */}
                        {passengers.length > 0 && (
                            <Section
                                className="rounded-xl px-4 py-4 mb-5"
                                style={{
                                    backgroundColor: '#f8fafb',
                                    border: '1px solid #e8ecf0',
                                }}
                            >
                                <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-3">
                                    👥 Passengers ({passengers.length})
                                </Text>

                                <table
                                    cellPadding={0}
                                    cellSpacing={0}
                                    width="100%"
                                >
                                    {passengers.map((p, i) => (
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
                                                    padding: '8px 0',
                                                }}
                                            >
                                                <Text className="text-[12px] font-semibold text-slate-800 m-0">
                                                    {i + 1}. {p.name}
                                                </Text>
                                            </td>
                                            <td
                                                style={{
                                                    padding: '8px 0',
                                                    textAlign: 'right',
                                                }}
                                            >
                                                <span
                                                    className="inline-block rounded-full text-[10px] font-bold uppercase px-3 py-1"
                                                    style={{
                                                        letterSpacing:
                                                            '0.08em',
                                                        backgroundColor:
                                                            p.type?.toLowerCase() ===
                                                            'infant'
                                                                ? '#fef3c7'
                                                                : p.type?.toLowerCase() ===
                                                                    'child'
                                                                  ? '#e0f2fe'
                                                                  : '#f0fdf4',
                                                        color:
                                                            p.type?.toLowerCase() ===
                                                            'infant'
                                                                ? '#92400e'
                                                                : p.type?.toLowerCase() ===
                                                                    'child'
                                                                  ? '#0c4a6e'
                                                                  : '#166534',
                                                        border: `1px solid ${
                                                            p.type?.toLowerCase() ===
                                                            'infant'
                                                                ? '#fde68a'
                                                                : p.type?.toLowerCase() ===
                                                                    'child'
                                                                  ? '#bae6fd'
                                                                  : '#bbf7d0'
                                                        }`,
                                                    }}
                                                >
                                                    {typeLabel(p.type)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </table>
                            </Section>
                        )}

                        {/* ───── Download / Status ───── */}
                        {hasDownload ? (
                            <>
                                {/* ── Success Box ── */}
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
                                        ✅ Ticket Ready
                                    </Text>
                                    <Text
                                        className="text-[12px] m-0 leading-[20px]"
                                        style={{ color: '#065f46' }}
                                    >
                                        Your e-ticket is ready for download.
                                        Click the button below to get your
                                        ticket PDF. You can also access it
                                        anytime from your booking portal.
                                    </Text>
                                </Section>

                                {/* ── Download Button ── */}
                                <Section className="text-center my-6">
                                    <Button
                                        href={ticketUrl}
                                        className="rounded-full font-bold text-[14px] text-white px-10 py-4 no-underline inline-block"
                                        style={{
                                            background:
                                                'linear-gradient(135deg, #1a56db 0%, #3b82f6 100%)',
                                        }}
                                    >
                                        📥 Download E-Ticket (PDF)
                                    </Button>
                                </Section>
                            </>
                        ) : (
                            <>
                                {/* ── No URL — Contact Box ── */}
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
                                        ✅ Ticket Issued
                                    </Text>
                                    <Text
                                        className="text-[12px] m-0 leading-[20px]"
                                        style={{ color: '#065f46' }}
                                    >
                                        Your e-ticket has been successfully
                                        issued. Please contact our support team
                                        to receive your ticket copy, or check
                                        your booking portal for updates.
                                    </Text>
                                </Section>

                                {/* ── Contact Button ── */}
                                <Section className="text-center my-6">
                                    <Button
                                        href="https://flybismillah.com/contact"
                                        className="rounded-full font-bold text-[14px] text-white px-10 py-4 no-underline inline-block"
                                        style={{
                                            background:
                                                'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                                        }}
                                    >
                                        📞 Contact Support
                                    </Button>
                                </Section>
                            </>
                        )}

                        {/* ───── Important Reminders ───── */}
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
                                📌 Important Reminders
                            </Text>
                            <Text
                                className="text-[11px] m-0 leading-[18px]"
                                style={{ color: '#92400e' }}
                            >
                                • Carry a{' '}
                                <span className="font-bold">
                                    printed or digital copy
                                </span>{' '}
                                of your e-ticket to the airport.
                            </Text>
                            <Text
                                className="text-[11px] m-0 mt-1 leading-[18px]"
                                style={{ color: '#92400e' }}
                            >
                                • Arrive at least{' '}
                                <span className="font-bold">
                                    3 hours early
                                </span>{' '}
                                for international flights.
                            </Text>
                            <Text
                                className="text-[11px] m-0 mt-1 leading-[18px]"
                                style={{ color: '#92400e' }}
                            >
                                • Carry a{' '}
                                <span className="font-bold">
                                    valid passport / government-issued ID
                                </span>{' '}
                                matching your ticket name.
                            </Text>
                            <Text
                                className="text-[11px] m-0 mt-1 leading-[18px]"
                                style={{ color: '#92400e' }}
                            >
                                • Check your airline's{' '}
                                <span className="font-bold">
                                    baggage policy
                                </span>{' '}
                                before packing.
                            </Text>
                        </Section>

                        {/* ───── Need Help Box ───── */}
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
                                For any changes, cancellations, or queries
                                regarding your booking, please contact our
                                support team. We're here to help you 24/7.
                            </Text>
                        </Section>

                        <Hr className="border-slate-200 my-0" />

                        {/* ───── Footer ───── */}
                        <Section className="text-center py-5">
                            <Text className="text-[12px] text-slate-500 m-0">
                                Thank you for choosing{' '}
                                <span
                                    className="font-semibold"
                                    style={{ color: '#1a56db' }}
                                >
                                    Fly Bismillah
                                </span>{' '}
                                ✨
                            </Text>
                            <Text className="text-[11px] text-slate-400 mt-2 mb-0">
                                Have questions? Reply to this email or contact
                                our support team.
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