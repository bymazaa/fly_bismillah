import { z } from "zod";

// =============================================
// HELPERS
// =============================================

/** Luhn algorithm — credit card checksum */
const isValidLuhn = (val: string): boolean => {
  if (!val) return false;
  let checksum = 0;
  let j = 1;
  for (let i = val.length - 1; i >= 0; i--) {
    let calc = Number(val.charAt(i)) * j;
    if (calc > 9) {
      checksum = checksum + 1;
      calc = calc - 10;
    }
    checksum = checksum + calc;
    j = j === 1 ? 2 : 1;
  }
  return checksum % 10 === 0;
};

/** 6 months from today — handles month overflow (e.g. Aug 31 → Feb 28) */
const getSixMonthsFromNow = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(
    today.getFullYear(),
    today.getMonth() + 6,
    today.getDate()
  );
  if (target.getDate() !== today.getDate()) target.setDate(0);
  return target;
};

/** Age from YYYY-MM-DD string */
const calculateAge = (dob: string): number => {
  const born = new Date(dob + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let age = today.getFullYear() - born.getFullYear();
  const m = today.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--;
  return age;
};

// =============================================
// PASSENGER SCHEMA
// =============================================

const passengerSchema = z
  .object({
    // ── Type ──
    // NOTE: 'infant' is a UI alias — normalizePassengerTypes()
    // converts it to 'infant_without_seat' before API submission.
    // Backend only accepts 'infant_without_seat'.
    type: z.enum(["adult", "child", "infant", "infant_without_seat"], {
      message: "Passenger type must be adult, child, or infant.",
    }),

    // ── id is intentionally excluded ──
    // Backend assigns Duffel passenger IDs from the offer by type-matching.
    // Never send id from frontend — it will be ignored anyway.

    // ── Names ──
    // ✅ FIX 1: Added hyphens + apostrophes to match backend regex
    // Supports names like O'Brien, Mary-Jane, Al-Rashid
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters.")
      .max(50, "First name is too long (max 50 characters).")
      .regex(
        /^[a-zA-Z\s\-']+$/,
        "Only letters, spaces, hyphens, and apostrophes are allowed."
      ),

    // ✅ FIX 2: Added max length + hyphens/apostrophes
    middleName: z
      .string()
      .trim()
      .max(50, "Middle name is too long (max 50 characters).")
      .regex(
        /^[a-zA-Z\s\-']*$/,
        "Only letters, spaces, hyphens, and apostrophes are allowed."
      )
      .optional()
      .or(z.literal("")),

    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters.")
      .max(50, "Last name is too long (max 50 characters).")
      .regex(
        /^[a-zA-Z\s\-']+$/,
        "Only letters, spaces, hyphens, and apostrophes are allowed."
      ),

    // ── Gender ──
    gender: z.enum(["male", "female"], {
      message: "Gender must be male or female.",
    }),

    // ── Date of Birth ──
    // ✅ FIX 3: date < today (strict), not <= today — today's date not allowed
    dob: z
      .string()
      .min(1, "Date of birth is required.")
      .refine(
        (d) => /^\d{4}-\d{2}-\d{2}$/.test(d),
        "Date must be in YYYY-MM-DD format."
      )
      .refine(
        (d) => !isNaN(new Date(d + "T00:00:00").getTime()),
        "Invalid date."
      )
      .refine((d) => {
        const date = new Date(d + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today; // ← strict: today not allowed
      }, "Date of birth cannot be today or in the future."),

    // ── Passport ──
    passportNumber: z
      .string()
      .trim()
      .min(1, "Passport number is required.")
      .toUpperCase()
      .regex(
        /^[A-Z0-9]{6,9}$/,
        "Passport number must be 6–9 letters/numbers (e.g. AB123456)."
      ),

    passportExpiry: z
      .string()
      .min(1, "Passport expiry date is required.")
      .refine(
        (d) => /^\d{4}-\d{2}-\d{2}$/.test(d),
        "Expiry must be in YYYY-MM-DD format."
      )
      .refine(
        (d) => !isNaN(new Date(d + "T00:00:00").getTime()),
        "Invalid expiry date."
      )
      .refine((d) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(d + "T00:00:00") > today;
      }, "Passport has already expired.")
      .refine((d) => {
        return new Date(d + "T00:00:00") > getSixMonthsFromNow();
      }, "Passport must be valid for at least 6 months from today."),

    passportCountry: z
      .string()
      .trim()
      .min(1, "Country code is required.")
      .length(2, "Must be a 2-letter country code (e.g. BD, US, GB).")
      .toUpperCase(),
  })

  // ── Age vs Type cross-validation ──
  .superRefine((data, ctx) => {
    const born = new Date(data.dob + "T00:00:00");
    if (isNaN(born.getTime())) return;

    const age  = calculateAge(data.dob);
    const name = [data.firstName, data.lastName].filter(Boolean).join(" ") || "Passenger";
    const fail = (message: string) =>
      ctx.addIssue({ code: "custom", message, path: ["dob"] });

    switch (data.type) {
      case "adult":
        if (age < 12)
          fail(`${name} is ${age} years old — too young for adult. Adults must be 12 or older.`);
        break;

      case "child":
        if (age < 2)
          fail(`${name} is ${age} year(s) old. Children must be at least 2. Use infant for under 2.`);
        else if (age >= 12)
          fail(`${name} is ${age} years old — must be booked as adult, not child.`);
        break;

      case "infant":
      case "infant_without_seat":
        if (age >= 2)
          fail(`${name} is ${age} years old. Infants must be under 2. Use child instead.`);
        break;
    }
  });

// =============================================
// AVS COUNTRIES
// Countries where zipCode is required for fraud protection.
// All others: zipCode is hidden + optional.
// =============================================

export const AVS_COUNTRIES = ["US", "CA", "GB"] as const;
export type AvsCountry = typeof AVS_COUNTRIES[number];

export const isAvsCountry = (country: string): boolean =>
  AVS_COUNTRIES.includes(country.trim().toUpperCase() as AvsCountry);

// =============================================
// BOOKING SCHEMA
// =============================================

export const bookingSchema = z.object({

  // ── Contact ──
  contact: z.object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required.")
      .email("Please enter a valid email address.")
      .toLowerCase(),

    // ✅ FIX 4: Proper E.164 validation — matches backend cleanPhone()
    // Must start with optional +, then non-zero digit, then 9–14 more digits
    // Total digits: 10–15 (e.g. +8801712345678, +12125551234)
    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required.")
      .regex(
        /^\+?[1-9]\d{9,14}$/,
        "Enter a valid phone number with country code (e.g. +8801XXXXXXXXX)."
      ),
  }),

  // ── Passengers ──
  passengers: z
    .array(passengerSchema)
    .min(1, "At least one passenger is required.")
    .max(9, "Maximum 9 passengers allowed per booking."),

  // ── Payment ──
  payment: z.object({
    cardName: z
      .string()
      .trim()
      .min(2, "Cardholder name is required.")
      .max(70, "Name is too long.")
      .regex(
        /^[a-zA-Z\s.\-]+$/,
        "Only letters, spaces, dots, and hyphens allowed."
      ),

    cardNumber: z
      .string()
      .transform((val) => val.replace(/\D/g, ""))
      .refine(
        (val) => /^\d{13,19}$/.test(val),
        "Card number must be 13–19 digits."
      )
      .refine(isValidLuhn, "Card number is not valid. Please check and try again."),

    expiryDate: z
      .string()
      .trim()
      .regex(
        /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
        "Format must be MM/YY (e.g. 03/27)."
      )
      .refine((val) => {
        const [month, year] = val.split("/");
        const expYear  = 2000 + parseInt(year, 10);
        const expMonth = parseInt(month, 10);
        // Card valid through last day of expiry month
        const expDate  = new Date(expYear, expMonth, 1); // 1st of next month
        return expDate > new Date();
      }, "This card has expired."),

    billingAddress: z.object({
      street: z
        .string()
        .trim()
        .min(5,   "Street address must be at least 5 characters.")
        .max(100, "Street address is too long."),

      city: z
        .string()
        .trim()
        .min(2,  "City name must be at least 2 characters.")
        .max(50, "City name is too long."),

      // State: optional — not all countries use it
      state: z
        .string()
        .trim()
        .max(50, "State name is too long.")
        .optional()
        .or(z.literal("")),

      // zipCode: optional field — required only for US / CA / GB (AVS)
      // UI should show/hide this field based on selected country using isAvsCountry()
      zipCode: z
        .string()
        .trim()
        .max(12, "Zip/postal code is too long.")
        .regex(/^[a-zA-Z0-9\s\-]*$/, "Invalid zip/postal code format.")
        .optional()
        .or(z.literal("")),

      country: z
        .string()
        .trim()
        .min(2,  "Please select a country.")
        .max(60, "Country name is too long."),
    }),
  }),
})
// ── Conditional zipCode: required when country is US / CA / GB ──
.superRefine((data, ctx) => {
  const country = data.payment.billingAddress.country ?? "";
  if (isAvsCountry(country) && !data.payment.billingAddress.zipCode?.trim()) {
    ctx.addIssue({
      code:    "custom",
      path:    ["payment", "billingAddress", "zipCode"],
      message: "Zip/postal code is required for US, Canada, and UK addresses.",
    });
  }
});

// =============================================
// TYPE EXPORTS
// =============================================

export type BookingFormData = z.infer<typeof bookingSchema>;

/**
 * ✅ FIX 6: Normalize 'infant' → 'infant_without_seat' before sending to API.
 *
 * Call this when building the booking payload:
 *
 *   const payload = {
 *     offer_id,
 *     contact,
 *     passengers: normalizePassengerTypes(formData.passengers),
 *     payment,
 *   };
 */
export function normalizePassengerTypes(
  passengers: BookingFormData["passengers"]
): (Omit<BookingFormData["passengers"][number], "type"> & {
  type: "adult" | "child" | "infant_without_seat";
})[] {
  return passengers.map((p) => ({
    ...p,
    type: p.type === "infant" ? "infant_without_seat" : p.type,
  }));
}