import { z } from 'zod';

export const CompanySettingsSchema = z.object({
  id: z.number().default(1),
  name: z.string(),
  legalName: z.string().nullable().optional(),
  nationalId: z.string().nullable().optional(),
  registrationNo: z.string().nullable().optional(),
  economicCode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  defaultCurrencyCode: z.string().default('IRR'),
  defaultTaxRate: z.number().min(0).max(100).default(10),
  defaultQuoteValidityDays: z.number().min(1).max(365).default(1),
  termsAndConditions: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  updatedAt: z.string(),
});
export type CompanySettings = z.infer<typeof CompanySettingsSchema>;

export const UpdateCompanySettingsInputSchema = z.object({
  name: z.string().min(1, 'نام شرکت الزامی است').optional(),
  legalName: z.string().optional(),
  nationalId: z.string().optional(),
  registrationNo: z.string().optional(),
  economicCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('فرمت ایمیل نامعتبر است').optional().or(z.literal('')),
  website: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  iban: z.string().optional(),
  defaultCurrencyCode: z.string().optional(),
  defaultTaxRate: z.number().min(0, 'درصد مالیات نمی‌تواند منفی باشد').max(100).optional(),
  defaultQuoteValidityDays: z.number().min(1, 'حداقل اعتبار ۱ روز است').optional(),
  termsAndConditions: z.string().optional(),
  logoUrl: z.string().optional(),
});
export type UpdateCompanySettingsInput = z.infer<typeof UpdateCompanySettingsInputSchema>;

// Official Invoice Structure (فاکتور رسمی استاندارد دارایی - ماده ۱۶۹ مکرر)
export const OfficialInvoicePartySchema = z.object({
  name: z.string(),
  legalName: z.string().optional(),
  economicCode: z.string().optional(),
  nationalId: z.string().optional(),
  registrationNo: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  iban: z.string().optional(),
});
export type OfficialInvoiceParty = z.infer<typeof OfficialInvoicePartySchema>;

export const OfficialInvoiceLineSchema = z.object({
  rowNo: z.number(),
  code: z.string().optional(),
  description: z.string(),
  mill: z.string().optional(),
  unit: z.string(),
  quantity: z.number(),
  unitPriceToman: z.number(),
  subtotalToman: z.number(),
  discountToman: z.number().default(0),
  subtotalAfterDiscountToman: z.number(),
  taxPercent: z.number(),
  taxToman: z.number(),
  totalPriceToman: z.number(),
});
export type OfficialInvoiceLine = z.infer<typeof OfficialInvoiceLineSchema>;

export const OfficialInvoiceTotalsSchema = z.object({
  totalQuantity: z.number(),
  totalWeightKg: z.number(),
  subtotalToman: z.number(),
  discountToman: z.number(),
  subtotalAfterDiscountToman: z.number(),
  taxToman: z.number(),
  freightToman: z.number(),
  grandTotalToman: z.number(),
  grandTotalWords: z.string(),
});
export type OfficialInvoiceTotals = z.infer<typeof OfficialInvoiceTotalsSchema>;

export const OfficialInvoiceViewSchema = z.object({
  invoiceNumber: z.string(),
  quotationNo: z.string(),
  date: z.string(),
  expiryDate: z.string().nullable().optional(),
  seller: OfficialInvoicePartySchema,
  buyer: OfficialInvoicePartySchema,
  lines: z.array(OfficialInvoiceLineSchema),
  totals: OfficialInvoiceTotalsSchema,
  shippingAddress: z.string().nullable().optional(),
  termsAndConditions: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type OfficialInvoiceView = z.infer<typeof OfficialInvoiceViewSchema>;
