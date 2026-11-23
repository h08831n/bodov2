import { SalesService } from '../sales.service';
import { TenantPrismaService, TenantTransactionService } from '../../../infra/tenancy';
import { Prisma } from '@prisma/client';

describe('SalesService', () => {
  let service: SalesService;
  let mockPrisma: {
    saleOrder: Record<string, jest.Mock>;
    saleOrderLine: Record<string, jest.Mock>;
    sequence: Record<string, jest.Mock>;
  };
  let mockTenantPrisma: TenantPrismaService;
  let mockTxService: TenantTransactionService;

  beforeEach(() => {
    mockPrisma = {
      saleOrder: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      saleOrderLine: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      sequence: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    mockTenantPrisma = {
      client: mockPrisma,
    } as unknown as TenantPrismaService;

    mockTxService = {
      run: jest.fn(async (cb) => cb()),
    } as unknown as TenantTransactionService;

    service = new SalesService(mockTenantPrisma, mockTxService);
  });

  describe('create', () => {
    it('creates quotation with SQ sequence, calculates steel line totals & 10% tax', async () => {
      const now = new Date();
      mockPrisma.sequence.findUnique.mockResolvedValue({
        code: 'SALE_QUOTATION',
        nextValue: 10n,
      });
      mockPrisma.sequence.update.mockResolvedValue({});

      const mockCreatedOrder = {
        id: 'ord-1111-1111-1111',
        quotationNo: 'SQ-2026-00011',
        orderNo: null,
        customerId: 'cust-1111-1111',
        customerName: 'فولاد غرب',
        stage: 'DRAFT',
        date: now,
        expiryDate: null,
        salespersonId: 'sp-1',
        salespersonName: 'کارشناس فروش',
        subtotalToman: new Prisma.Decimal(285000000), // 10000 kg * 28500
        taxToman: new Prisma.Decimal(28500000), // 10%
        grandTotalToman: new Prisma.Decimal(313500000),
        lostReasonId: null,
        lostNotes: null,
        notes: 'تحویل انبار تهران',
        lines: [
          {
            id: 'line-1',
            orderId: 'ord-1111-1111-1111',
            productId: 'prod-1',
            productName: 'میلگرد ۱۴ ذوب آهن',
            mill: 'ذوب آهن اصفهان',
            unit: 'کیلوگرم',
            quantity: new Prisma.Decimal(10000),
            unitPriceToman: new Prisma.Decimal(28500),
            taxPercent: new Prisma.Decimal(10),
            totalPriceToman: new Prisma.Decimal(313500000),
            createdAt: now,
            updatedAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      mockPrisma.saleOrder.create.mockResolvedValue(mockCreatedOrder);

      const result = await service.create(
        {
          customerId: 'cust-1111-1111',
          customerName: 'فولاد غرب',
          notes: 'تحویل انبار تهران',
          lines: [
            {
              productId: 'prod-1',
              productName: 'میلگرد ۱۴ ذوب آهن',
              mill: 'ذوب آهن اصفهان',
              unit: 'کیلوگرم',
              quantity: 10000,
              unitPriceToman: 28500,
              taxPercent: 10,
            },
          ],
        },
        { id: 'sp-1', name: 'کارشناس فروش' },
      );

      expect(mockTxService.run).toHaveBeenCalledTimes(1);
      expect(result.quotationNo).toBe('SQ-2026-00011');
      expect(result.subtotalToman).toBe(285000000);
      expect(result.taxToman).toBe(28500000);
      expect(result.grandTotalToman).toBe(313500000);
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0].totalPriceToman).toBe(313500000);
    });
  });

  describe('transitionStage', () => {
    it('assigns SO sequence number when transitioning to CONFIRMED', async () => {
      const now = new Date();
      const existingOrder = {
        id: 'ord-1',
        quotationNo: 'SQ-2026-00001',
        orderNo: null,
        customerId: 'cust-1',
        customerName: 'فولاد غرب',
        stage: 'SENT',
        date: now,
        expiryDate: null,
        salespersonId: null,
        salespersonName: null,
        subtotalToman: new Prisma.Decimal(100000),
        taxToman: new Prisma.Decimal(10000),
        grandTotalToman: new Prisma.Decimal(110000),
        lostReasonId: null,
        lostNotes: null,
        notes: null,
        lines: [],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      mockPrisma.saleOrder.findFirst.mockResolvedValue(existingOrder);
      mockPrisma.sequence.findUnique.mockResolvedValue({
        code: 'SALE_ORDER',
        nextValue: 5n,
      });
      mockPrisma.sequence.update.mockResolvedValue({});

      mockPrisma.saleOrder.update.mockResolvedValue({
        ...existingOrder,
        stage: 'CONFIRMED',
        orderNo: 'SO-2026-00006',
      });

      const result = await service.transitionStage('ord-1', {
        stage: 'CONFIRMED',
      });

      expect(result.stage).toBe('CONFIRMED');
      expect(result.orderNo).toBe('SO-2026-00006');
    });

    it('stores lostReasonId and lostNotes when transitioning to LOST', async () => {
      const now = new Date();
      const existingOrder = {
        id: 'ord-1',
        quotationNo: 'SQ-2026-00001',
        orderNo: null,
        customerId: 'cust-1',
        customerName: 'فولاد غرب',
        stage: 'SENT',
        date: now,
        expiryDate: null,
        salespersonId: null,
        salespersonName: null,
        subtotalToman: new Prisma.Decimal(100000),
        taxToman: new Prisma.Decimal(10000),
        grandTotalToman: new Prisma.Decimal(110000),
        lostReasonId: null,
        lostNotes: null,
        notes: null,
        lines: [],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      mockPrisma.saleOrder.findFirst.mockResolvedValue(existingOrder);
      mockPrisma.saleOrder.update.mockResolvedValue({
        ...existingOrder,
        stage: 'LOST',
        lostReasonId: 'reason-price-high',
        lostNotes: 'قیمت بازار ۲٪ ارزان‌تر بود',
      });

      const result = await service.transitionStage('ord-1', {
        stage: 'LOST',
        lostReasonId: 'reason-price-high',
        lostNotes: 'قیمت بازار ۲٪ ارزان‌تر بود',
      });

      expect(result.stage).toBe('LOST');
      expect(result.lostReasonId).toBe('reason-price-high');
      expect(result.lostNotes).toBe('قیمت بازار ۲٪ ارزان‌تر بود');
    });

    it('confirmQuotation automatically transitions order to CONFIRMED stage', async () => {
      const now = new Date();
      const existingOrder = {
        id: 'ord-confirm-1',
        quotationNo: 'SQ-1403-00001',
        orderNo: null,
        customerId: 'cust-1',
        customerName: 'فولاد غرب',
        stage: 'DRAFT',
        date: now,
        expiryDate: null,
        salespersonId: null,
        salespersonName: null,
        subtotalToman: new Prisma.Decimal(100000),
        taxToman: new Prisma.Decimal(10000),
        freightToman: new Prisma.Decimal(5000),
        grandTotalToman: new Prisma.Decimal(115000),
        totalWeightKg: new Prisma.Decimal(2000),
        shippingAddress: 'انبار شورآباد',
        portalToken: 'pt-123',
        lostReasonId: null,
        lostNotes: null,
        notes: null,
        lines: [],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      mockPrisma.saleOrder.findFirst.mockResolvedValue(existingOrder);
      mockPrisma.sequence.findUnique.mockResolvedValue({
        code: 'SALE_ORDER',
        nextValue: 12n,
      });
      mockPrisma.sequence.update.mockResolvedValue({});

      mockPrisma.saleOrder.update.mockResolvedValue({
        ...existingOrder,
        stage: 'CONFIRMED',
        orderNo: 'SO-1403-0013',
      });

      const result = await service.confirmQuotation('ord-confirm-1');

      expect(result.stage).toBe('CONFIRMED');
      expect(result.orderNo).toBe('SO-1403-0013');
      expect(result.freightToman).toBe(5000);
      expect(result.shippingAddress).toBe('انبار شورآباد');
    });
  });
});
