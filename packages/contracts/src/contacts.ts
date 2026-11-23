import { z } from 'zod';

export const ContactTypeSchema = z.enum(['CUSTOMER', 'SUPPLIER', 'TRANSPORTER', 'PARTNER']);
export type ContactType = z.infer<typeof ContactTypeSchema>;

export const ContactSchema = z.object({
  id: z.string().uuid(),
  type: ContactTypeSchema,
  name: z.string().min(1, 'نام مخاطب الزامی است'),
  companyName: z.string().nullable().optional(),
  nationalId: z.string().nullable().optional(),
  economicCode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  city: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  balanceToman: z.string().or(z.number()),
  creditLimitToman: z.string().or(z.number()),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});
export type Contact = z.infer<typeof ContactSchema>;

export const CreateContactInputSchema = z.object({
  type: ContactTypeSchema.default('CUSTOMER'),
  name: z.string().min(2, 'نام مخاطب باید حداقل ۲ نویسه باشد'),
  companyName: z.string().optional(),
  nationalId: z.string().optional(),
  economicCode: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email('ایمیل نامعتبر است').optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  creditLimitToman: z.number().nonnegative().optional().default(0),
});
export type CreateContactInput = z.input<typeof CreateContactInputSchema>;

export const UpdateContactInputSchema = CreateContactInputSchema.partial();
export type UpdateContactInput = z.input<typeof UpdateContactInputSchema>;

export const ContactListQuerySchema = z.object({
  type: ContactTypeSchema.optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});
export type ContactListQuery = z.infer<typeof ContactListQuerySchema>;
