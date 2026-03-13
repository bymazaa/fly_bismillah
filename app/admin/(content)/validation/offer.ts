import z from "zod";
import { OFFERS_LIMITS } from "../../helper/constant";
const { TITLE, DISCOUNT_PERCENTAGE, DESCRIPTION } = OFFERS_LIMITS;
export const offerformSchema = z.object({
  title: z
    .string()
    .min(TITLE.MIN_LENGTH, `Title must be at least ${TITLE.MIN_LENGTH} chars`)
    .max(TITLE.MAX_LENGTH, `Title must be at most ${TITLE.MAX_LENGTH} chars`),
  slug: z.string().min(1, "Slug is generated automatically"), 
  description: z.string()
    .min(
      DESCRIPTION.MIN_LENGTH,
      `Description must be at least ${DESCRIPTION.MIN_LENGTH} chars`
    )
    .max(
      DESCRIPTION.MAX_LENGTH,
      `Description must be at most ${DESCRIPTION.MAX_LENGTH} chars`
    ),
  image: z.string().url("Valid image URL is required"),
  whatsappMessage: z.string().min(5, "WhatsApp message is required"),
  isLarge: z.boolean(),
  isActive: z.boolean(),

});

export type offerFormValues = z.infer<typeof offerformSchema>;