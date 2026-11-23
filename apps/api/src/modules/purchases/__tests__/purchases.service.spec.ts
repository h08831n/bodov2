import { PurchasesService } from '../purchases.service';
import { TenantPrismaService, TenantTransactionService } from '../../../infra/tenancy';
import { Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('PurchasesService', () => {
  let service: PurchasesService;
  let mockPrisma: {
    purchaseOrder: Record<string, jest.Mock>;
    purchaseOrderLine: Record<string, jest.Mock>;
    purchaseSaleAllocation: Record<string, jest.Mock>;
    saleOrderLine: Record<string, jest.Mock>;
    sourcingInquiry: Record<string, jest.Mock>;
    sourcingInquiryLine: Record<string, jest.Mock>;
    sequence: Record<string, jest.Mock>;
  };
  let mockTenantPrisma: TenantPrismaService;
  let mockTxService: TenantTransactionService;

  beforeEach(() => {
    mockPrisma = {
      purchaseOrder: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      purchaseOrderLine: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      purchaseSaleAllocation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      saleOrderLine: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      sourcingInquiry: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      sourcingInquiryLine: {
        createMany: jest.fn(),
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

    service = new PurchasesService(mockTenantPrisma, mockTxService);
  });

  describe('create', () => {
    it('creates RFQ with PO sequence, calculates line totals & 10% VAT', async () => {
      mockPrisma.sequence.findUnique.mockResolvedValue({
        code: 'PURCHASE_ORDER',
        nextValue: 5n,
      });
      mockPrisma.sequence.update.mockResolvedValue({});

      const mockCreatedOrder = {
        id: 'po-1111-1111-1111',
        orderNo: 'PO-2026-00006',
        vendorId: 'vend-1111-1111',
        vendorName: 'فولاد مبارکه',
        stage: 'RFQ',
        date: new Date(),
        deliveryDate: null,
        buyerId: 'user-1',
        buyerName: 'کارشناس خرید',
        subtotalToman: new Prisma.Decimal(50000000),
        taxToman: new Prisma.Decimal(5000000),
        grandTotalToman: new Prisma.Decimal(55000000),
        inquiryId: null,
        notes: 'تحویل درب کارخانه',
        version: 1,
        lines: [
          {
            id: 'line-1',
            orderId: 'po-1111-1111-1111',
            productId: null,
            productName: 'میلگرد ۱۴ ذوب آهن',
            mill: 'ذوب آهن اصفهان',
            unit: 'کیلوگرم',
            quantity: new Prisma.Decimal(2000),
            unitPriceToman: new Prisma.Decimal(25000),
            taxPercent: new Prisma.Decimal(10),
            totalPriceToman: new Prisma.Decimal(55000000),
            allocatedQuantity: new Prisma.Decimal(0),
            receivedQuantity: new Prisma.Decimal(0),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.purchaseOrder.create.mockResolvedValue(mockCreatedOrder);

      const result = await service.create(
        {
          vendorId: 'vend-1111-1111',
          vendorName: 'فولاد مبارکه',
          notes: 'تحویل درب کارخانه',
          lines: [
            {
              productName: 'میلگرد ۱۴ ذوب آهن',
              mill: 'ذوب آهن اصفهان',
              unit: 'کیلوگرم',
              quantity: 2000,
              unitPriceToman: 25000,
              taxPercent: 10,
            },
          ],
        },
        { id: 'user-1', name: 'کارشناس خرید' },
      );

      expect(mockPrisma.purchaseOrder.create).toHaveBeenCalled();
      expect(result.orderNo).toBe('PO-2026-00006');
      expect(result.subtotalToman).toBe(50000000);
      expect(result.taxToman).toBe(5000000);
      expect(result.grandTotalToman).toBe(55000000);
      expect(result.stage).toBe('RFQ');
    });
  });

  describe('transitionStage', () => {
    it('allows valid stage transition from RFQ to RFQ_SENT to PURCHASE_ORDER', async () => {
      mockPrisma.purchaseOrder.findFirst.mockResolvedValue({
        id: 'po-1',
        stage: 'RFQ',
        orderNo: 'PO-2026-00001',
        vendorId: 'v-1',
        vendorName: 'فولاد',
        date: new Date(),
        subtotalToman: new Prisma.Decimal(100),
        taxToman: new Prisma.Decimal(10),
        grandTotalToman: new Prisma.Decimal(110),
        version: 1,
        lines: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.purchaseOrder.update.mockResolvedValue({
        id: 'po-1',
        stage: 'RFQ_SENT',
        orderNo: 'PO-2026-00001',
        vendorId: 'v-1',
        vendorName: 'فولاد',
        date: new Date(),
        subtotalToman: new Prisma.Decimal(100),
        taxToman: new Prisma.Decimal(10),
        grandTotalToman: new Prisma.Decimal(110),
        version: 2,
        lines: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.transitionStage('po-1', { stage: 'RFQ_SENT' });
      expect(res.stage).toBe('RFQ_SENT');
    });

    it('rejects invalid stage transition (e.g. RFQ to DONE directly)', async () => {
      mockPrisma.purchaseOrder.findFirst.mockResolvedValue({
        id: 'po-1',
        stage: 'RFQ',
      });

      await expect(service.transitionStage('po-1', { stage: 'DONE' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('allocation', () => {
    it('allocates purchase line to sale line successfully', async () => {
      mockPrisma.saleOrderLine.findUnique.mockResolvedValue({
        id: 'so-line-1',
        productName: 'تیرآهن ۱۶',
        quantity: new Prisma.Decimal(5000),
        allocatedQuantity: new Prisma.Decimal(1000), // remaining: 4000
        order: { id: 'so-1', customerName: 'پارس' },
      });

      mockPrisma.purchaseOrderLine.findUnique.mockResolvedValue({
        id: 'po-line-1',
        productName: 'تیرآهن ۱۶',
        quantity: new Prisma.Decimal(10000),
        allocatedQuantity: new Prisma.Decimal(2000), // remaining: 8000
        order: { id: 'po-1', orderNo: 'PO-100', vendorName: 'ذوب آهن' },
      });

      mockPrisma.purchaseSaleAllocation.create.mockResolvedValue({
        id: 'alloc-1',
        saleOrderLineId: 'so-line-1',
        purchaseOrderLineId: 'po-line-1',
        allocatedQuantity: new Prisma.Decimal(3000),
        status: 'COMMITTED',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        saleOrderLine: {
          id: 'so-line-1',
          productName: 'تیرآهن ۱۶',
          quantity: new Prisma.Decimal(5000),
          allocatedQuantity: new Prisma.Decimal(4000),
          order: { id: 'so-1', quotationNo: 'SQ-1', customerName: 'پارس' },
        },
        purchaseOrderLine: {
          id: 'po-line-1',
          productName: 'تیرآهن ۱۶',
          quantity: new Prisma.Decimal(10000),
          allocatedQuantity: new Prisma.Decimal(5000),
          order: { id: 'po-1', orderNo: 'PO-100', vendorName: 'ذوب آهن' },
        },
      });

      mockPrisma.saleOrderLine.update.mockResolvedValue({});
      mockPrisma.purchaseOrderLine.update.mockResolvedValue({});

      const result = await service.allocate({
        saleOrderLineId: 'so-line-1',
        purchaseOrderLineId: 'po-line-1',
        allocatedQuantity: 3000,
      });

      expect(result.id).toBe('alloc-1');
      expect(result.allocatedQuantity).toBe(3000);
      expect(mockPrisma.saleOrderLine.update).toHaveBeenCalledWith({
        where: { id: 'so-line-1' },
        data: { allocatedQuantity: { increment: expect.any(Object) } },
      });
      expect(mockPrisma.purchaseOrderLine.update).toHaveBeenCalledWith({
        where: { id: 'po-line-1' },
        data: { allocatedQuantity: { increment: expect.any(Object) } },
      });
    });

    it('rejects allocation when requested quantity exceeds sale line remaining', async () => {
      mockPrisma.saleOrderLine.findUnique.mockResolvedValue({
        id: 'so-line-1',
        quantity: new Prisma.Decimal(2000),
        allocatedQuantity: new Prisma.Decimal(1500), // remaining: 500
      });

      mockPrisma.purchaseOrderLine.findUnique.mockResolvedValue({
        id: 'po-line-1',
        quantity: new Prisma.Decimal(10000),
        allocatedQuantity: new Prisma.Decimal(0),
      });

      await expect(
        service.allocate({
          saleOrderLineId: 'so-line-1',
          purchaseOrderLineId: 'po-line-1',
          allocatedQuantity: 1000, // exceeds 500
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects allocation when requested quantity exceeds purchase line remaining', async () => {
      mockPrisma.saleOrderLine.findUnique.mockResolvedValue({
        id: 'so-line-1',
        quantity: new Prisma.Decimal(5000),
        allocatedQuantity: new Prisma.Decimal(0), // remaining: 5000
      });

      mockPrisma.purchaseOrderLine.findUnique.mockResolvedValue({
        id: 'po-line-1',
        quantity: new Prisma.Decimal(2000),
        allocatedQuantity: new Prisma.Decimal(1800), // remaining: 200
      });

      await expect(
        service.allocate({
          saleOrderLineId: 'so-line-1',
          purchaseOrderLineId: 'po-line-1',
          allocatedQuantity: 500, // exceeds 200
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('releases allocation and decrements allocated quantities on both lines', async () => {
      mockPrisma.purchaseSaleAllocation.findUnique.mockResolvedValue({
        id: 'alloc-1',
        saleOrderLineId: 'so-line-1',
        purchaseOrderLineId: 'po-line-1',
        allocatedQuantity: new Prisma.Decimal(1500),
        status: 'COMMITTED',
        notes: null,
      });

      mockPrisma.purchaseSaleAllocation.update.mockResolvedValue({
        id: 'alloc-1',
        saleOrderLineId: 'so-line-1',
        purchaseOrderLineId: 'po-line-1',
        allocatedQuantity: new Prisma.Decimal(1500),
        status: 'RELEASED',
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.saleOrderLine.update.mockResolvedValue({});
      mockPrisma.purchaseOrderLine.update.mockResolvedValue({});

      const result = await service.releaseAllocation('alloc-1', 'انصراف خریدار');
      expect(result.status).toBe('RELEASED');
      expect(mockPrisma.saleOrderLine.update).toHaveBeenCalledWith({
        where: { id: 'so-line-1' },
        data: { allocatedQuantity: { decrement: expect.any(Object) } },
      });
      expect(mockPrisma.purchaseOrderLine.update).toHaveBeenCalledWith({
        where: { id: 'po-line-1' },
        data: { allocatedQuantity: { decrement: expect.any(Object) } },
      });
    });
  });

  describe('sourcingInquiry', () => {
    it('creates sourcing inquiry with INQ sequence number and line items', async () => {
      mockPrisma.sequence.findUnique.mockResolvedValue({
        code: 'SOURCING_INQUIRY',
        nextValue: 2n,
      });
      mockPrisma.sequence.update.mockResolvedValue({});

      mockPrisma.sourcingInquiry.create.mockResolvedValue({
        id: 'inq-1',
        inquiryNo: 'INQ-2026-00003',
        title: 'استعلام تیرآهن پروژه چیتگر',
        stage: 'OPEN',
        saleOrderId: null,
        notes: null,
        lines: [
          {
            id: 'line-1',
            inquiryId: 'inq-1',
            productId: null,
            productName: 'تیرآهن ۱۸ اصفهان',
            mill: 'ذوب آهن',
            quantity: new Prisma.Decimal(50000),
            unit: 'کیلوگرم',
            targetPriceToman: new Prisma.Decimal(27000),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        orders: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const result = await service.createInquiry({
        title: 'استعلام تیرآهن پروژه چیتگر',
        lines: [
          {
            productName: 'تیرآهن ۱۸ اصفهان',
            mill: 'ذوب آهن',
            quantity: 50000,
            unit: 'کیلوگرم',
            targetPriceToman: 27000,
          },
        ],
      });

      expect(result.inquiryNo).toBe('INQ-2026-00003');
      expect(result.title).toBe('استعلام تیرآهن پروژه چیتگر');
      expect(result.lines?.[0].quantity).toBe(50000);
    });
  });
});
