import { Resend } from 'resend';
import TeamInvite from './TeamInvite';
import ForgotPassword from './ForgotPassword';
import PasswordChanged from './PasswordChanged';
import TwoFactorStatus from './TwoFactorStatus';
import ContactSubmission from './ContactSubmission';
import AdminMessageEmail from './AdminMessageEmail';
import BookingProcessingEmail from './BookingProcessingEmail';
import NewBookingAdminEmail from './NewBookingAdminEmail';
import TicketIssuedEmail from './TicketIssuedEmail';
import { format, parseISO } from 'date-fns';
import PackageBookingEmail, { PackageBookingEmailProps } from './PackageBookingEmail';
import { websiteDetails } from '@/constant/data';

// Environment Variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL as string;
// Assuming ADMIN_BUSINESS_EMAIL contains the domain (e.g., "themaza.shop")
const ADMIN_BUSINESS_EMAIL = process.env.ADMIN_BUSINESS_EMAIL || 'themaza.shop';

const resend = new Resend(process.env.RESEND_API_KEY);

// 1. Send Team Invite Email
export async function sendTeamInviteEmail(
    email: string,
    data: { invitedBy: string; invitedName: string; role: string; link: string },
) {
    try {
        await resend.emails.send({
            from: `Fly Bismillah <team@${ADMIN_BUSINESS_EMAIL}>`, // ✅ Updated
            to: email,
            subject: `Invitation to join Fly Bismillah as ${data.role}`,
            react: TeamInvite({
                invitedBy: data.invitedBy,
                invitedName: data.invitedName,
                invitedRole: data.role,
                inviteLink: data.link,
            }),
        });
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}

// 2. Send Forgot Password Email
export async function sendForgotPasswordEmail(email: string, data: { name: string; link: string }) {
    try {
        await resend.emails.send({
            from: `Fly Bismillah <security@${ADMIN_BUSINESS_EMAIL}>`, // ✅ Updated
            to: email,
            subject: 'Reset your password',
            react: ForgotPassword({
                userName: data.name,
                resetLink: data.link,
            }),
        });
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}

// 3. Send Password Changed Email
export async function sendPasswordChangedEmail(email: string, userName: string) {
    try {
        await resend.emails.send({
            from: `Fly Bismillah <security@${ADMIN_BUSINESS_EMAIL}>`, // ✅ Updated
            to: email,
            subject: 'Your password was changed',
            react: PasswordChanged({ userName }),
        });
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

// 4. Send 2FA Status Email
export async function send2FAStatusEmail(
    email: string,
    data: {
        userName: string;
        status: 'enabled' | 'disabled';
        ip?: string;
        location?: string;
        deviceInfo?: string;
    },
) {
    try {
        await resend.emails.send({
            from: `Fly Bismillah <security@${ADMIN_BUSINESS_EMAIL}>`, // ✅ Updated
            to: email,
            subject: `Security Alert: 2FA ${data.status === 'enabled' ? 'Enabled' : 'Disabled'}`,
            react: TwoFactorStatus({
                userName: data.userName,
                status: data.status,
                location: data.location || 'Unknown Location',
            }),
        });
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}

// 5. Send Contact Submission Email
export async function sendContactSubmissionEmail(data: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
}) {
    try {
        const { data: result, error } = await resend.emails.send({
            from: `Fly Bismillah <onboarding@${ADMIN_BUSINESS_EMAIL}>`, // ✅ Updated
            to: ADMIN_EMAIL,
            subject: `New Inquiry: ${data.subject}`,
            react: ContactSubmission({
                name: data.name,
                email: data.email,
                phone: data.phone,
                subject: data.subject,
                message: data.message,
            }),
        });

        if (error) {
            return { success: false, error };
        }

        return { success: true, id: result?.id };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

interface SendEmailParams {
    to: string;
    subject: string;
    message: string;
    name?: string;
}

// 6. Send Generic Email via Resend
export const sendEmailViaResend = async ({ to, subject, message, name }: SendEmailParams) => {
    try {
        const { data, error } = await resend.emails.send({
            from: `Fly Bismillah <onboarding@${ADMIN_BUSINESS_EMAIL}>`, // ✅ Updated
            to: [to],
            subject: subject,
            react: AdminMessageEmail({
                subject,
                message,
                recipientName: 'Fly Bismillah Team Member',
            }),
        });

        if (error) {
            console.error('Resend Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (err) {
        console.error('Sending Failed:', err);
        return { success: false, error: err };
    }
};

interface ProcessingEmailParams {
    to: string;
    customerName: string;
    bookingReference: string;
    route: string;
    flightDate: string;
}

// 7. Send Booking Processing Email
export const sendBookingProcessingEmail = async ({
    to,
    customerName,
    bookingReference,
    route,
    flightDate,
}: ProcessingEmailParams) => {
    try {
        const { data, error } = await resend.emails.send({
            from: `Fly Bismillah <onboarding@${ADMIN_BUSINESS_EMAIL}>`, // ✅ Updated
            to: [to],
            subject: `Booking Processing - Ref: ${bookingReference}`,
            react: BookingProcessingEmail({
                customerName,
                bookingReference,
                route,
                flightDate,
            }),
        });

        if (error) {
            console.error('Resend Error:', error);
            return { success: false, error };
        }

        return { success: true, messageId: data?.id };
    } catch (err) {
        console.error('Email Sending Failed:', err);
        return { success: false, error: err };
    }
};

interface AdminEmailParams {
    pnr: string;
    customerName: string;
    customerPhone: string;
    route: string;
    airline: string;
    flightDate: string;
    totalAmount: number;
    bookingId: string;
}

// 8. Send New Booking Notification to Admin
export const sendNewBookingAdminNotification = async (params: AdminEmailParams) => {
    try {
        const { data, error } = await resend.emails.send({
            from: `System Bot <notifications@${ADMIN_BUSINESS_EMAIL}>`, // ✅ Consistent with others
            to: [ADMIN_EMAIL], // ✅ Uses the Admin Email variable
            subject: `[New Booking] ${params.route} - ${params.customerName}`,
            react: NewBookingAdminEmail({
                ...params,
                totalAmount: params.totalAmount.toLocaleString(),
            }),
        });

        if (error) {
            console.error('Admin Email Error:', error);
            return { success: false, error };
        }

        return { success: true, messageId: data?.id };
    } catch (err) {
        console.error('Admin Email Failed:', err);
        return { success: false, error: err };
    }
};




export async function sendPackageBookingEmail(data: PackageBookingEmailProps) {
    const adminEmail = ADMIN_EMAIL || websiteDetails.email;

    // Admin e-mail
    const adminSendPromise = resend.emails.send({
        from: `Fly Bismillah <package@${ADMIN_BUSINESS_EMAIL}>`,
        to: adminEmail,
        subject: `New Booking: ${data.packageTitle || 'Package'}`,
        react: PackageBookingEmail(data),
    });

    return adminSendPromise
}


interface BookingData {
    pnr: string;
    contact: { email: string; phone?: string };
    passengers: any[];
    flightDetails: {
        airline: string;
        route: string;
        departureDate: string;
    };
    documents: { url: string; unique_identifier: string }[];
}

export async function sendTicketIssuedEmail(
    booking: BookingData,
): Promise<{ success: boolean; messageId?: string; error?: any }> {
    try {
        if (!booking.contact?.email) {
            return { success: false, error: 'No email address' };
        }

        const ticketDoc =
            booking.documents?.find((d) => d.url && d.url.startsWith('http')) ||
            booking.documents?.[0];
        const ticketUrl = ticketDoc?.url || '';

        const formattedPassengers = (booking.passengers || []).map((p: any) => ({
            name: `${p.title ? p.title + '. ' : ''}${p.firstName || p.first_name || ''} ${p.lastName || p.last_name || ''}`.trim(),
            type: p.type || p.passenger_type || 'adult',
        }));

        if (formattedPassengers.length === 0) {
            return { success: false, error: 'No passengers' };
        }

        // ✅ FIX: Handle Date objects, strings, and edge cases
        let flightDate = 'N/A';
        try {
            const raw = booking.flightDetails?.departureDate as any;
            if (raw) {
                let parsed: Date;

                if (raw instanceof Date) {
                    // ✅ MongoDB Date object — use directly
                    parsed = raw;
                } else if (typeof raw === 'string') {
                    // ✅ ISO string or date string
                    parsed = raw.includes('T') ? parseISO(raw) : new Date(raw);
                } else {
                    // ✅ Number (timestamp) or other — try Date constructor
                    parsed = new Date(raw);
                }

                if (!isNaN(parsed.getTime())) {
                    flightDate = format(parsed, 'dd MMM, yyyy');
                }
            }
        } catch {
            // ✅ FIX: NEVER pass raw value — always convert to string
            const fallback = booking.flightDetails?.departureDate as any;
            if (fallback instanceof Date) {
                flightDate = format(fallback, 'dd MMM, yyyy');
            } else if (fallback) {
                flightDate = String(fallback);
            } else {
                flightDate = 'N/A';
            }
        }

        const { data, error } = await resend.emails.send({
            from: `Fly Bismillah <tickets@${ADMIN_BUSINESS_EMAIL}>`,
            to: [booking.contact.email],
            subject: `E-Ticket Issued - PNR: ${booking.pnr}`,
            react: TicketIssuedEmail({
                customerName: formattedPassengers[0].name || 'Valued Customer',
                pnr: booking.pnr || 'N/A',
                airline: booking.flightDetails?.airline || 'Airline',
                flightDate, // ✅ Always a string now
                route: booking.flightDetails?.route || 'N/A',
                ticketUrl,
                passengers: formattedPassengers,
            }),
        });

        if (error) return { success: false, error };

        return { success: true, messageId: data?.id };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}