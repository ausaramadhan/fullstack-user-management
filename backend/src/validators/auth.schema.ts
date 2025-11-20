import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(4, "min 4").max(100, "max 100"),
  password: z.string().min(8, "min 8").max(100, "max 100"),
});

export type LoginInput = z.infer<typeof loginSchema>;
