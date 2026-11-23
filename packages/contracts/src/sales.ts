import { z } from 'zod';

export const SaleOrderStageSchema = z.enum(['DRAFT', 'SENT', 'CONFIRMED', 'LOST', 'CANCELLED']);
export type SaleOrderStage = z.infer<typeof SaleOrderStageSchema>;

export const SaleOrderLineSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productId: z.string().uuid().nullable().optional(),
  productName: z.string(),
  mill: z.string(),
  unit: z.string(),
  quantity: z.string().or(z.number()),
  unitPriceToman: z.string().or(z.number()),
  taxPercent: z.string().or(z.number()),
  totalPriceToman: z.string().or(z.number()),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SaleOrderLine = z.infer<typeof SaleOrderLineSchema>;

export const CreateSaleOrderLineInputSchema = z.object({
  productId: z.string().uuid().optional(),
  productName: z.string().min(1, 'شرح کالا الزامی است'),
  mill: z.string().default(''),
  unit: z.string().default('کیلوگرم'),
  quantity: z.number().positive('مقدار کالا باید بیشتر از صفر باشد'),
  unitPriceToman: z.number().nonnegative('قیمت واحد نمی‌تواند منفی باشد'),
  taxPercent: z.number().min(0).max(100).default(10),
});
export type CreateSaleOrderLineInput = z.input<typeof CreateSaleOrderLineInputSchema>;

export const SaleOrderSchema = z.object({
  id: z.string().uuid(),
  quotationNo: z.string(),
  orderNo: z.string().nullable().optional(),
  customerId: z.string().uuid(),
  customerName: z.string(),
  stage: SaleOrderStageSchema,
  date: z.string(),
  expiryDate: z.string().nullable().optional(),
  salespersonId: z.string().uuid().nullable().optional(),
  salespersonName: z.string().nullable().optional(),
  subtotalToman: z.string().or(z.number()),
  taxToman: z.string().or(z.number()),
  grandTotalToman: z.string().or(z.number()),
  lostReasonId: z.string().uuid().nullable().optional(),
  lostNotes: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(SaleOrderLineSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});
export type SaleOrder = z.infer<typeof SaleOrderSchema>;

export const CreateSaleOrderInputSchema = z.object({
  customerId: z.string().uuid('شناسه مشتری الزامی است'),
  customerName: z.string().min(1, 'نام مشتری الزامی است'),
  expiryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  lines: z
    .array(CreateSaleOrderLineInputSchema)
    .min(1, 'پیش‌فاکتور باید حداقل یک خط کالا داشته باشد'),
});
export type CreateSaleOrderInput = z.input<typeof CreateSaleOrderInputSchema>;

export const UpdateSaleOrderInputSchema = z.object({
  expiryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  lines: z.array(CreateSaleOrderLineInputSchema).optional(),
});
export type UpdateSaleOrderInput = z.input<typeof UpdateSaleOrderInputSchema>;

export const TransitionStageInputSchema = z.object({
  stage: SaleOrderStageSchema,
  lostReasonId: z.string().uuid().optional(),
  lostNotes: z.string().optional(),
});
export type TransitionStageInput = z.infer<typeof TransitionStageInputSchema>;

export const SaleOrderListQuerySchema = z.object({
  stage: SaleOrderStageSchema.optional(),
  customerId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});
export type SaleOrderListQuery = z.infer<typeof SaleOrderListQuerySchema>;
