import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, SaleOrder, SaleOrderLine } from '@prisma/client';
import { randomUUID } from 'crypto';
import { TenantPrismaService, TenantTransactionService } from '../../infra/tenancy';
import {
  CreateSaleOrderInput,
  UpdateSaleOrderInput,
  TransitionStageInput,
  SaleOrderListQuery,
} from '@bodo/contracts';

@Injectable()
export class SalesService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly txService: TenantTransactionService,
  ) {}

  private get prisma() {
    return this.tenantPrisma.client;
  }

  async create(data: CreateSaleOrderInput, salesperson?: { id: string; name: string }) {
    return this.txService.run(async () => {
      // 1. Generate Quotation Number (SQ-YYYY-XXXXX)
      const quotationNo = await this.getNextSequenceNumber('SALE_QUOTATION', 'SQ');

      // 2. Calculate line totals and grand totals
      const { calculatedLines, subtotal, tax, grandTotal } = this.calculateTotals(data.lines);

      // 3. Create Sale Order with Lines
      const order = await this.prisma.saleOrder.create({
        data: {
          quotationNo,
          customerId: data.customerId,
          customerName: data.customerName,
          stage: 'DRAFT',
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          salespersonId: salesperson?.id ?? null,
          salespersonName: salesperson?.name ?? null,
          notes: data.notes ?? null,
          subtotalToman: new Prisma.Decimal(subtotal),
          taxToman: new Prisma.Decimal(tax),
          grandTotalToman: new Prisma.Decimal(grandTotal),
          lines: {
            create: calculatedLines.map((line) => ({
              productId: line.productId ?? null,
              productName: line.productName,
              mill: line.mill ?? '',
              unit: line.unit ?? 'کیلوگرم',
              quantity: new Prisma.Decimal(line.quantity),
              unitPriceToman: new Prisma.Decimal(line.unitPriceToman),
              taxPercent: new Prisma.Decimal(line.taxPercent),
              totalPriceToman: new Prisma.Decimal(line.totalPriceToman),
            })),
          },
        },
        include: {
          lines: true,
          customer: true,
        },
      });

      return this.formatSaleOrder(order);
    });
  }

  async findAll(query: SaleOrderListQuery) {
    const where: Prisma.SaleOrderWhereInput = {
      deletedAt: null,
    };

    if (query.stage) {
      where.stage = query.stage;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { quotationNo: { contains: s, mode: 'insensitive' } },
        { orderNo: { contains: s, mode: 'insensitive' } },
        { customerName: { contains: s, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.saleOrder.findMany({
      where,
      orderBy: { date: 'desc' },
      take: query.limit ?? 50,
      include: {
        lines: true,
      },
    });

    return items.map((item) => this.formatSaleOrder(item));
  }

  async findById(id: string) {
    const order = await this.prisma.saleOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        lines: {
          orderBy: { createdAt: 'asc' },
        },
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundException('پیش‌فاکتور / سفارش مورد نظر یافت نشد');
    }

    return this.formatSaleOrder(order);
  }

  async update(id: string, data: UpdateSaleOrderInput) {
    return this.txService.run(async () => {
      const existing = await this.findById(id);

      if (existing.stage === 'CONFIRMED' || existing.stage === 'CANCELLED') {
        throw new BadRequestException('سفارش‌های تایید شده یا لغو شده قابل ویرایش مستقیم نیستند');
      }

      let subtotal = existing.subtotalToman;
      let tax = existing.taxToman;
      let grandTotal = existing.grandTotalToman;

      if (data.lines && data.lines.length > 0) {
        const calculated = this.calculateTotals(data.lines);
        subtotal = calculated.subtotal;
        tax = calculated.tax;
        grandTotal = calculated.grandTotal;

        // Replace lines
        await this.prisma.saleOrderLine.deleteMany({
          where: { orderId: id },
        });

        await this.prisma.saleOrderLine.createMany({
          data: calculated.calculatedLines.map((line) => ({
            orderId: id,
            productId: line.productId ?? null,
            productName: line.productName,
            mill: line.mill ?? '',
            unit: line.unit ?? 'کیلوگرم',
            quantity: new Prisma.Decimal(line.quantity),
            unitPriceToman: new Prisma.Decimal(line.unitPriceToman),
            taxPercent: new Prisma.Decimal(line.taxPercent),
            totalPriceToman: new Prisma.Decimal(line.totalPriceToman),
          })),
        });
      }

      const updated = await this.prisma.saleOrder.update({
        where: { id },
        data: {
          ...(data.expiryDate !== undefined && {
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          }),
          ...(data.notes !== undefined && { notes: data.notes }),
          subtotalToman: new Prisma.Decimal(subtotal),
          taxToman: new Prisma.Decimal(tax),
          grandTotalToman: new Prisma.Decimal(grandTotal),
        },
        include: {
          lines: true,
          customer: true,
        },
      });

      return this.formatSaleOrder(updated);
    });
  }

  async transitionStage(id: string, data: TransitionStageInput) {
    return this.txService.run(async () => {
      const order = await this.findById(id);

      const updateData: Prisma.SaleOrderUpdateInput = {
        stage: data.stage,
      };

      // When transitioning to CONFIRMED, assign orderNo if not exists
      if (data.stage === 'CONFIRMED' && !order.orderNo) {
        const orderNo = await this.getNextSequenceNumber('SALE_ORDER', 'SO');
        updateData.orderNo = orderNo;
      }

      // When transitioning to LOST
      if (data.stage === 'LOST') {
        if (data.lostReasonId) {
          updateData.lostReasonId = data.lostReasonId;
        }
        if (data.lostNotes) {
          updateData.lostNotes = data.lostNotes;
        }
      }

      const updated = await this.prisma.saleOrder.update({
        where: { id },
        data: updateData,
        include: {
          lines: true,
          customer: true,
        },
      });

      return this.formatSaleOrder(updated);
    });
  }

  private calculateTotals(
    lines: Array<{
      productId?: string;
      productName: string;
      mill?: string;
      unit?: string;
      quantity: number;
      unitPriceToman: number;
      taxPercent?: number;
    }>,
  ) {
    let subtotal = 0;
    let tax = 0;

    const calculatedLines = lines.map((line) => {
      const lineSubtotal = line.quantity * line.unitPriceToman;
      const taxPercent = line.taxPercent ?? 10;
      const lineTax = Math.round(lineSubtotal * (taxPercent / 100));
      const totalPriceToman = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      tax += lineTax;

      return {
        ...line,
        taxPercent,
        totalPriceToman,
      };
    });

    const grandTotal = subtotal + tax;

    return {
      calculatedLines,
      subtotal,
      tax,
      grandTotal,
    };
  }

  private async getNextSequenceNumber(code: string, prefix: string): Promise<string> {
    const year = new Date().getFullYear();

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

    const seqStr = String(nextVal).padStart(5, '0');
    return `${prefix}-${year}-${seqStr}`;
  }

  private formatSaleOrder(order: SaleOrder & { lines?: SaleOrderLine[] }) {
    return {
      id: order.id,
      quotationNo: order.quotationNo,
      orderNo: order.orderNo,
      customerId: order.customerId,
      customerName: order.customerName,
      stage: order.stage,
      date: order.date instanceof Date ? order.date.toISOString() : order.date,
      expiryDate: order.expiryDate
        ? order.expiryDate instanceof Date
          ? order.expiryDate.toISOString()
          : order.expiryDate
        : null,
      salespersonId: order.salespersonId,
      salespersonName: order.salespersonName,
      subtotalToman: Number(order.subtotalToman),
      taxToman: Number(order.taxToman),
      grandTotalToman: Number(order.grandTotalToman),
      lostReasonId: order.lostReasonId,
      lostNotes: order.lostNotes,
      notes: order.notes,
      lines: order.lines?.map((line: SaleOrderLine) => ({
        id: line.id,
        orderId: line.orderId,
        productId: line.productId,
        productName: line.productName,
        mill: line.mill,
        unit: line.unit,
        quantity: Number(line.quantity),
        unitPriceToman: Number(line.unitPriceToman),
        taxPercent: Number(line.taxPercent),
        totalPriceToman: Number(line.totalPriceToman),
        allocatedQuantity: Number(line.allocatedQuantity),
        createdAt: line.createdAt instanceof Date ? line.createdAt.toISOString() : line.createdAt,
        updatedAt: line.updatedAt instanceof Date ? line.updatedAt.toISOString() : line.updatedAt,
      })),
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
      updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
      deletedAt: order.deletedAt
        ? order.deletedAt instanceof Date
          ? order.deletedAt.toISOString()
          : order.deletedAt
        : null,
    };
  }
}
