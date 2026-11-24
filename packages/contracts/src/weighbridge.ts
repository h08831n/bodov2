import { z } from 'zod';

export const WeighbridgeSlipSchema = z.object({
  id: z.string().uuid(),
  slipNo: z.string(),
  saleOrderId: z.string().uuid().nullable().optional(),
  saleOrderNo: z.string().nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
  customerName: z.string(),
  netWeightKg: z.string().or(z.number()),
  vehiclePlate: z.string(),
  waybillNo: z.string().nullable().optional(),
  driverName: z.string().nullable().optional(),
  driverMobile: z.string().nullable().optional(),
  scaleName: z.string().nullable().optional(),
  operatorName: z.string().nullable().optional(),
  weighedAt: z.string(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});
export type WeighbridgeSlip = z.infer<typeof WeighbridgeSlipSchema>;

export const CreateWeighbridgeSlipInputSchema = z.object({
  saleOrderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  customerName: z.string().min(1, 'نام طرف‌حساب یا خریدار الزامی است'),
  netWeightKg: z.number().positive('وزن خالص باید بیشتر از صفر باشد'),
  vehiclePlate: z.string().min(1, 'شماره پلاک خودرو الزامی است'),
  waybillNo: z.string().optional(),
  driverName: z.string().optional(),
  driverMobile: z.string().optional(),
  scaleName: z.string().optional(),
  operatorName: z.string().optional(),
  weighedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});
export type CreateWeighbridgeSlipInput = z.input<typeof CreateWeighbridgeSlipInputSchema>;

export const UpdateWeighbridgeSlipInputSchema = z.object({
  saleOrderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  customerName: z.string().min(1).optional(),
  netWeightKg: z.number().positive().optional(),
  vehiclePlate: z.string().min(1).optional(),
  waybillNo: z.string().optional(),
  driverName: z.string().optional(),
  driverMobile: z.string().optional(),
  scaleName: z.string().optional(),
  operatorName: z.string().optional(),
  weighedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});
export type UpdateWeighbridgeSlipInput = z.input<typeof UpdateWeighbridgeSlipInputSchema>;

export const WeighbridgeListQuerySchema = z.object({
  search: z.string().optional(),
  saleOrderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
  cursor: z.string().optional(),
});
export type WeighbridgeListQuery = z.infer<typeof WeighbridgeListQuerySchema>;
