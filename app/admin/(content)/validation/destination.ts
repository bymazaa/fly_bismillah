import z from "zod";
import { DESTINATIONS_LIMITS } from "../../helper/constant";
const { NAME, DESCRIPTION, ATTRACTIONS,BEST_TIME,CURRENCY,COUNTRY,REVIEWS,RATING } = DESTINATIONS_LIMITS;
// --- Zod Schema (All Required) ---
export const DestinationformSchema = z.object({
  name: z.string().min(NAME.MIN_LENGTH, `Name must be at least ${NAME.MIN_LENGTH} chars`).max(NAME.MAX_LENGTH, `Name must be at most ${NAME.MAX_LENGTH} chars`),
  slug: z.string().min(1, "Slug is generated automatically"), 
  country: z.string().min(COUNTRY.MIN_LENGTH, `Country must be at least ${COUNTRY.MIN_LENGTH} chars`).max(COUNTRY.MAX_LENGTH, `Country must be at most ${COUNTRY.MAX_LENGTH} chars`),
  description: z.string().min(DESCRIPTION.MIN_LENGTH, `Description must be at least ${DESCRIPTION.MIN_LENGTH} chars`).max(DESCRIPTION.MAX_LENGTH, `Description must be at most ${DESCRIPTION.MAX_LENGTH} chars`),
  
  currency: z.string().min(CURRENCY.MIN_LENGTH, `Currency must be at least ${CURRENCY.MIN_LENGTH} chars`).max(CURRENCY.MAX_LENGTH, `Currency must be at most ${CURRENCY.MAX_LENGTH} chars`),
  language: z.string().min(1, "Language is required"),
  bestTime: z.string().min(BEST_TIME.MIN_LENGTH, `Best time must be at least ${BEST_TIME.MIN_LENGTH} chars`).max(BEST_TIME.MAX_LENGTH, `Best time must be at most ${BEST_TIME.MAX_LENGTH} chars`),
  
  rating: z.number().min(RATING.MIN, `Rating must be at least ${RATING.MIN}`).max(RATING.MAX, `Rating must be at most ${RATING.MAX}`),
  reviews: z.number().min(REVIEWS.MIN, `Reviews must be at least ${REVIEWS.MIN}`).max(REVIEWS.MAX, `Reviews must be at most ${REVIEWS.MAX}`),
  
  image: z.string().url("Cover image is required"),
  
  // Arrays (Minimum 1 item required)
  gallery: z.array(z.string()).min(1, "Add at least 1 gallery image"),
  attractions: z.array(z.string()),
  
  isActive: z.boolean(),
});

export type DestinationFormValues = z.infer<typeof DestinationformSchema>;
