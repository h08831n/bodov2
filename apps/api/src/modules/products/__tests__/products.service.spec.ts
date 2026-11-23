import { ProductsService } from '../products.service';
import { TenantPrismaService } from '../../../infra/tenancy';
import { Prisma } from '@prisma/client';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ProductsService (Odoo 17 Product Models)', () => {
  let service: ProductsService;
  let mockPrisma: {
    product: Record<string, jest.Mock>;
    productTemplate: Record<string, jest.Mock>;
    productCategory: Record<string, jest.Mock>;
    productAttribute: Record<string, jest.Mock>;
    supplierInfo: Record<string, jest.Mock>;
  };
  let mockTenantPrisma: TenantPrismaService;

  beforeEach(() => {
    mockPrisma = {
      product: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      productTemplate: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      productCategory: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      productAttribute: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      supplierInfo: {
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    mockTenantPrisma = {
      client: mockPrisma,
    } as unknown as TenantPrismaService;

    service = new ProductsService(mockTenantPrisma);
  });

  describe('createTemplate (Odoo 17 product.template)', () => {
    it('creates a product template with sales price, cost price, and invoicing policy', async () => {
      const now = new Date();
      const mockTemplate = {
        id: 't-1',
        name: 'میلگرد آجدار ذوب آهن اصفهان',
        type: 'STORABLE',
        invoicingPolicy: 'ORDERED',
        categoryId: null,
        defaultCode: 'REBAR-ISF',
        barcode: '62600001',
        salesPriceToman: new Prisma.Decimal(28500),
        costPriceToman: new Prisma.Decimal(27000),
        uomId: null,
        purchaseUomId: null,
        canBeSold: true,
        canBePurchased: true,
        descriptionSale: 'تحویل درب کارخانه',
        descriptionPurchase: null,
        internalNotes: null,
        weightKg: new Prisma.Decimal(1.58),
        isActive: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        category: null,
        uom: null,
        purchaseUom: null,
        variants: [],
      };

      mockPrisma.productTemplate.create.mockResolvedValue(mockTemplate);

      const result = await service.createTemplate({
        name: 'میلگرد آجدار ذوب آهن اصفهان',
        type: 'STORABLE',
        salesPriceToman: 28500,
        costPriceToman: 27000,
        canBeSold: true,
        canBePurchased: true,
      });

      expect(mockPrisma.productTemplate.create).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('میلگرد آجدار ذوب آهن اصفهان');
      expect(result.salesPriceToman).toBe(28500);
      expect(result.costPriceToman).toBe(27000);
      expect(result.type).toBe('STORABLE');
    });
  });

  describe('create (Product Variant)', () => {
    it('creates a steel product with specific attributes', async () => {
      const now = new Date();
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const mockProduct = {
        id: 'p1111111-1111-1111-1111-111111111111',
        code: 'REBAR-16-A3-ISF',
        name: 'میلگرد ۱۶ آجدار A3 ذوب آهن',
        category: 'REBAR',
        mill: 'ذوب آهن اصفهان',
        standard: 'A3',
        size: '16',
        defaultUnit: 'کیلوگرم',
        allowedUnits: ['کیلوگرم', 'شاخه', 'بندل'],
        pricePerKgToman: new Prisma.Decimal(28500),
        priceExtraToman: new Prisma.Decimal(0),
        stockKg: new Prisma.Decimal(45000),
        forecastedKg: new Prisma.Decimal(45000),
        soldQtyKg: new Prisma.Decimal(10000),
        purchasedQtyKg: new Prisma.Decimal(55000),
        barcode: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      mockPrisma.product.create.mockResolvedValue(mockProduct);

      const result = await service.create({
        code: 'REBAR-16-A3-ISF',
        name: 'میلگرد ۱۶ آجدار A3 ذوب آهن',
        category: 'REBAR',
        mill: 'ذوب آهن اصفهان',
        standard: 'A3',
        size: '16',
        defaultUnit: 'کیلوگرم',
        allowedUnits: ['کیلوگرم', 'شاخه', 'بندل'],
        pricePerKgToman: 28500,
        stockKg: 45000,
      });

      expect(result.code).toBe('REBAR-16-A3-ISF');
      expect(result.pricePerKgToman).toBe(28500);
      expect(result.stockKg).toBe(45000);
      expect(result.allowedUnits).toEqual(['کیلوگرم', 'شاخه', 'بندل']);
    });

    it('throws ConflictException on duplicate product code', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'existing-id',
        code: 'REBAR-16',
        deletedAt: null,
      });

      await expect(
        service.create({
          code: 'REBAR-16',
          name: 'تکراری',
          category: 'REBAR',
          mill: 'ذوب آهن',
          standard: 'A3',
          size: '16',
          defaultUnit: 'کیلوگرم',
          allowedUnits: ['کیلوگرم'],
          pricePerKgToman: 1000,
          stockKg: 100,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getMetrics (Odoo 17 Smart Buttons)', () => {
    it('returns on-hand, forecasted, sold and purchased quantities', async () => {
      const now = new Date();
      mockPrisma.product.findFirst.mockResolvedValue({
        id: 'p-1',
        code: 'REBAR-16',
        name: 'میلگرد ۱۶',
        category: 'REBAR',
        mill: 'ذوب آهن',
        standard: 'A3',
        size: '16',
        defaultUnit: 'کیلوگرم',
        allowedUnits: ['کیلوگرم'],
        pricePerKgToman: new Prisma.Decimal(28500),
        priceExtraToman: new Prisma.Decimal(0),
        stockKg: new Prisma.Decimal(45000),
        forecastedKg: new Prisma.Decimal(42000),
        soldQtyKg: new Prisma.Decimal(120000),
        purchasedQtyKg: new Prisma.Decimal(165000),
        barcode: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        template: null,
        supplierInfos: [],
      });

      const metrics = await service.getMetrics('p-1');

      expect(metrics.onHandKg).toBe(45000);
      expect(metrics.forecastedKg).toBe(42000);
      expect(metrics.soldQtyKg).toBe(120000);
      expect(metrics.purchasedQtyKg).toBe(165000);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when product does not exist', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
