import { PortalService } from '../portal.service';
import { TenantPrismaService } from '../../../infra/tenancy';
import { Prisma } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('PortalService', () => {
  let service: PortalService;
  let mockPrisma: {
    saleOrder: Record<string, jest.Mock>;
  };
  let mockTenantPrisma: TenantPrismaService;

  beforeEach(() => {
    mockPrisma = {
      saleOrder: {
        findFirst: jest.fn(),
      },
    };

    mockTenantPrisma = {
      client: mockPrisma,
    } as unknown as TenantPrismaService;

    service = new PortalService(mockTenantPrisma);
  });

  describe('getOrderByTokenOrId', () => {
    it('returns portal order view with items, tonnage, freight, and grand total', async () => {
      const now = new Date();
      const mockOrder = {
        id: '11111111-1111-1111-1111-111111111111',
        quotationNo: 'SQ-1403-0001',
        orderNo: 'SO-1403-0001',
        stage: 'CONFIRMED',
        customerName: 'شرکت سازه گستر البرز',
        date: now,
        expiryDate: now,
        salespersonName: 'کارشناس فروش',
        shippingAddress: 'تهران، پروژه خلیج فارس، کارگاه ساختمانی',
        totalWeightKg: new Prisma.Decimal(25000),
        subtotalToman: new Prisma.Decimal(700000000),
        taxToman: new Prisma.Decimal(70000000),
        freightToman: new Prisma.Decimal(15000000),
        grandTotalToman: new Prisma.Decimal(785000000),
        notes: 'تخلیه بار بر عهده خریدار است',
        portalToken: 'token-abc-123',
        lines: [
          {
            id: '22222222-2222-2222-2222-222222222222',
            orderId: '11111111-1111-1111-1111-111111111111',
            productId: '33333333-3333-3333-3333-333333333333',
            productName: 'تیرآهن ۱۸ ذوب آهن اصفهان',
            mill: 'ذوب آهن اصفهان',
            unit: 'شاخه',
            quantity: new Prisma.Decimal(100),
            unitPriceToman: new Prisma.Decimal(7000000),
            taxPercent: new Prisma.Decimal(10),
            totalPriceToman: new Prisma.Decimal(770000000),
            allocatedQuantity: new Prisma.Decimal(0),
            createdAt: now,
            updatedAt: now,
          },
        ],
      };

      mockPrisma.saleOrder.findFirst.mockResolvedValue(mockOrder);

      const result = await service.getOrderByTokenOrId('token-abc-123');

      expect(mockPrisma.saleOrder.findFirst).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          OR: [
            { portalToken: 'token-abc-123' },
            { quotationNo: 'token-abc-123' },
            { orderNo: 'token-abc-123' },
          ],
        },
        include: {
          lines: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      expect(result.id).toBe(mockOrder.id);
      expect(result.quotationNo).toBe('SQ-1403-0001');
      expect(result.orderNo).toBe('SO-1403-0001');
      expect(result.stage).toBe('CONFIRMED');
      expect(result.totalWeightKg).toBe(25000);
      expect(result.subtotalToman).toBe(700000000);
      expect(result.taxToman).toBe(70000000);
      expect(result.freightToman).toBe(15000000);
      expect(result.grandTotalToman).toBe(785000000);
      expect(result.shippingAddress).toBe('تهران، پروژه خلیج فارس، کارگاه ساختمانی');
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0].productName).toBe('تیرآهن ۱۸ ذوب آهن اصفهان');
      expect(result.companyInfo).toBeDefined();
      expect(result.companyInfo?.name).toContain('فولادی');
    });

    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.saleOrder.findFirst.mockResolvedValue(null);

      await expect(service.getOrderByTokenOrId('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
