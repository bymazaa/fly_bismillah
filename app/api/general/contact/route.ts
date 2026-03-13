import { sendContactSubmissionEmail } from '@/app/emails/email';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, phone, subject, message } = body;

        if (!name || !email || !message) {
            return NextResponse.json(
                { message: 'Name, Email, and Message are required.' },
                { status: 400 },
            );
        }

  
        const result = await sendContactSubmissionEmail( { 
            name, 
            email, 
            phone, 
            subject, 
            message 
        });

        if (!result.success) {
            return NextResponse.json(
                { message: 'Failed to send email. Please try again later.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully!',
        });

    } catch (error) {
        console.error('Contact API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}