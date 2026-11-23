import { z } from 'zod';
import { PurchaseOrderSchema } from './purchases.js';

export const SourcingInquiryLineSchema = z.object({
  id: z.string().uuid(),
  inquiryId: z.string().uuid(),
  productId: z.string().uuid().nullable().optional(),
  productName: z.string(),
  mill: z.string(),
  quantity: z.string().or(z.number()),
  unit: z.string(),
  targetPriceToman: z.string().or(z.number()).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SourcingInquiryLine = z.infer<typeof SourcingInquiryLineSchema>;

export const CreateSourcingInquiryLineInputSchema = z.object({
  productId: z.string().uuid().optional(),
  productName: z.string().min(1, 'نام کالا الزامی است'),
  mill: z.string().default(''),
  quantity: z.number().positive('مقدار کالا باید بزرگتر از صفر باشد'),
  unit: z.string().default('کیلوگرم'),
  targetPriceToman: z.number().nonnegative().optional(),
});
export type CreateSourcingInquiryLineInput = z.input<typeof CreateSourcingInquiryLineInputSchema>;

export const SourcingInquirySchema = z.object({
  id: z.string().uuid(),
  inquiryNo: z.string(),
  title: z.string(),
  stage: z.string(),
  saleOrderId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(SourcingInquiryLineSchema).optional(),
  orders: z.array(PurchaseOrderSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});
export type SourcingInquiry = z.infer<typeof SourcingInquirySchema>;

export const CreateSourcingInquiryInputSchema = z.object({
  title: z.string().min(1, 'عنوان استعلام الزامی است'),
  saleOrderId: z.string().uuid().optional(),
  notes: z.string().optional(),
  lines: z
    .array(CreateSourcingInquiryLineInputSchema)
    .min(1, 'استعلام باید حداقل شامل یک ردیف باشد'),
});
export type CreateSourcingInquiryInput = z.input<typeof CreateSourcingInquiryInputSchema>;

export const SourcingInquiryListQuerySchema = z.object({
  stage: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});
export type SourcingInquiryListQuery = z.infer<typeof SourcingInquiryListQuerySchema>;
