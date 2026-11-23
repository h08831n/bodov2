import { z } from 'zod';

export const AllocationStatusSchema = z.enum(['COMMITTED', 'FULFILLED', 'RELEASED']);
export type AllocationStatus = z.infer<typeof AllocationStatusSchema>;

export const PurchaseSaleAllocationSchema = z.object({
  id: z.string().uuid(),
  saleOrderLineId: z.string().uuid(),
  purchaseOrderLineId: z.string().uuid(),
  allocatedQuantity: z.string().or(z.number()),
  status: AllocationStatusSchema,
  notes: z.string().nullable().optional(),
  version: z.number().default(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  saleOrderLine: z
    .object({
      id: z.string().uuid(),
      productName: z.string(),
      quantity: z.string().or(z.number()),
      allocatedQuantity: z.string().or(z.number()),
      order: z
        .object({
          id: z.string().uuid(),
          quotationNo: z.string(),
          orderNo: z.string().nullable().optional(),
          customerName: z.string(),
        })
        .optional(),
    })
    .optional(),
  purchaseOrderLine: z
    .object({
      id: z.string().uuid(),
      productName: z.string(),
      quantity: z.string().or(z.number()),
      allocatedQuantity: z.string().or(z.number()),
      order: z
        .object({
          id: z.string().uuid(),
          orderNo: z.string(),
          vendorName: z.string(),
        })
        .optional(),
    })
    .optional(),
});
export type PurchaseSaleAllocation = z.infer<typeof PurchaseSaleAllocationSchema>;

export const CreateAllocationInputSchema = z.object({
  saleOrderLineId: z.string().uuid('شناسه ردیف فروش الزامی است'),
  purchaseOrderLineId: z.string().uuid('شناسه ردیف خرید الزامی است'),
  allocatedQuantity: z.number().positive('مقدار تخصیص باید بزرگتر از صفر باشد'),
  notes: z.string().optional(),
});
export type CreateAllocationInput = z.input<typeof CreateAllocationInputSchema>;

export const ReleaseAllocationInputSchema = z.object({
  allocationId: z.string().uuid('شناسه تخصیص الزامی است'),
  notes: z.string().optional(),
});
export type ReleaseAllocationInput = z.infer<typeof ReleaseAllocationInputSchema>;
