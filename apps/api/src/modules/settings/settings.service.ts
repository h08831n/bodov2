import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SaleOrderLine } from '@prisma/client';
import { TenantPrismaService } from '../../infra/tenancy';
import {
  CompanySettings,
  UpdateCompanySettingsInput,
  OfficialInvoiceView,
  OfficialInvoiceParty,
  OfficialInvoiceLine,
} from '@bodo/contracts';

export function numberToPersianWords(num: number): string {
  if (num === 0) return 'صفر تومان';

  const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const teens = [
    'ده',
    'یازده',
    'دوازده',
    'سیزده',
    'چهارده',
    'پانزده',
    'شانزده',
    'هفده',
    'هجده',
    'نوزده',
  ];
  const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const hundreds = [
    '',
    'یکصد',
    'دویست',
    'سیصد',
    'چهارصد',
    'پانصد',
    'ششصد',
    'هفتصد',
    'هشتصد',
    'نهصد',
  ];
  const scales = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

  function convertChunk(n: number): string {
    const parts: string[] = [];
    const h = Math.floor(n / 100);
    const rem = n % 100;
    if (h > 0) parts.push(hundreds[h]!);
    if (rem >= 10 && rem < 20) {
      parts.push(teens[rem - 10]!);
    } else {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      if (t > 0) parts.push(tens[t]!);
      if (o > 0) parts.push(ones[o]!);
    }
    return parts.join(' و ');
  }

  let remaining = Math.abs(Math.floor(num));
  const chunkWords: string[] = [];
  let scaleIndex = 0;

  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const chunkWord = convertChunk(chunk);
      const scale = scales[scaleIndex];
      chunkWords.unshift(scale ? `${chunkWord} ${scale}` : chunkWord);
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex++;
  }

  return (chunkWords.join(' و ') + ' تومان').trim();
}

@Injectable()
export class SettingsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  private get prisma() {
    return this.tenantPrisma.client;
  }

  async getSettings(): Promise<CompanySettings> {
    let profile = await this.prisma.companyProfile.findUnique({
      where: { id: 1 },
    });

    if (!profile) {
      profile = await this.prisma.companyProfile.create({
        data: {
          id: 1,
          name: 'شرکت بازرگانی آهن و مقاطع فولادی پیشتاز',
          legalName: 'شرکت بازرگانی آهن و مقاطع فولادی پیشتاز پارس (سهامی خاص)',
          economicCode: '۴۱۱۵۶۷۸۹۱۲۳۴',
          nationalId: '۱۰۱۰۳۸۲۹۱۰۰',
          registrationNo: '۵۸۴۹۲۰',
          phone: '۰۲۱-۵۴۰۱۹۰۰۰',
          address: 'تهران، بازار آهن شادآباد، مجتمع تجاری ۱۱۰، پلاک ۴۲',
          postalCode: '۱۳۷۸۹۴۵۶۱۲',
          bankName: 'بانک ملت - شعبه بازار آهن',
          accountNumber: '۵۸۴۹-۲۰۱۱-۳۳۴۴',
          iban: 'IR820120000000005849201133',
          defaultTaxRate: new Prisma.Decimal(10),
          defaultQuoteValidityDays: 1,
          termsAndConditions:
            '۱. وزن نهایی بار پس از باسکول رسمی مبدأ یا مقصد محاسبه و تسویه بر مبنای قبض باسکول معتبر انجام می‌گیرد.\n۲. کرایه حمل طبق بارنامه رسمی باربری بوده و بر عهده خریدار می‌باشد مگر در موارد توافق‌شده.\n۳. تخلیه بار در مقصد بر عهده خریدار است.',
          defaultCurrencyCode: 'IRR',
        },
      });
    }

    return this.formatProfile(profile);
  }

  async updateSettings(data: UpdateCompanySettingsInput): Promise<CompanySettings> {
    const updateData: Prisma.CompanyProfileUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.legalName !== undefined && { legalName: data.legalName }),
      ...(data.nationalId !== undefined && { nationalId: data.nationalId }),
      ...(data.registrationNo !== undefined && { registrationNo: data.registrationNo }),
      ...(data.economicCode !== undefined && { economicCode: data.economicCode }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.website !== undefined && { website: data.website }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
      ...(data.bankName !== undefined && { bankName: data.bankName }),
      ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber }),
      ...(data.iban !== undefined && { iban: data.iban }),
      ...(data.defaultTaxRate !== undefined && {
        defaultTaxRate: new Prisma.Decimal(data.defaultTaxRate),
      }),
      ...(data.defaultQuoteValidityDays !== undefined && {
        defaultQuoteValidityDays: data.defaultQuoteValidityDays,
      }),
      ...(data.termsAndConditions !== undefined && {
        termsAndConditions: data.termsAndConditions,
      }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
    };

    const updated = await this.prisma.companyProfile.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        name: data.name || 'شرکت بازرگانی آهن‌آلات',
        legalName: data.legalName,
        nationalId: data.nationalId,
        economicCode: data.economicCode,
        registrationNo: data.registrationNo,
        phone: data.phone,
        address: data.address,
        postalCode: data.postalCode,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        iban: data.iban,
        defaultTaxRate: new Prisma.Decimal(data.defaultTaxRate ?? 10),
        defaultQuoteValidityDays: data.defaultQuoteValidityDays ?? 1,
        termsAndConditions: data.termsAndConditions,
        logoUrl: data.logoUrl,
        defaultCurrencyCode: 'IRR',
      },
      update: updateData,
    });

    return this.formatProfile(updated);
  }

  async getOfficialInvoiceData(saleOrderId: string): Promise<OfficialInvoiceView> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      saleOrderId,
    );

    const order = await this.prisma.saleOrder.findFirst({
      where: {
        deletedAt: null,
        OR: [
          ...(isUuid ? [{ id: saleOrderId }] : []),
          { quotationNo: saleOrderId },
          { orderNo: saleOrderId },
        ],
      },
      include: {
        lines: {
          orderBy: { createdAt: 'asc' },
        },
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundException('سفارش مورد نظر جهت صدور فاکتور رسمی یافت نشد');
    }

    const companySettings = await this.getSettings();

    const seller: OfficialInvoiceParty = {
      name: companySettings.name,
      legalName: companySettings.legalName || companySettings.name,
      economicCode: companySettings.economicCode || '۴۱۱۵۶۷۸۹۱۲۳۴',
      nationalId: companySettings.nationalId || '۱۰۱۰۳۸۲۹۱۰۰',
      registrationNo: companySettings.registrationNo || '۵۸۴۹۲۰',
      postalCode: companySettings.postalCode || '۱۳۷۸۹۴۵۶۱۲',
      phone: companySettings.phone || '۰۲۱-۵۴۰۱۹۰۰۰',
      address: companySettings.address || 'تهران، بازار آهن شادآباد',
      bankName: companySettings.bankName || 'بانک ملت',
      accountNumber: companySettings.accountNumber || '',
      iban: companySettings.iban || '',
    };

    const customer = order.customer;
    const buyer: OfficialInvoiceParty = {
      name: order.customerName,
      legalName: order.customerName,
      economicCode: customer?.nationalId || '—',
      nationalId: customer?.nationalId || '—',
      registrationNo: '—',
      postalCode: '—',
      phone: customer?.phone || '—',
      address: order.shippingAddress || customer?.city || 'تهران',
    };

    let totalQuantity = 0;
    let totalWeightKg = Number(order.totalWeightKg ?? 0);
    let subtotalToman = 0;
    let taxToman = 0;

    const lines: OfficialInvoiceLine[] = order.lines.map((line: SaleOrderLine, idx: number) => {
      const qty = Number(line.quantity);
      const unitPrice = Number(line.unitPriceToman);
      const lineSubtotal = qty * unitPrice;
      const taxPercent = Number(line.taxPercent);
      const lineTax = Math.round(lineSubtotal * (taxPercent / 100));
      const lineTotal = lineSubtotal + lineTax;

      totalQuantity += qty;
      subtotalToman += lineSubtotal;
      taxToman += lineTax;

      if (!order.totalWeightKg) {
        const u = line.unit?.trim().toLowerCase() ?? '';
        if (u === 'تن' || u === 'ton' || u === 'tons') {
          totalWeightKg += qty * 1000;
        } else {
          totalWeightKg += qty;
        }
      }

      return {
        rowNo: idx + 1,
        code: line.productId ? line.productId.slice(0, 8).toUpperCase() : `STL-${idx + 1}`,
        description: line.productName,
        mill: line.mill,
        unit: line.unit,
        quantity: qty,
        unitPriceToman: unitPrice,
        subtotalToman: lineSubtotal,
        discountToman: 0,
        subtotalAfterDiscountToman: lineSubtotal,
        taxPercent,
        taxToman: lineTax,
        totalPriceToman: lineTotal,
      };
    });

    const freightToman = Number(order.freightToman ?? 0);
    const grandTotalToman = subtotalToman + taxToman + freightToman;
    const grandTotalWords = numberToPersianWords(grandTotalToman);

    return {
      invoiceNumber: order.orderNo || order.quotationNo,
      quotationNo: order.quotationNo,
      date:
        order.date instanceof Date
          ? order.date.toISOString().slice(0, 10)
          : String(order.date).slice(0, 10),
      expiryDate: order.expiryDate
        ? order.expiryDate instanceof Date
          ? order.expiryDate.toISOString().slice(0, 10)
          : String(order.expiryDate).slice(0, 10)
        : null,
      seller,
      buyer,
      lines,
      totals: {
        totalQuantity,
        totalWeightKg,
        subtotalToman,
        discountToman: 0,
        subtotalAfterDiscountToman: subtotalToman,
        taxToman,
        freightToman,
        grandTotalToman,
        grandTotalWords,
      },
      shippingAddress: order.shippingAddress,
      termsAndConditions: companySettings.termsAndConditions,
      notes: order.notes,
    };
  }

  private formatProfile(profile: {
    id: number;
    name: string;
    legalName: string | null;
    nationalId: string | null;
    registrationNo: string | null;
    economicCode: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    address: string | null;
    postalCode: string | null;
    bankName: string | null;
    accountNumber: string | null;
    iban: string | null;
    defaultCurrencyCode: string;
    defaultTaxRate: Prisma.Decimal;
    defaultQuoteValidityDays: number;
    termsAndConditions: string | null;
    logoUrl: string | null;
    updatedAt: Date;
  }): CompanySettings {
    return {
      id: profile.id,
      name: profile.name,
      legalName: profile.legalName,
      nationalId: profile.nationalId,
      registrationNo: profile.registrationNo,
      economicCode: profile.economicCode,
      phone: profile.phone,
      email: profile.email,
      website: profile.website,
      address: profile.address,
      postalCode: profile.postalCode,
      bankName: profile.bankName,
      accountNumber: profile.accountNumber,
      iban: profile.iban,
      defaultCurrencyCode: profile.defaultCurrencyCode,
      defaultTaxRate: Number(profile.defaultTaxRate),
      defaultQuoteValidityDays: profile.defaultQuoteValidityDays,
      termsAndConditions: profile.termsAndConditions,
      logoUrl: profile.logoUrl,
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
