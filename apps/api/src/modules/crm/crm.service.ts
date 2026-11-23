import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, CrmLead } from '@prisma/client';
import { TenantPrismaService, TenantTransactionService } from '../../infra/tenancy';
import { SalesService } from '../sales/sales.service';
import {
  CreateCrmLeadInput,
  UpdateCrmLeadInput,
  TransitionCrmStageInput,
  CrmLeadListQuery,
} from '@bodo/contracts';

@Injectable()
export class CrmService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly txService: TenantTransactionService,
    private readonly salesService: SalesService,
  ) {}

  private get prisma() {
    return this.tenantPrisma.client;
  }

  async create(data: CreateCrmLeadInput, salesperson?: { id: string; name: string }) {
    return this.txService.run(async () => {
      const lead = await this.prisma.crmLead.create({
        data: {
          title: data.title,
          contactId: data.contactId ?? null,
          contactName: data.contactName,
          contactPhone: data.contactPhone ?? null,
          stage: data.stage ?? 'NEW',
          priority: data.priority ?? 1,
          expectedRevenueToman: new Prisma.Decimal(data.expectedRevenueToman ?? 0),
          expectedWeightKg: new Prisma.Decimal(data.expectedWeightKg ?? 0),
          probability: data.probability ?? 20,
          salespersonId: salesperson?.id ?? null,
          salespersonName: salesperson?.name ?? null,
          tags: data.tags ? JSON.stringify(data.tags) : '[]',
          notes: data.notes ?? null,
          closeDate: data.closeDate ? new Date(data.closeDate) : null,
        },
        include: {
          contact: true,
          saleOrder: true,
        },
      });

      return this.formatLead(lead);
    });
  }

  async findAll(query: CrmLeadListQuery) {
    const where: Prisma.CrmLeadWhereInput = {
      deletedAt: null,
    };

    if (query.stage) {
      where.stage = query.stage;
    }

    if (query.contactId) {
      where.contactId = query.contactId;
    }

    if (query.salespersonId) {
      where.salespersonId = query.salespersonId;
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { contactName: { contains: s, mode: 'insensitive' } },
        { contactPhone: { contains: s, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.crmLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 50,
      include: {
        contact: true,
        saleOrder: true,
      },
    });

    return items.map((item) => this.formatLead(item));
  }

  async findById(id: string) {
    const lead = await this.prisma.crmLead.findFirst({
      where: { id, deletedAt: null },
      include: {
        contact: true,
        saleOrder: {
          include: {
            lines: true,
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException('فرصت فروش مورد نظر یافت نشد');
    }

    return this.formatLead(lead);
  }

  async update(id: string, data: UpdateCrmLeadInput) {
    return this.txService.run(async () => {
      const existing = await this.prisma.crmLead.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundException('فرصت فروش مورد نظر یافت نشد');
      }

      const updated = await this.prisma.crmLead.update({
        where: { id },
        data: {
          title: data.title !== undefined ? data.title : undefined,
          contactId: data.contactId !== undefined ? data.contactId : undefined,
          contactName: data.contactName !== undefined ? data.contactName : undefined,
          contactPhone: data.contactPhone !== undefined ? data.contactPhone : undefined,
          priority: data.priority !== undefined ? data.priority : undefined,
          expectedRevenueToman:
            data.expectedRevenueToman !== undefined
              ? new Prisma.Decimal(data.expectedRevenueToman)
              : undefined,
          expectedWeightKg:
            data.expectedWeightKg !== undefined
              ? new Prisma.Decimal(data.expectedWeightKg)
              : undefined,
          probability: data.probability !== undefined ? data.probability : undefined,
          tags: data.tags !== undefined ? JSON.stringify(data.tags) : undefined,
          notes: data.notes !== undefined ? data.notes : undefined,
          closeDate:
            data.closeDate !== undefined
              ? data.closeDate
                ? new Date(data.closeDate)
                : null
              : undefined,
        },
        include: {
          contact: true,
          saleOrder: true,
        },
      });

      return this.formatLead(updated);
    });
  }

  async transitionStage(id: string, data: TransitionCrmStageInput) {
    const existing = await this.prisma.crmLead.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('فرصت فروش مورد نظر یافت نشد');
    }

    if (data.stage === 'LOST' && !data.lostReasonId && !data.lostNotes) {
      throw new BadRequestException('برای ثبت باخت فرصت، ثبت دلیل یا توضیحات باخت الزامی است');
    }

    const updated = await this.prisma.crmLead.update({
      where: { id },
      data: {
        stage: data.stage,
        lostReasonId: data.lostReasonId ?? existing.lostReasonId,
        lostNotes: data.lostNotes ?? existing.lostNotes,
        probability: data.stage === 'WON' ? 100 : data.stage === 'LOST' ? 0 : existing.probability,
      },
      include: {
        contact: true,
        saleOrder: true,
      },
    });

    return this.formatLead(updated);
  }

  async convertToQuotation(id: string, salesperson?: { id: string; name: string }) {
    return this.txService.run(async () => {
      const lead = await this.prisma.crmLead.findFirst({
        where: { id, deletedAt: null },
        include: { contact: true },
      });

      if (!lead) {
        throw new NotFoundException('فرصت فروش مورد نظر یافت نشد');
      }

      if (!lead.contactId) {
        throw new BadRequestException('برای صدور پیش‌فاکتور، اتصال فرصت به مشتری الزامی است');
      }

      // Create a quotation via SalesService public API
      const quotation = await this.salesService.create(
        {
          customerId: lead.contactId,
          customerName: lead.contactName,
          notes: `صادرشده از فرصت CRM: ${lead.title}`,
          lines: [
            {
              productName: lead.title,
              mill: '',
              unit: 'کیلوگرم',
              quantity: Number(lead.expectedWeightKg) > 0 ? Number(lead.expectedWeightKg) : 1000,
              unitPriceToman:
                Number(lead.expectedRevenueToman) > 0 && Number(lead.expectedWeightKg) > 0
                  ? Math.round(Number(lead.expectedRevenueToman) / Number(lead.expectedWeightKg))
                  : 0,
              taxPercent: 10,
            },
          ],
        },
        salesperson,
      );

      // Link quotation and advance stage to QUOTED
      const updatedLead = await this.prisma.crmLead.update({
        where: { id },
        data: {
          saleOrderId: quotation.id,
          stage: 'QUOTED',
          probability: Math.max(lead.probability, 60),
        },
        include: {
          contact: true,
          saleOrder: true,
        },
      });

      return {
        lead: this.formatLead(updatedLead),
        quotation,
      };
    });
  }

  async getPipelineMetrics() {
    const leads = await this.prisma.crmLead.findMany({
      where: { deletedAt: null },
    });

    const totalRevenue = leads.reduce((sum, l) => sum + Number(l.expectedRevenueToman), 0);
    const totalWeightKg = leads.reduce((sum, l) => sum + Number(l.expectedWeightKg), 0);

    const countsByStage: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      NEEDS_ANALYSIS: 0,
      QUOTED: 0,
      NEGOTIATION: 0,
      WON: 0,
      LOST: 0,
    };

    leads.forEach((l) => {
      const current = countsByStage[l.stage];
      if (current !== undefined) {
        countsByStage[l.stage] = current + 1;
      }
    });

    const totalClosed = (countsByStage['WON'] ?? 0) + (countsByStage['LOST'] ?? 0);
    const winRatePercent =
      totalClosed > 0 ? Math.round(((countsByStage['WON'] ?? 0) / totalClosed) * 100) : 0;

    return {
      totalRevenueToman: totalRevenue,
      totalWeightKg,
      totalLeads: leads.length,
      countsByStage,
      winRatePercent,
    };
  }

  private formatLead(
    lead: CrmLead & {
      contact?: { id: string; name: string } | null;
      saleOrder?: { id: string; quotationNo: string; orderNo: string | null; stage: string } | null;
    },
  ) {
    let tagsArray: string[] = [];
    if (typeof lead.tags === 'string') {
      try {
        tagsArray = JSON.parse(lead.tags) as string[];
      } catch {
        tagsArray = [];
      }
    } else if (Array.isArray(lead.tags)) {
      tagsArray = lead.tags as string[];
    }

    return {
      id: lead.id,
      title: lead.title,
      contactId: lead.contactId,
      contactName: lead.contactName,
      contactPhone: lead.contactPhone,
      stage: lead.stage,
      priority: lead.priority,
      expectedRevenueToman: Number(lead.expectedRevenueToman),
      expectedWeightKg: Number(lead.expectedWeightKg),
      probability: lead.probability,
      salespersonId: lead.salespersonId,
      salespersonName: lead.salespersonName,
      lostReasonId: lead.lostReasonId,
      lostNotes: lead.lostNotes,
      saleOrderId: lead.saleOrderId,
      tags: tagsArray,
      notes: lead.notes,
      closeDate: lead.closeDate
        ? lead.closeDate instanceof Date
          ? lead.closeDate.toISOString()
          : lead.closeDate
        : null,
      contact: lead.contact,
      saleOrder: lead.saleOrder,
      createdAt: lead.createdAt instanceof Date ? lead.createdAt.toISOString() : lead.createdAt,
      updatedAt: lead.updatedAt instanceof Date ? lead.updatedAt.toISOString() : lead.updatedAt,
      deletedAt: lead.deletedAt
        ? lead.deletedAt instanceof Date
          ? lead.deletedAt.toISOString()
          : lead.deletedAt
        : null,
    };
  }
}
