import z from 'zod';
// 1. Zod Schema Definition

//contact form
export const contactFormSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(30, { message: 'Name cannot exceed 30 characters.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    phone: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }),
    subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }).max(100, { message: 'Subject cannot exceed 100 characters.' }),
    message: z.string().min(10, { message: 'Message must be at least 10 characters.' }).max(1000, { message: 'Message cannot exceed 1000 characters.' }),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

//Account validation

// 1. Login Schema
export const loginSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

// 2. Register Schema
export const registerSchema = z
    .object({
        name: z.string().min(3, { message: 'Name is too short' }),
        email: z.string().email({ message: 'Invalid email address' }),
        phone: z.string().min(10, { message: 'Phone number must be at least 10 digits' }),
        password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'], // Error message will show under confirmPassword field
    });

// Types Export
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

// 1. Forgot Password Schema (Email only)
export const forgotPasswordSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
});

// 2. New Password Schema (Password + Confirm)
export const newPasswordSchema = z
    .object({
        password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type NewPasswordValues = z.infer<typeof newPasswordSchema>;

// 🟢 1. Common Fields for Travelers & Class (Re-usable)
const travelerAndClassSchema = {
    adults: z.string().default('1'),
    children: z.string().default('0'),
    infants: z.string().default('0'),
    travelClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY'),
};

// 🟢 2. One Way Flight Search Schema
export const searchSchema = z.object({
    from: z
        .string()
        .min(3, { message: 'Enter 3-letter Airport Code (e.g. DAC)' })
        .regex(/^[a-zA-Z]+$/, { message: 'Only letters allowed' })
        .transform((val) => val.toUpperCase()),

    to: z
        .string()
        .min(3, { message: 'Enter 3-letter Airport Code (e.g. JED)' })
        .regex(/^[a-zA-Z]+$/, { message: 'Only letters allowed' })
        .transform((val) => val.toUpperCase()),

    date: z.string().refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
        message: 'Date cannot be in the past',
    }),

    // Add Common Fields
    ...travelerAndClassSchema,
});

export type SearchInputs = z.infer<typeof searchSchema>;


// We extend searchSchema to inherit from, to, date, adults, children, etc.
export const roundTripSchema = searchSchema
    .extend({
        returnDate: z.string().min(1, 'Return date is required'),
    })
    .refine((data) => new Date(data.returnDate) >= new Date(data.date), {
        message: 'Return date cannot be before departure date',
        path: ['returnDate'],
    });

export type RoundTripInputs = z.infer<typeof roundTripSchema>;

//  4. Multi City Flight Search Schema
export const multiCitySchema = z.object({
    legs: z
        .array(
            z.object({
                from: z
                    .string()
                    .min(3, 'Origin is required')
                    .transform((val) => val.toUpperCase()),
                to: z
                    .string()
                    .min(3, 'Destination is required')
                    .transform((val) => val.toUpperCase()),
                date: z
                    .string()
                    .min(1, 'Date is required')
                    .refine(
                        (val) => {
                            const selected = new Date(val);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return selected >= today;
                        },
                        { message: 'Past date not allowed' },
                    ),
            }),
        )
        .min(2, 'Minimum 2 flights required'),

    // Add Common Fields (Travelers apply to the whole trip)
    ...travelerAndClassSchema,
});

export type MultiCityInputs = z.infer<typeof multiCitySchema>;
