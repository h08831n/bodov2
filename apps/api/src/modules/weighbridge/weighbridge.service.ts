import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WeighbridgeSlip } from '@prisma/client';
import { randomUUID } from 'crypto';
import { TenantPrismaService, TenantTransactionService } from '../../infra/tenancy';
import {
  CreateWeighbridgeSlipInput,
  UpdateWeighbridgeSlipInput,
  WeighbridgeListQuery,
} from '@bodo/contracts';

@Injectable()
export class WeighbridgeService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly txService: TenantTransactionService,
  ) {}

  private get prisma() {
    return this.tenantPrisma.client;
  }

  async create(data: CreateWeighbridgeSlipInput) {
    return this.txService.run(async () => {
      const slipNo = await this.getNextSequenceNumber('WEIGHBRIDGE_SLIP', 'WB');

      let customerName = data.customerName;
      if (data.customerId && !customerName) {
        const contact = await this.prisma.contact.findUnique({
          where: { id: data.customerId },
        });
        if (contact) {
          customerName = contact.name;
        }
      }

      if (data.saleOrderId && !customerName) {
        const order = await this.prisma.saleOrder.findUnique({
          where: { id: data.saleOrderId },
        });
        if (order) {
          customerName = order.customerName;
        }
      }

      const slip = await this.prisma.weighbridgeSlip.create({
        data: {
          slipNo,
          saleOrderId: data.saleOrderId ?? null,
          customerId: data.customerId ?? null,
          customerName,
          netWeightKg: new Prisma.Decimal(data.netWeightKg),
          vehiclePlate: data.vehiclePlate,
          waybillNo: data.waybillNo ?? null,
          driverName: data.driverName ?? null,
          driverMobile: data.driverMobile ?? null,
          scaleName: data.scaleName ?? null,
          operatorName: data.operatorName ?? null,
          weighedAt: data.weighedAt ? new Date(data.weighedAt) : new Date(),
          notes: data.notes ?? null,
        },
        include: {
          saleOrder: {
            select: {
              id: true,
              orderNo: true,
              quotationNo: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              companyName: true,
            },
          },
        },
      });

      return this.formatSlip(slip);
    });
  }

  async list(query: WeighbridgeListQuery) {
    const limit = query.limit ?? 50;
    const where: Prisma.WeighbridgeSlipWhereInput = {
      deletedAt: null,
    };

    if (query.saleOrderId) {
      where.saleOrderId = query.saleOrderId;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.search) {
      where.OR = [
        { slipNo: { contains: query.search, mode: 'insensitive' } },
        { vehiclePlate: { contains: query.search, mode: 'insensitive' } },
        { waybillNo: { contains: query.search, mode: 'insensitive' } },
        { driverName: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { scaleName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const slips = await this.prisma.weighbridgeSlip.findMany({
      where,
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy: { weighedAt: 'desc' },
      include: {
        saleOrder: {
          select: {
            id: true,
            orderNo: true,
            quotationNo: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (slips.length > limit) {
      const nextItem = slips.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return {
      items: slips.map((s) => this.formatSlip(s)),
      nextCursor,
    };
  }

  async getById(id: string) {
    const slip = await this.prisma.weighbridgeSlip.findFirst({
      where: { id, deletedAt: null },
      include: {
        saleOrder: {
          select: {
            id: true,
            orderNo: true,
            quotationNo: true,
          },
        },
        customer: true,
      },
    });

    if (!slip) {
      throw new NotFoundException(`قبض باسکول با شناسه ${id} یافت نشد.`);
    }

    return this.formatSlip(slip);
  }

  async getBySaleOrderId(saleOrderId: string) {
    const slips = await this.prisma.weighbridgeSlip.findMany({
      where: { saleOrderId, deletedAt: null },
      orderBy: { weighedAt: 'desc' },
      include: {
        saleOrder: {
          select: {
            id: true,
            orderNo: true,
            quotationNo: true,
          },
        },
      },
    });

    return slips.map((s) => this.formatSlip(s));
  }

  async update(id: string, data: UpdateWeighbridgeSlipInput) {
    return this.txService.run(async () => {
      const existing = await this.prisma.weighbridgeSlip.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundException(`قبض باسکول با شناسه ${id} یافت نشد.`);
      }

      const updateData: Prisma.WeighbridgeSlipUpdateInput = {};

      if (data.saleOrderId !== undefined) {
        updateData.saleOrder = data.saleOrderId
          ? { connect: { id: data.saleOrderId } }
          : { disconnect: true };
      }
      if (data.customerId !== undefined) {
        updateData.customer = data.customerId
          ? { connect: { id: data.customerId } }
          : { disconnect: true };
      }
      if (data.customerName !== undefined) updateData.customerName = data.customerName;
      if (data.netWeightKg !== undefined)
        updateData.netWeightKg = new Prisma.Decimal(data.netWeightKg);
      if (data.vehiclePlate !== undefined) updateData.vehiclePlate = data.vehiclePlate;
      if (data.waybillNo !== undefined) updateData.waybillNo = data.waybillNo;
      if (data.driverName !== undefined) updateData.driverName = data.driverName;
      if (data.driverMobile !== undefined) updateData.driverMobile = data.driverMobile;
      if (data.scaleName !== undefined) updateData.scaleName = data.scaleName;
      if (data.operatorName !== undefined) updateData.operatorName = data.operatorName;
      if (data.weighedAt !== undefined) updateData.weighedAt = new Date(data.weighedAt);
      if (data.notes !== undefined) updateData.notes = data.notes;

      const updated = await this.prisma.weighbridgeSlip.update({
        where: { id },
        data: updateData,
        include: {
          saleOrder: {
            select: {
              id: true,
              orderNo: true,
              quotationNo: true,
            },
          },
        },
      });

      return this.formatSlip(updated);
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.weighbridgeSlip.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`قبض باسکول با شناسه ${id} یافت نشد.`);
    }

    await this.prisma.weighbridgeSlip.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true, message: 'قبض باسکول با موفقیت حذف شد.' };
  }

  private async getNextSequenceNumber(code: string, prefix: string): Promise<string> {
    const now = new Date();
    const year = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric' })
      .format(now)
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());

    const sequence = await this.prisma.sequence.findUnique({
      where: { code },
    });

    let nextVal = 1n;
    if (sequence) {
      nextVal = sequence.nextValue + 1n;
      await this.prisma.sequence.update({
        where: { code },
        data: { nextValue: nextVal },
      });
    } else {
      await this.prisma.sequence.create({
        data: {
          id: randomUUID(),
          code,
          prefix,
          nextValue: 2n,
        },
      });
    }

    const seqStr = String(nextVal).padStart(4, '0');
    return `${prefix}-${year}-${seqStr}`;
  }

  private formatSlip(
    slip: WeighbridgeSlip & {
      saleOrder?: { id: string; orderNo: string | null; quotationNo: string } | null;
      customer?: { id: string; name: string } | null;
    },
  ) {
    return {
      id: slip.id,
      slipNo: slip.slipNo,
      saleOrderId: slip.saleOrderId,
      saleOrderNo: slip.saleOrder?.orderNo || slip.saleOrder?.quotationNo || null,
      customerId: slip.customerId,
      customerName: slip.customerName,
      netWeightKg: Number(slip.netWeightKg),
      vehiclePlate: slip.vehiclePlate,
      waybillNo: slip.waybillNo,
      driverName: slip.driverName,
      driverMobile: slip.driverMobile,
      scaleName: slip.scaleName,
      operatorName: slip.operatorName,
      weighedAt: slip.weighedAt instanceof Date ? slip.weighedAt.toISOString() : slip.weighedAt,
      notes: slip.notes,
      createdAt: slip.createdAt instanceof Date ? slip.createdAt.toISOString() : slip.createdAt,
      updatedAt: slip.updatedAt instanceof Date ? slip.updatedAt.toISOString() : slip.updatedAt,
      deletedAt: slip.deletedAt instanceof Date ? slip.deletedAt.toISOString() : slip.deletedAt,
    };
  }
}
