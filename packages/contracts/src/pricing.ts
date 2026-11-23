import { z } from 'zod';
import { ProductCategoryTypeSchema } from './products.js';

export const DailyPriceSchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  productId: z.string().uuid().nullable().optional(),
  productName: z.string(),
  category: ProductCategoryTypeSchema,
  mill: z.string(),
  size: z.string(),
  standard: z.string(),
  unit: z.string(),
  priceToman: z.string().or(z.number()),
  prevPriceToman: z.string().or(z.number()).nullable().optional(),
  priceChangeToman: z.string().or(z.number()).nullable().optional(),
  published: z.boolean().default(true),
  announcedAt: z.string(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type DailyPrice = z.infer<typeof DailyPriceSchema>;

export const CreateDailyPriceItemInputSchema = z.object({
  productId: z.string().uuid().optional(),
  productName: z.string().min(1, 'نام کالا الزامی است'),
  category: ProductCategoryTypeSchema.default('REBAR'),
  mill: z.string().default(''),
  size: z.string().default(''),
  standard: z.string().default(''),
  unit: z.string().default('کیلوگرم'),
  priceToman: z.number().positive('قیمت باید بزرگتر از صفر باشد'),
  published: z.boolean().default(true),
  notes: z.string().optional(),
});
export type CreateDailyPriceItemInput = z.input<typeof CreateDailyPriceItemInputSchema>;

export const BatchCreateDailyPriceInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'فرمت تاریخ باید YYYY-MM-DD باشد'),
  prices: z.array(CreateDailyPriceItemInputSchema).min(1, 'حداقل یک نرخ روزانه الزامی است'),
});
export type BatchCreateDailyPriceInput = z.input<typeof BatchCreateDailyPriceInputSchema>;

export const CopyYesterdayPricesInputSchema = z.object({
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'فرمت تاریخ باید YYYY-MM-DD باشد'),
  sourceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'فرمت تاریخ باید YYYY-MM-DD باشد')
    .optional(),
});
export type CopyYesterdayPricesInput = z.infer<typeof CopyYesterdayPricesInputSchema>;

export const DailyPriceListQuerySchema = z.object({
  date: z.string().optional(),
  category: ProductCategoryTypeSchema.optional(),
  mill: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(100).optional(),
});
export type DailyPriceListQuery = z.infer<typeof DailyPriceListQuerySchema>;
