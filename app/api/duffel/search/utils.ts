import { COMMISION_RATE } from "@/constant/control";

export const MAX_RESULT_LIMIT=500

export const calculatePriceWithMarkup = (amount: string | null | undefined, currency: string | undefined) => {
  if (!amount) return { currency: 'USD', basePrice: 0, markup: 0, finalPrice: 0 };
  
  const basePrice = parseFloat(amount);
  if (isNaN(basePrice)) return { currency: 'USD', basePrice: 0, markup: 0, finalPrice: 0 };

  const markup = basePrice * (COMMISION_RATE / 100); 
  const finalPrice = Math.ceil(basePrice + markup);

  return {
    currency: currency || 'USD',
    basePrice: Number(basePrice.toFixed(2)),
    markup: Number(markup.toFixed(2)),
    finalPrice: Number(finalPrice.toFixed(2)),
  };
};


const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; 
const MAX_REQUESTS = 15; 

export const checkRateLimit = (ip: string) => {
  const now = Date.now();
  const userRecord = rateLimit.get(ip) || { count: 0, lastRequest: now };
  if (now - userRecord.lastRequest > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { count: 1, lastRequest: now });
    return true;
  }
  if (userRecord.count >= MAX_REQUESTS) return false;
  userRecord.count += 1;
  rateLimit.set(ip, userRecord);
  return true;
};