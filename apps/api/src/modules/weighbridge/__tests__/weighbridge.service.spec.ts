import { WeighbridgeService } from '../weighbridge.service';
import { TenantPrismaService, TenantTransactionService } from '../../../infra/tenancy';
import { Prisma } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('WeighbridgeService', () => {
  let service: WeighbridgeService;
  let mockPrisma: {
    weighbridgeSlip: Record<string, jest.Mock>;
    saleOrder: Record<string, jest.Mock>;
    contact: Record<string, jest.Mock>;
    sequence: Record<string, jest.Mock>;
  };
  let mockTenantPrisma: TenantPrismaService;
  let mockTxService: TenantTransactionService;

  beforeEach(() => {
    mockPrisma = {
      weighbridgeSlip: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      saleOrder: {
        findUnique: jest.fn(),
      },
      contact: {
        findUnique: jest.fn(),
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

    service = new WeighbridgeService(mockTenantPrisma, mockTxService);
  });

  describe('create', () => {
    it('creates weighbridge slip with auto-generated WB sequence and net weight', async () => {
      const now = new Date();
      mockPrisma.sequence.findUnique.mockResolvedValue({
        code: 'WEIGHBRIDGE_SLIP',
        nextValue: 5n,
      });

      mockPrisma.weighbridgeSlip.create.mockResolvedValue({
        id: '11111111-1111-1111-1111-111111111111',
        slipNo: 'WB-1403-0006',
        saleOrderId: '22222222-2222-2222-2222-222222222222',
        customerId: '33333333-3333-3333-3333-333333333333',
        customerName: 'فولاد سازان البرز',
        netWeightKg: new Prisma.Decimal(24850),
        vehiclePlate: 'ایران ۱۱ - ۱۲۳ ج ۴۵',
        waybillNo: 'WB-98214',
        driverName: 'رضا کریمی',
        driverMobile: '09121234567',
        scaleName: 'باسکول ۶۰ تنی شادآباد',
        operatorName: 'متصدی ۱',
        weighedAt: now,
        notes: 'بار میلگرد ۱۴ اصفهان',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        saleOrder: {
          id: '22222222-2222-2222-2222-222222222222',
          orderNo: 'SO-1403-0001',
          quotationNo: 'SQ-1403-0001',
        },
      });

      const result = await service.create({
        customerName: 'فولاد سازان البرز',
        netWeightKg: 24850,
        vehiclePlate: 'ایران ۱۱ - ۱۲۳ ج ۴۵',
        waybillNo: 'WB-98214',
        driverName: 'رضا کریمی',
        driverMobile: '09121234567',
        scaleName: 'باسکول ۶۰ تنی شادآباد',
        operatorName: 'متصدی ۱',
        saleOrderId: '22222222-2222-2222-2222-222222222222',
        customerId: '33333333-3333-3333-3333-333333333333',
        notes: 'بار میلگرد ۱۴ اصفهان',
      });

      expect(mockPrisma.weighbridgeSlip.create).toHaveBeenCalled();
      expect(result.slipNo).toContain('WB-');
      expect(result.netWeightKg).toBe(24850);
      expect(result.vehiclePlate).toBe('ایران ۱۱ - ۱۲۳ ج ۴۵');
      expect(result.saleOrderNo).toBe('SO-1403-0001');
    });
  });

  describe('list', () => {
    it('returns weighbridge slips list with cursor pagination', async () => {
      const now = new Date();
      mockPrisma.weighbridgeSlip.findMany.mockResolvedValue([
        {
          id: '11111111-1111-1111-1111-111111111111',
          slipNo: 'WB-1403-0001',
          saleOrderId: null,
          customerId: null,
          customerName: 'پارس متال',
          netWeightKg: new Prisma.Decimal(12500),
          vehiclePlate: 'ایران ۲۲ - ۴۵۶ ص ۱۲',
          waybillNo: 'BL-1122',
          driverName: 'محمد رضایی',
          driverMobile: '09120000000',
          scaleName: 'باسکول مرکزی',
          operatorName: 'علی',
          weighedAt: now,
          notes: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          saleOrder: null,
        },
      ]);

      const result = await service.list({ search: 'پارس' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].customerName).toBe('پارس متال');
      expect(result.items[0].netWeightKg).toBe(12500);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe('getById', () => {
    it('returns slip when found', async () => {
      const now = new Date();
      mockPrisma.weighbridgeSlip.findFirst.mockResolvedValue({
        id: '11111111-1111-1111-1111-111111111111',
        slipNo: 'WB-1403-0001',
        customerName: 'توسعه سازه',
        netWeightKg: new Prisma.Decimal(30000),
        vehiclePlate: 'ایران ۳۳ - ۹۹۹ ل ۸۸',
        weighedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.getById('11111111-1111-1111-1111-111111111111');
      expect(result.id).toBe('11111111-1111-1111-1111-111111111111');
      expect(result.netWeightKg).toBe(30000);
    });

    it('throws NotFoundException when slip does not exist', async () => {
      mockPrisma.weighbridgeSlip.findFirst.mockResolvedValue(null);

      await expect(service.getById('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getBySaleOrderId', () => {
    it('returns all slips for a given sale order', async () => {
      const now = new Date();
      mockPrisma.weighbridgeSlip.findMany.mockResolvedValue([
        {
          id: '11111111-1111-1111-1111-111111111111',
          slipNo: 'WB-1403-0001',
          saleOrderId: 'order-123',
          customerName: 'توسعه سازه',
          netWeightKg: new Prisma.Decimal(25000),
          vehiclePlate: 'ایران ۳۳ - ۹۹۹ ل ۸۸',
          weighedAt: now,
          createdAt: now,
          updatedAt: now,
          saleOrder: {
            id: 'order-123',
            orderNo: 'SO-1403-0005',
            quotationNo: 'SQ-1403-0005',
          },
        },
      ]);

      const result = await service.getBySaleOrderId('order-123');
      expect(result).toHaveLength(1);
      expect(result[0].saleOrderNo).toBe('SO-1403-0005');
      expect(result[0].netWeightKg).toBe(25000);
    });
  });

  describe('update', () => {
    it('updates weighbridge slip data', async () => {
      const now = new Date();
      mockPrisma.weighbridgeSlip.findFirst.mockResolvedValue({
        id: '11111111-1111-1111-1111-111111111111',
        slipNo: 'WB-1403-0001',
      });

      mockPrisma.weighbridgeSlip.update.mockResolvedValue({
        id: '11111111-1111-1111-1111-111111111111',
        slipNo: 'WB-1403-0001',
        customerName: 'توسعه سازه ویرایش‌شده',
        netWeightKg: new Prisma.Decimal(25200),
        vehiclePlate: 'ایران ۳۳ - ۹۹۹ ل ۸۸',
        weighedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      const result = await service.update('11111111-1111-1111-1111-111111111111', {
        customerName: 'توسعه سازه ویرایش‌شده',
        netWeightKg: 25200,
      });

      expect(mockPrisma.weighbridgeSlip.update).toHaveBeenCalled();
      expect(result.customerName).toBe('توسعه سازه ویرایش‌شده');
      expect(result.netWeightKg).toBe(25200);
    });
  });

  describe('delete', () => {
    it('soft deletes slip by setting deletedAt', async () => {
      mockPrisma.weighbridgeSlip.findFirst.mockResolvedValue({
        id: '11111111-1111-1111-1111-111111111111',
      });

      mockPrisma.weighbridgeSlip.update.mockResolvedValue({});

      const result = await service.delete('11111111-1111-1111-1111-111111111111');
      expect(mockPrisma.weighbridgeSlip.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '11111111-1111-1111-1111-111111111111' },
          data: { deletedAt: expect.any(Date) },
        }),
      );
      expect(result.success).toBe(true);
    });
  });
});
