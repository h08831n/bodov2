import { CrmService } from '../crm.service';
import { TenantPrismaService, TenantTransactionService } from '../../../infra/tenancy';
import { SalesService } from '../../sales/sales.service';
import { Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('CrmService', () => {
  let service: CrmService;
  let mockPrisma: {
    crmLead: Record<string, jest.Mock>;
  };
  let mockTenantPrisma: TenantPrismaService;
  let mockTxService: TenantTransactionService;
  let mockSalesService: SalesService;

  beforeEach(() => {
    mockPrisma = {
      crmLead: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    mockTenantPrisma = {
      client: mockPrisma,
    } as unknown as TenantPrismaService;

    mockTxService = {
      run: jest.fn(async (cb) => cb()),
    } as unknown as TenantTransactionService;

    mockSalesService = {
      create: jest.fn(),
    } as unknown as SalesService;

    service = new CrmService(mockTenantPrisma, mockTxService, mockSalesService);
  });

  describe('create', () => {
    it('creates CRM opportunity with default NEW stage and probability', async () => {
      const mockCreated = {
        id: 'lead-1',
        title: 'تأمین میلگرد پروژه چیتگر',
        contactId: 'c-1',
        contactName: 'شرکت مهندسی عمران',
        contactPhone: '09121111111',
        stage: 'NEW',
        priority: 2,
        expectedRevenueToman: new Prisma.Decimal(120000000),
        expectedWeightKg: new Prisma.Decimal(4000),
        probability: 20,
        salespersonId: 'sp-1',
        salespersonName: 'کارشناس فروش',
        lostReasonId: null,
        lostNotes: null,
        saleOrderId: null,
        tags: '["پروژه ملی","فوری"]',
        notes: null,
        closeDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrisma.crmLead.create.mockResolvedValue(mockCreated);

      const result = await service.create(
        {
          title: 'تأمین میلگرد پروژه چیتگر',
          contactId: 'c-1',
          contactName: 'شرکت مهندسی عمران',
          contactPhone: '09121111111',
          priority: 2,
          expectedRevenueToman: 120000000,
          expectedWeightKg: 4000,
          tags: ['پروژه ملی', 'فوری'],
        },
        { id: 'sp-1', name: 'کارشناس فروش' },
      );

      expect(mockPrisma.crmLead.create).toHaveBeenCalled();
      expect(result.title).toBe('تأمین میلگرد پروژه چیتگر');
      expect(result.priority).toBe(2);
      expect(result.expectedRevenueToman).toBe(120000000);
      expect(result.tags).toEqual(['پروژه ملی', 'فوری']);
    });
  });

  describe('transitionStage', () => {
    it('transitions stage and sets probability to 100 on WON', async () => {
      mockPrisma.crmLead.findFirst.mockResolvedValue({
        id: 'lead-1',
        stage: 'NEGOTIATION',
        probability: 70,
        expectedRevenueToman: new Prisma.Decimal(100),
        expectedWeightKg: new Prisma.Decimal(10),
        tags: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.crmLead.update.mockResolvedValue({
        id: 'lead-1',
        stage: 'WON',
        probability: 100,
        expectedRevenueToman: new Prisma.Decimal(100),
        expectedWeightKg: new Prisma.Decimal(10),
        tags: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.transitionStage('lead-1', { stage: 'WON' });
      expect(res.stage).toBe('WON');
      expect(res.probability).toBe(100);
    });

    it('requires lost reason or lost notes when marking as LOST', async () => {
      mockPrisma.crmLead.findFirst.mockResolvedValue({
        id: 'lead-1',
        stage: 'NEGOTIATION',
      });

      await expect(service.transitionStage('lead-1', { stage: 'LOST' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('convertToQuotation', () => {
    it('creates quotation via SalesService and advances lead to QUOTED', async () => {
      mockPrisma.crmLead.findFirst.mockResolvedValue({
        id: 'lead-1',
        title: 'خرید تیرآهن ۱۸ اصفهان',
        contactId: 'c-1',
        contactName: 'فولاد غرب',
        expectedRevenueToman: new Prisma.Decimal(50000000),
        expectedWeightKg: new Prisma.Decimal(2000),
        probability: 20,
      });

      const mockQuotation = {
        id: 'ord-100',
        quotationNo: 'SQ-2026-00001',
        customerName: 'فولاد غرب',
        grandTotalToman: 55000000,
      };

      (mockSalesService.create as jest.Mock).mockResolvedValue(mockQuotation);

      mockPrisma.crmLead.update.mockResolvedValue({
        id: 'lead-1',
        title: 'خرید تیرآهن ۱۸ اصفهان',
        contactId: 'c-1',
        contactName: 'فولاد غرب',
        stage: 'QUOTED',
        probability: 60,
        saleOrderId: 'ord-100',
        expectedRevenueToman: new Prisma.Decimal(50000000),
        expectedWeightKg: new Prisma.Decimal(2000),
        tags: '[]',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.convertToQuotation('lead-1', {
        id: 'sp-1',
        name: 'کارشناس فروش',
      });

      expect(mockSalesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'c-1',
          customerName: 'فولاد غرب',
        }),
        { id: 'sp-1', name: 'کارشناس فروش' },
      );
      expect(result.lead.stage).toBe('QUOTED');
      expect(result.lead.saleOrderId).toBe('ord-100');
    });
  });

  describe('getPipelineMetrics', () => {
    it('calculates total pipeline revenue, weights and win rate percentage', async () => {
      mockPrisma.crmLead.findMany.mockResolvedValue([
        {
          stage: 'NEW',
          expectedRevenueToman: new Prisma.Decimal(10000000),
          expectedWeightKg: new Prisma.Decimal(1000),
        },
        {
          stage: 'WON',
          expectedRevenueToman: new Prisma.Decimal(30000000),
          expectedWeightKg: new Prisma.Decimal(3000),
        },
        {
          stage: 'LOST',
          expectedRevenueToman: new Prisma.Decimal(10000000),
          expectedWeightKg: new Prisma.Decimal(1000),
        },
      ]);

      const metrics = await service.getPipelineMetrics();
      expect(metrics.totalRevenueToman).toBe(50000000);
      expect(metrics.totalWeightKg).toBe(5000);
      expect(metrics.totalLeads).toBe(3);
      expect(metrics.winRatePercent).toBe(50); // 1 won out of 2 closed = 50%
    });
  });
});
