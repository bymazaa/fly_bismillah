import { MARKUP_RATE, SERVICE_FEE_RATE } from '@/constant/control';

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------

export const MAX_RESULT_LIMIT = 500;

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 15;             // max 15 requests per window per IP

// ------------------------------------------------------------------
// Price Calculator
// ------------------------------------------------------------------

export const calculatePriceWithMarkup = (
  amount: string | null | undefined,
  currency: string | undefined,
) => {
  if (!amount) {
    return { currency: 'USD', basePrice: 0, markup: 0, finalPrice: 0 };
  }

  const basePrice = parseFloat(amount);
  if (isNaN(basePrice) || basePrice <= 0) {
    return { currency: 'USD', basePrice: 0, markup: 0, finalPrice: 0 };
  }

  // ──── Rates ────
  const SYSTEM_COMMISSION = MARKUP_RATE; // e.g., 0.05 = 5%
  const DUFFEL_FEE = SERVICE_FEE_RATE;   // e.g., 0.029 = 2.9%

  // Step 1: target amount (without rounding intermediate)
  const targetAmountToKeep = basePrice * (1 + SYSTEM_COMMISSION);

  // Step 2: final price charged to customer
  const finalPriceRaw = targetAmountToKeep / (1 - DUFFEL_FEE);

  // Step 3: total markup
  const totalMarkupRaw = finalPriceRaw - basePrice;

  // Step 4: round only final output
  return {
    currency: currency || 'USD',
    basePrice: Number(basePrice.toFixed(2)),
    markup: Number(totalMarkupRaw.toFixed(2)),
    finalPrice: Number(finalPriceRaw.toFixed(2)),
  };
};
// ------------------------------------------------------------------
// Rate Limiter
// In-memory rate limiter per IP — resets after RATE_LIMIT_WINDOW.
// Stale entries are cleaned up automatically to prevent memory leaks.
// NOTE: This is process-level only. For multi-instance production
// deployments, replace with Redis-based rate limiting.
// ------------------------------------------------------------------

interface RateLimitRecord {
  count: number;
  lastRequest: number;
}

const rateLimit = new Map<string, RateLimitRecord>();

// Cleanup stale entries every window to prevent memory leak
setInterval(() => {
  const now = Date.now();
  rateLimit.forEach((record, ip) => {
    if (now - record.lastRequest > RATE_LIMIT_WINDOW) {
      rateLimit.delete(ip);
    }
  });
}, RATE_LIMIT_WINDOW);

export const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const record = rateLimit.get(ip);

  // No previous record or window has expired — reset
  if (!record || now - record.lastRequest > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { count: 1, lastRequest: now });
    return true;
  }

  // Within window — check request count
  if (record.count >= MAX_REQUESTS) return false;

  // Increment count
  rateLimit.set(ip, { count: record.count + 1, lastRequest: record.lastRequest });
  return true;
};

// ------------------------------------------------------------------
// Duffel Passenger Builder
// Duffel recommends using `age` instead of `type` for children and
// infants — airlines calculate the correct fare based on age at
// departure date. Only adults use `type: "adult"`.
// ------------------------------------------------------------------

interface PassengerInput {
  adults: number;
  children: number;
  childAges: number[];  // must match children count
  infants: number;
}

export const buildDuffelPassengers = (pax: PassengerInput) => {
  const passengers: ({ type: 'adult' } | { age: number })[] = [];

  // Adults — type-based (Duffel standard)
  for (let i = 0; i < (pax.adults || 1); i++) {
    passengers.push({ type: 'adult' });
  }

  // Children (age 2-17) — age-based
  // Duffel auto-determines: 2-11 = child fare, 12-17 = adult fare
  for (let i = 0; i < (pax.children || 0); i++) {
    const age = pax.childAges[i];
    if (age === undefined) {
      throw new Error(`Missing age for child ${i + 1}`);
    }
    passengers.push({ age });
  }

  // Infants (under 2) — age 0, Duffel treats as lap infant
  for (let i = 0; i < (pax.infants || 0); i++) {
    passengers.push({ age: 0 });
  }

  return passengers;
};

// ------------------------------------------------------------------
// Sort Offers
// Applied after Duffel response — Duffel does not support server-side
// sorting on offerRequests.
// ------------------------------------------------------------------

type SortOption = 'best' | 'cheapest' | 'fastest' | 'price_asc' | 'price_desc' | 'duration';

export const sortOffers = <T extends { price: { finalPrice: number }; itinerary: { totalDuration: string }[] }>(
  offers: T[],
  sort?: SortOption,
): T[] => {
  if (!sort) return offers;

  const parseDurationToMinutes = (duration: string): number => {
    const daysMatch = duration.match(/(\d+)d/);
    const hoursMatch = duration.match(/(\d+)h/);
    const minutesMatch = duration.match(/(\d+)m/);
    const days = daysMatch ? parseInt(daysMatch[1]) * 24 * 60 : 0;
    const hours = hoursMatch ? parseInt(hoursMatch[1]) * 60 : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    return days + hours + minutes;
  };

  const getTotalDuration = (offer: T): number =>
    offer.itinerary.reduce(
      (sum, slice) => sum + parseDurationToMinutes(slice.totalDuration),
      0,
    );

  const sorted = [...offers];

  switch (sort) {
    case 'cheapest':
    case 'price_asc':
      return sorted.sort((a, b) => a.price.finalPrice - b.price.finalPrice);

    case 'price_desc':
      return sorted.sort((a, b) => b.price.finalPrice - a.price.finalPrice);

    case 'fastest':
    case 'duration':
      return sorted.sort((a, b) => getTotalDuration(a) - getTotalDuration(b));

    case 'best':
      // Best = balanced score between price and duration
      return sorted.sort((a, b) => {
        const priceScore = a.price.finalPrice - b.price.finalPrice;
        const durationScore = getTotalDuration(a) - getTotalDuration(b);
        return priceScore * 0.6 + durationScore * 0.4;
      });

    default:
      return sorted;
  }
};