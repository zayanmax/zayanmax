import { z } from "zod";

export const branchSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export type BranchFormValues = z.infer<typeof branchSchema>;
