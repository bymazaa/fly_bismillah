import { COOKIE_NAME, JWT_SECRET, MAX_PASSWORD, MIN_PASSWORD, SALT_ROUNDS } from '@/app/api/controller/constant';
import z from 'zod';
const passwordValidation = z.string()
  .min(MIN_PASSWORD, `Password must be at least ${MIN_PASSWORD} characters long`)
  .max(MAX_PASSWORD, `Password must be at most ${MAX_PASSWORD} characters`)
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Old password is required"), // ফ্রন্টএন্ডের নামের সাথে মিল রাখলাম
  newPassword: passwordValidation,
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;