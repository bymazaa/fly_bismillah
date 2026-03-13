import { z } from 'zod';

// ------------------------------------------------------------------
// Flight Leg Schema (Multi City)
// ------------------------------------------------------------------

const flightLegSchema = z.object({
  origin: z
    .string()
    .length(3, 'Origin must be a 3-letter IATA code')
    .transform((v) => v.toUpperCase()),
  destination: z
    .string()
    .length(3, 'Destination must be a 3-letter IATA code')
    .transform((v) => v.toUpperCase()),
  date: z.string().min(1, 'Date is required'),
});

// ------------------------------------------------------------------
// Passenger Schema
// ------------------------------------------------------------------

const passengersSchema = z
  .object({
    adults:    z.coerce.number().min(1, 'At least 1 adult required').default(1),
    children:  z.coerce.number().min(0).default(0),
    childAges: z
      .array(
        z.number()
          .int()
          .min(2, 'Under 2 = infant, not child')
          .max(11, 'Age 12+ = adult, add to adults count')  // ✅ FIXED
      )
      .default([]),
    infants:   z.coerce.number().min(0).default(0),
  })
  .superRefine((data, ctx) => {
    if (data.children > 0 && data.childAges.length !== data.children) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `childAges must have exactly ${data.children} age(s)`,
        path: ['childAges'],
      });
    }

    if (data.infants > data.adults) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Infants cannot exceed adults',
        path: ['infants'],
      });
    }

    const seated = data.adults + data.children;
    if (seated > 9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum 9 seated passengers (adults + children)',
        path: ['adults'],
      });
    }
  });

// ------------------------------------------------------------------
// Main Search Schema
// ------------------------------------------------------------------

export const searchSchema = z
  .object({
    type: z.enum(['one_way', 'round_trip', 'multi_city']),

    origin: z
      .string()
      .length(3, 'Origin must be a 3-letter IATA code')
      .optional()
      .transform((v) => v?.toUpperCase()),
    destination: z
      .string()
      .length(3, 'Destination must be a 3-letter IATA code')
      .optional()
      .transform((v) => v?.toUpperCase()),
    departureDate: z.string().optional(),
    returnDate: z.string().optional(),

    flights: z.array(flightLegSchema).min(2).max(8).optional(),

    passengers: passengersSchema.default({
      adults: 1,
      children: 0,
      childAges: [],
      infants: 0,
    }),

    cabinClass: z
      .enum(['economy', 'premium_economy', 'business', 'first'])
      .default('economy'),

    sort: z
      .enum(['best', 'cheapest', 'fastest', 'price_asc', 'price_desc', 'duration'])
      .optional(),

    maxConnections: z.coerce.number().min(0).max(2).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'one_way' || data.type === 'round_trip') {
      if (!data.origin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Origin is required',
          path: ['origin'],
        });
      }
      if (!data.destination) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Destination is required',
          path: ['destination'],
        });
      }

      if (data.origin && data.destination && data.origin === data.destination) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Origin and destination cannot be the same',
          path: ['destination'],
        });
      }

      if (!data.departureDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Departure date is required',
          path: ['departureDate'],
        });
      }

      if (data.type === 'round_trip' && !data.returnDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Return date is required for round trips',
          path: ['returnDate'],
        });
      }

      if (data.departureDate && data.returnDate) {
        if (new Date(data.returnDate) <= new Date(data.departureDate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Return date must be after departure date',
            path: ['returnDate'],
          });
        }
      }
    }

    if (data.type === 'multi_city') {
      if (!data.flights || data.flights.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least 2 flight legs are required for multi-city',
          path: ['flights'],
        });
      }

      data.flights?.forEach((f, i) => {
        if (f.origin === f.destination) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Leg ${i + 1}: origin and destination cannot be the same`,
            path: ['flights', i, 'destination'],
          });
        }
      });
    }
  });

export type SearchSchema = z.infer<typeof searchSchema>;
export type PassengersSchema = z.infer<typeof passengersSchema>;
export type FlightLegSchema = z.infer<typeof flightLegSchema>;