import z from "zod";
import { PACKAGE_LIMITS } from "../../helper/constant";
const { TITLE, DESCRIPTION, INCLUDED_ITEMS, PRICE } = PACKAGE_LIMITS;

export const packageSchema = z.object({
  title: z.string()
    .min(TITLE.MIN_LENGTH, "Title is too short")
    .max(TITLE.MAX_LENGTH, `Title is too long max ${TITLE.MAX_LENGTH}`), // Max Length
  price: z.coerce.number().min(PRICE.MIN, "Price must be positive"),
  category: z.string().min(1, "Select a category"),
  location: z.string().min(1, "Location is required"),
  imageUrl: z.string().url("Please enter a valid URL"), // Valid URL check
  description: z.string()
   .min(DESCRIPTION.MIN_LENGTH,` Description is too short min ${DESCRIPTION.MIN_LENGTH}`)
    .max(DESCRIPTION.MAX_LENGTH, `Description is too long max ${DESCRIPTION.MAX_LENGTH}`), // Max Length
  included: z.array(
    z.object({
      value: z.string().min(1, "Item cannot be empty"),
    })
  ).min(INCLUDED_ITEMS.MIN_COUNT, `At least ${INCLUDED_ITEMS.MIN_COUNT} item is required`)
   .max(INCLUDED_ITEMS.MAX_COUNT, `You can add up to ${INCLUDED_ITEMS.MAX_COUNT} items`), // Max Items
});

export type PackageFormValues = z.infer<typeof packageSchema>;