import { SettingsService, numberToPersianWords } from '../settings.service';
import { TenantPrismaService } from '../../../infra/tenancy';
import { Prisma } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('SettingsService', () => {
  let service: SettingsService;
  let mockPrisma: {
    companyProfile: Record<string, jest.Mock>;
    saleOrder: Record<string, jest.Mock>;
  };
  let mockTenantPrisma: TenantPrismaService;

  beforeEach(() => {
    mockPrisma = {
      companyProfile: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
      saleOrder: {
        findFirst: jest.fn(),
      },
    };

    mockTenantPrisma = {
      client: mockPrisma,
    } as unknown as TenantPrismaService;

    service = new SettingsService(mockTenantPrisma);
  });

  describe('numberToPersianWords', () => {
    it('converts numbers to Persian words accurately', () => {
      expect(numberToPersianWords(0)).toBe('صفر تومان');
      expect(numberToPersianWords(25000)).toBe('بیست و پنج هزار تومان');
      expect(numberToPersianWords(305800000)).toBe('سیصد و پنج میلیون و هشتصد هزار تومان');
      expect(numberToPersianWords(1250000000)).toBe('یک میلیارد و دویست و پنجاه میلیون تومان');
    });
  });

  describe('getSettings', () => {
    it('returns existing company profile', async () => {
      const now = new Date();
      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 1,
        name: 'آهن پیشتاز',
        legalName: 'شرکت آهن پیشتاز سهامی خاص',
        nationalId: '10103829100',
        registrationNo: '584920',
        economicCode: '411567891234',
        phone: '02154019000',
        email: 'info@iron.ir',
        website: 'https://iron.ir',
        address: 'شادآباد',
        postalCode: '1378945612',
        bankName: 'بانک ملت',
        accountNumber: '5849-2011',
        iban: 'IR820120000000005849201133',
        defaultCurrencyCode: 'IRR',
        defaultTaxRate: new Prisma.Decimal(10),
        defaultQuoteValidityDays: 1,
        termsAndConditions: 'شرایط باسکول',
        logoUrl: null,
        updatedAt: now,
      });

      const result = await service.getSettings();

      expect(result.id).toBe(1);
      expect(result.name).toBe('آهن پیشتاز');
      expect(result.defaultTaxRate).toBe(10);
      expect(result.iban).toBe('IR820120000000005849201133');
    });

    it('creates default profile if none exists', async () => {
      const now = new Date();
      mockPrisma.companyProfile.findUnique.mockResolvedValue(null);
      mockPrisma.companyProfile.create.mockResolvedValue({
        id: 1,
        name: 'شرکت بازرگانی آهن و مقاطع فولادی پیشتاز',
        legalName: 'شرکت بازرگانی آهن و مقاطع فولادی پیشتاز پارس (سهامی خاص)',
        nationalId: '۱۰۱۰۳۸۲۹۱۰۰',
        registrationNo: '۵۸۴۹۲۰',
        economicCode: '۴۱۱۵۶۷۸۹۱۲۳۴',
        phone: '۰۲۱-۵۴۰۱۹۰۰۰',
        email: null,
        website: null,
        address: 'تهران، بازار آهن شادآباد، مجتمع تجاری ۱۱۰، پلاک ۴۲',
        postalCode: '۱۳۷۸۹۴۵۶۱۲',
        bankName: 'بانک ملت - شعبه بازار آهن',
        accountNumber: '۵۸۴۹-۲۰۱۱-۳۳۴۴',
        iban: 'IR820120000000005849201133',
        defaultCurrencyCode: 'IRR',
        defaultTaxRate: new Prisma.Decimal(10),
        defaultQuoteValidityDays: 1,
        termsAndConditions: 'ضوابط باسکول و باربری',
        logoUrl: null,
        updatedAt: now,
      });

      const result = await service.getSettings();

      expect(mockPrisma.companyProfile.create).toHaveBeenCalled();
      expect(result.id).toBe(1);
      expect(result.economicCode).toBe('۴۱۱۵۶۷۸۹۱۲۳۴');
    });
  });

  describe('updateSettings', () => {
    it('upserts company profile with new parameters', async () => {
      const now = new Date();
      mockPrisma.companyProfile.upsert.mockResolvedValue({
        id: 1,
        name: 'فولاد نوین',
        legalName: 'بازرگانی فولاد نوین پارس',
        nationalId: '10109999999',
        registrationNo: '123456',
        economicCode: '411122233344',
        phone: '02188888888',
        email: 'info@novin.com',
        website: null,
        address: 'شادآباد',
        postalCode: '1111111111',
        bankName: 'بانک تجارت',
        accountNumber: '123-456',
        iban: 'IR123456789012345678901234',
        defaultCurrencyCode: 'IRR',
        defaultTaxRate: new Prisma.Decimal(10),
        defaultQuoteValidityDays: 2,
        termsAndConditions: 'تسویه نقدی',
        logoUrl: 'https://logo.png',
        updatedAt: now,
      });

      const result = await service.updateSettings({
        name: 'فولاد نوین',
        bankName: 'بانک تجارت',
        defaultQuoteValidityDays: 2,
      });

      expect(result.name).toBe('فولاد نوین');
      expect(result.bankName).toBe('بانک تجارت');
      expect(result.defaultQuoteValidityDays).toBe(2);
    });
  });

  describe('getOfficialInvoiceData', () => {
    it('generates standard official invoice conforming to tax requirements', async () => {
      const now = new Date();
      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: 1,
        name: 'شرکت بازرگانی آهن پیشتاز',
        legalName: 'شرکت بازرگانی آهن پیشتاز (سهامی خاص)',
        nationalId: '10103829100',
        registrationNo: '584920',
        economicCode: '411567891234',
        phone: '02154019000',
        email: 'info@iron.ir',
        website: null,
        address: 'تهران، بازار آهن شادآباد',
        postalCode: '1378945612',
        bankName: 'بانک ملت',
        accountNumber: '5849-2011',
        iban: 'IR820120000000005849201133',
        defaultCurrencyCode: 'IRR',
        defaultTaxRate: new Prisma.Decimal(10),
        defaultQuoteValidityDays: 1,
        termsAndConditions: 'تسویه بر مبنای باسکول رسمی',
        logoUrl: null,
        updatedAt: now,
      });

      const mockOrder = {
        id: 'ord-1234',
        quotationNo: 'SQ-1403-0001',
        orderNo: 'SO-1403-0001',
        customerName: 'صنایع ساختمانی سهند',
        date: now,
        expiryDate: now,
        shippingAddress: 'پروژه سعادت‌آباد',
        totalWeightKg: new Prisma.Decimal(10000),
        subtotalToman: new Prisma.Decimal(280000000),
        taxToman: new Prisma.Decimal(28000000),
        freightToman: new Prisma.Decimal(5000000),
        grandTotalToman: new Prisma.Decimal(313000000),
        notes: 'بارگیری از کارخانه',
        customer: {
          id: 'cust-1',
          name: 'صنایع ساختمانی سهند',
          nationalId: '10108877665',
          phone: '02122334455',
          city: 'تهران',
        },
        lines: [
          {
            id: 'line-1',
            orderId: 'ord-1234',
            productId: 'p-1',
            productName: 'میلگرد ۱۶ اصفهان',
            mill: 'ذوب آهن اصفهان',
            unit: 'کیلوگرم',
            quantity: new Prisma.Decimal(10000),
            unitPriceToman: new Prisma.Decimal(28000),
            taxPercent: new Prisma.Decimal(10),
            totalPriceToman: new Prisma.Decimal(308000000),
            createdAt: now,
            updatedAt: now,
          },
        ],
      };

      mockPrisma.saleOrder.findFirst.mockResolvedValue(mockOrder);

      const invoice = await service.getOfficialInvoiceData('ord-1234');

      expect(invoice.invoiceNumber).toBe('SO-1403-0001');
      expect(invoice.seller.economicCode).toBe('411567891234');
      expect(invoice.seller.nationalId).toBe('10103829100');
      expect(invoice.buyer.name).toBe('صنایع ساختمانی سهند');
      expect(invoice.buyer.nationalId).toBe('10108877665');
      expect(invoice.lines).toHaveLength(1);
      expect(invoice.lines[0]?.quantity).toBe(10000);
      expect(invoice.totals.subtotalToman).toBe(280000000);
      expect(invoice.totals.taxToman).toBe(28000000);
      expect(invoice.totals.freightToman).toBe(5000000);
      expect(invoice.totals.grandTotalToman).toBe(313000000);
      expect(invoice.totals.grandTotalWords).toBe('سیصد و سیزده میلیون تومان');
    });

    it('throws NotFoundException when order is not found', async () => {
      mockPrisma.companyProfile.findUnique.mockResolvedValue(null);
      mockPrisma.saleOrder.findFirst.mockResolvedValue(null);

      await expect(service.getOfficialInvoiceData('unknown')).rejects.toThrow(NotFoundException);
    });
  });
});
