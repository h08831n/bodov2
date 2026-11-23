import { z } from 'zod';

export const ProductCategoryTypeSchema = z.enum([
  'REBAR',
  'BEAM',
  'SHEET',
  'PROFILE',
  'PIPE',
  'WIRE',
  'OTHER',
]);
export type ProductCategoryType = z.infer<typeof ProductCategoryTypeSchema>;

export const ProductSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  category: ProductCategoryTypeSchema,
  mill: z.string(), // کارخانه سازنده
  standard: z.string(), // استاندارد A3, St37, IPE
  size: z.string(), // سایز یا ضخامت
  defaultUnit: z.string(),
  allowedUnits: z.array(z.string()),
  pricePerKgToman: z.string().or(z.number()),
  stockKg: z.string().or(z.number()),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});
export type Product = z.infer<typeof ProductSchema>;

export const CreateProductInputSchema = z.object({
  code: z.string().min(2, 'کد محصول باید حداقل ۲ نویسه باشد'),
  name: z.string().min(2, 'نام محصول الزامی است'),
  category: ProductCategoryTypeSchema.default('REBAR'),
  mill: z.string().min(1, 'نام کارخانه الزامی است'),
  standard: z.string().default('A3'),
  size: z.string().min(1, 'سایز یا ضخامت کالا الزامی است'),
  defaultUnit: z.string().default('کیلوگرم'),
  allowedUnits: z.array(z.string()).default(['کیلوگرم', 'شاخه', 'بندل']),
  pricePerKgToman: z.number().nonnegative('قیمت روز نمی‌تواند منفی باشد').default(0),
  stockKg: z.number().nonnegative('موجودی نمی‌تواند منفی باشد').default(0),
});
export type CreateProductInput = z.input<typeof CreateProductInputSchema>;

export const UpdateProductInputSchema = CreateProductInputSchema.partial();
export type UpdateProductInput = z.input<typeof UpdateProductInputSchema>;

export const ProductListQuerySchema = z.object({
  category: ProductCategoryTypeSchema.optional(),
  mill: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
