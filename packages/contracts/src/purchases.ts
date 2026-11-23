import { z } from 'zod';

export const PurchaseOrderStageSchema = z.enum([
  'RFQ',
  'RFQ_SENT',
  'PURCHASE_ORDER',
  'DONE',
  'CANCELLED',
]);
export type PurchaseOrderStage = z.infer<typeof PurchaseOrderStageSchema>;

export const PurchaseOrderLineSchema = z.object({
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
  allocatedQuantity: z.string().or(z.number()).default(0),
  receivedQuantity: z.string().or(z.number()).default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PurchaseOrderLine = z.infer<typeof PurchaseOrderLineSchema>;

export const CreatePurchaseOrderLineInputSchema = z.object({
  productId: z.string().uuid().optional(),
  productName: z.string().min(1, 'شرح کالا الزامی است'),
  mill: z.string().default(''),
  unit: z.string().default('کیلوگرم'),
  quantity: z.number().positive('مقدار کالا باید بیشتر از صفر باشد'),
  unitPriceToman: z.number().nonnegative('قیمت واحد نمی‌تواند منفی باشد'),
  taxPercent: z.number().min(0).max(100).default(10),
});
export type CreatePurchaseOrderLineInput = z.input<typeof CreatePurchaseOrderLineInputSchema>;

export const PurchaseOrderSchema = z.object({
  id: z.string().uuid(),
  orderNo: z.string(),
  vendorId: z.string().uuid(),
  vendorName: z.string(),
  stage: PurchaseOrderStageSchema,
  date: z.string(),
  deliveryDate: z.string().nullable().optional(),
  buyerId: z.string().uuid().nullable().optional(),
  buyerName: z.string().nullable().optional(),
  subtotalToman: z.string().or(z.number()),
  taxToman: z.string().or(z.number()),
  grandTotalToman: z.string().or(z.number()),
  inquiryId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  version: z.number().default(1),
  lines: z.array(PurchaseOrderLineSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;

export const CreatePurchaseOrderInputSchema = z.object({
  vendorId: z.string().uuid('شناسه تأمین‌کننده الزامی است'),
  vendorName: z.string().min(1, 'نام تأمین‌کننده الزامی است'),
  deliveryDate: z.string().datetime().optional(),
  inquiryId: z.string().uuid().optional(),
  notes: z.string().optional(),
  lines: z
    .array(CreatePurchaseOrderLineInputSchema)
    .min(1, 'سفارش خرید باید حداقل یک ردیف کالا داشته باشد'),
});
export type CreatePurchaseOrderInput = z.input<typeof CreatePurchaseOrderInputSchema>;

export const UpdatePurchaseOrderInputSchema = z.object({
  deliveryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  lines: z.array(CreatePurchaseOrderLineInputSchema).optional(),
});
export type UpdatePurchaseOrderInput = z.input<typeof UpdatePurchaseOrderInputSchema>;

export const TransitionPurchaseStageInputSchema = z.object({
  stage: PurchaseOrderStageSchema,
});
export type TransitionPurchaseStageInput = z.infer<typeof TransitionPurchaseStageInputSchema>;

export const PurchaseOrderListQuerySchema = z.object({
  stage: PurchaseOrderStageSchema.optional(),
  vendorId: z.string().uuid().optional(),
  inquiryId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});
export type PurchaseOrderListQuery = z.infer<typeof PurchaseOrderListQuerySchema>;
