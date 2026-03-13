import z from "zod";

export const packageApiSchema = z.object({
  title: z.string().min(10),
  price: z.coerce.number().min(1),
  category: z.string().min(1),
  location: z.string().min(1),
  imageUrl: z.string().url(), 
  description: z.string().min(50),

  included: z.array(z.string()).min(1), 
});