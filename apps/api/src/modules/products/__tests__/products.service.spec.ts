import { ProductsService } from '../products.service';
import { TenantPrismaService } from '../../../infra/tenancy';
import { Prisma } from '@prisma/client';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockPrisma: { product: Record<string, jest.Mock> };
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
    };

    mockTenantPrisma = {
      client: mockPrisma,
    } as unknown as TenantPrismaService;

    service = new ProductsService(mockTenantPrisma);
  });

  describe('create', () => {
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
        stockKg: new Prisma.Decimal(45000),
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

  describe('findById', () => {
    it('throws NotFoundException when product does not exist', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
