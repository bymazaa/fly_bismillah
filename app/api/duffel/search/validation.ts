import z from "zod";

// 🟢 1. Helper Schema for Multi-City Legs
const flightLegSchema = z.object({
  origin: z.string().length(3, "IATA code must be 3 chars").transform(v => v.toUpperCase()),
  destination: z.string().length(3, "IATA code must be 3 chars").transform(v => v.toUpperCase()),
  date: z.string().min(1, "Date is required"),
});

// 🟢 2. Main Search Schema
export const searchSchema = z.object({
  type: z.enum(['one_way', 'round_trip', 'multi_city']),

  // Basic Fields
  origin: z.string().length(3).optional().transform(v => v?.toUpperCase()),
  destination: z.string().length(3).optional().transform(v => v?.toUpperCase()),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),

  // Multi City
  flights: z.array(flightLegSchema).max(8).optional(),

  // Passengers (Matches API structure perfectly)
  passengers: z.object({
    adults: z.coerce.number().min(1).default(1),
    children: z.coerce.number().min(0).default(0),
    infants: z.coerce.number().min(0).default(0),
  }).default({ adults: 1, children: 0, infants: 0 }),

  cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
  
  // ✨ Added Sort (Since backend supports it)
  sort: z.enum(['best', 'cheapest', 'fastest', 'price_asc', 'price_desc', 'duration']).optional(),

}).superRefine((data, ctx) => {
  
  // A. Validation for One Way & Round Trip
  if (data.type === 'one_way' || data.type === 'round_trip') {
    if (!data.origin) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Origin is required", path: ['origin'] });
    }
    if (!data.destination) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Destination is required", path: ['destination'] });
    }
    // 🛡️ Safety: Prevent same Origin & Destination
    if (data.origin && data.destination && data.origin === data.destination) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Origin and Destination cannot be same", path: ['destination'] });
    }

    if (!data.departureDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Departure Date is required", path: ['departureDate'] });
    }
    
    if (data.type === 'round_trip' && !data.returnDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Return Date is required", path: ['returnDate'] });
    }
  }

  // B. Validation for Multi City
  if (data.type === 'multi_city') {
    if (!data.flights || data.flights.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least 2 flights required", path: ['flights'] });
    }
  }
});