import { z } from 'zod';
import { SaleOrderLineSchema, SaleOrderStageSchema } from './sales.js';

export const PortalCompanyInfoSchema = z.object({
  name: z.string(),
  phone: z.string(),
  address: z.string().optional(),
});
export type PortalCompanyInfo = z.infer<typeof PortalCompanyInfoSchema>;

export const PortalOrderViewSchema = z.object({
  id: z.string().uuid(),
  quotationNo: z.string(),
  orderNo: z.string().nullable().optional(),
  stage: SaleOrderStageSchema,
  customerName: z.string(),
  date: z.string(),
  expiryDate: z.string().nullable().optional(),
  salespersonName: z.string().nullable().optional(),
  shippingAddress: z.string().nullable().optional(),
  totalWeightKg: z.string().or(z.number()),
  subtotalToman: z.string().or(z.number()),
  taxToman: z.string().or(z.number()),
  freightToman: z.string().or(z.number()),
  grandTotalToman: z.string().or(z.number()),
  notes: z.string().nullable().optional(),
  lines: z.array(SaleOrderLineSchema),
  companyInfo: PortalCompanyInfoSchema.optional(),
});
export type PortalOrderView = z.infer<typeof PortalOrderViewSchema>;
