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

export const ProductTypeSchema = z.enum(['STORABLE', 'CONSUMABLE', 'SERVICE']);
export type ProductType = z.infer<typeof ProductTypeSchema>;

export const InvoicingPolicySchema = z.enum(['ORDERED', 'DELIVERED']);
export type InvoicingPolicy = z.infer<typeof InvoicingPolicySchema>;

export const UomTypeSchema = z.enum(['REFERENCE', 'BIGGER', 'SMALLER']);
export type UomType = z.infer<typeof UomTypeSchema>;

// UoM
export const UomCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UomCategory = z.infer<typeof UomCategorySchema>;

export const UomSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  uomType: UomTypeSchema,
  factor: z.number().or(z.string()),
  rounding: z.number().or(z.string()),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Uom = z.infer<typeof UomSchema>;

export const CreateUomInputSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1, 'نام واحد الزامی است'),
  uomType: UomTypeSchema.default('REFERENCE'),
  factor: z.number().positive().default(1),
  rounding: z.number().positive().default(0.001),
});
export type CreateUomInput = z.input<typeof CreateUomInputSchema>;

// Product Category (Hierarchical)
export const ProductCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  parentId: z.string().uuid().nullable().optional(),
  fullPath: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const CreateProductCategoryInputSchema = z.object({
  name: z.string().min(2, 'نام دسته‌بندی باید حداقل ۲ نویسه باشد'),
  parentId: z.string().uuid().optional(),
});
export type CreateProductCategoryInput = z.input<typeof CreateProductCategoryInputSchema>;

// Attributes & Values (Odoo 17 Matrix)
export const ProductAttributeValueSchema = z.object({
  id: z.string().uuid(),
  attributeId: z.string().uuid(),
  name: z.string().min(1),
  sequence: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProductAttributeValue = z.infer<typeof ProductAttributeValueSchema>;

export const ProductAttributeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  displayType: z.string(),
  sequence: z.number(),
  values: z.array(ProductAttributeValueSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProductAttribute = z.infer<typeof ProductAttributeSchema>;

export const CreateProductAttributeInputSchema = z.object({
  name: z.string().min(2, 'نام ویژگی الزامی است'),
  displayType: z.enum(['radio', 'select', 'color']).default('radio'),
  sequence: z.number().default(0),
  values: z.array(z.string().min(1)).optional(),
});
export type CreateProductAttributeInput = z.input<typeof CreateProductAttributeInputSchema>;

// Supplier Info (Vendor Pricelist - Odoo 17 Purchase Tab)
export const SupplierInfoSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid().nullable().optional(),
  variantId: z.string().uuid().nullable().optional(),
  vendorId: z.string().uuid(),
  vendorName: z.string(),
  vendorProductCode: z.string().nullable().optional(),
  vendorProductName: z.string().nullable().optional(),
  minQuantity: z.number().or(z.string()),
  priceToman: z.number().or(z.string()),
  currency: z.string().default('TOMAN'),
  leadTimeDays: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SupplierInfo = z.infer<typeof SupplierInfoSchema>;

export const CreateSupplierInfoInputSchema = z.object({
  templateId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  vendorId: z.string().uuid('شناسه تأمین‌کننده الزامی است'),
  vendorName: z.string().min(1, 'نام تأمین‌کننده الزامی است'),
  vendorProductCode: z.string().optional(),
  vendorProductName: z.string().optional(),
  minQuantity: z.number().positive().default(1),
  priceToman: z.number().nonnegative().default(0),
  currency: z.string().default('TOMAN'),
  leadTimeDays: z.number().nonnegative().default(1),
});
export type CreateSupplierInfoInput = z.input<typeof CreateSupplierInfoInputSchema>;

// Product Template (Odoo 17 product.template)
export const ProductTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: ProductTypeSchema,
  invoicingPolicy: InvoicingPolicySchema,
  categoryId: z.string().uuid().nullable().optional(),
  categoryName: z.string().optional(),
  defaultCode: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  salesPriceToman: z.number().or(z.string()),
  costPriceToman: z.number().or(z.string()),
  uomId: z.string().uuid().nullable().optional(),
  uomName: z.string().optional(),
  purchaseUomId: z.string().uuid().nullable().optional(),
  purchaseUomName: z.string().optional(),
  canBeSold: z.boolean(),
  canBePurchased: z.boolean(),
  descriptionSale: z.string().nullable().optional(),
  descriptionPurchase: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  weightKg: z.number().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
  variantsCount: z.number().optional(),
});
export type ProductTemplate = z.infer<typeof ProductTemplateSchema>;

export const CreateProductTemplateInputSchema = z.object({
  name: z.string().min(2, 'نام کالا الزامی است'),
  type: ProductTypeSchema.default('STORABLE'),
  invoicingPolicy: InvoicingPolicySchema.default('ORDERED'),
  categoryId: z.string().uuid().optional(),
  defaultCode: z.string().optional(),
  barcode: z.string().optional(),
  salesPriceToman: z.number().nonnegative().default(0),
  costPriceToman: z.number().nonnegative().default(0),
  uomId: z.string().uuid().optional(),
  purchaseUomId: z.string().uuid().optional(),
  canBeSold: z.boolean().default(true),
  canBePurchased: z.boolean().default(true),
  descriptionSale: z.string().optional(),
  descriptionPurchase: z.string().optional(),
  internalNotes: z.string().optional(),
  weightKg: z.number().positive().optional(),
});
export type CreateProductTemplateInput = z.input<typeof CreateProductTemplateInputSchema>;

export const UpdateProductTemplateInputSchema = CreateProductTemplateInputSchema.partial();
export type UpdateProductTemplateInput = z.input<typeof UpdateProductTemplateInputSchema>;

// Product Variant (Odoo 17 product.product)
export const ProductSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid().nullable().optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  category: ProductCategoryTypeSchema,
  mill: z.string(),
  standard: z.string(),
  size: z.string(),
  defaultUnit: z.string(),
  allowedUnits: z.array(z.string()),
  pricePerKgToman: z.string().or(z.number()),
  priceExtraToman: z.string().or(z.number()).optional(),
  stockKg: z.string().or(z.number()),
  forecastedKg: z.string().or(z.number()).optional(),
  soldQtyKg: z.string().or(z.number()).optional(),
  purchasedQtyKg: z.string().or(z.number()).optional(),
  barcode: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});
export type Product = z.infer<typeof ProductSchema>;

export const CreateProductInputSchema = z.object({
  templateId: z.string().uuid().optional(),
  code: z.string().min(2, 'کد محصول باید حداقل ۲ نویسه باشد'),
  name: z.string().min(2, 'نام محصول الزامی است'),
  category: ProductCategoryTypeSchema.default('REBAR'),
  mill: z.string().default(''),
  standard: z.string().default('A3'),
  size: z.string().default(''),
  defaultUnit: z.string().default('کیلوگرم'),
  allowedUnits: z.array(z.string()).default(['کیلوگرم', 'شاخه', 'بندل']),
  pricePerKgToman: z.number().nonnegative('قیمت روز نمی‌تواند منفی باشد').default(0),
  priceExtraToman: z.number().nonnegative().default(0),
  stockKg: z.number().nonnegative('موجودی نمی‌تواند منفی باشد').default(0),
  barcode: z.string().optional(),
});
export type CreateProductInput = z.input<typeof CreateProductInputSchema>;

export const UpdateProductInputSchema = CreateProductInputSchema.partial();
export type UpdateProductInput = z.input<typeof UpdateProductInputSchema>;

export const ProductListQuerySchema = z.object({
  category: ProductCategoryTypeSchema.optional(),
  mill: z.string().optional(),
  search: z.string().optional(),
  templateId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
