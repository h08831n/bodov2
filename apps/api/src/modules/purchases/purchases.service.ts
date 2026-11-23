import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  Prisma,
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseSaleAllocation,
  SourcingInquiry,
  SourcingInquiryLine,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { TenantPrismaService, TenantTransactionService } from '../../infra/tenancy';
import {
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  TransitionPurchaseStageInput,
  PurchaseOrderListQuery,
  CreateAllocationInput,
  CreateSourcingInquiryInput,
  SourcingInquiryListQuery,
} from '@bodo/contracts';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly txService: TenantTransactionService,
  ) {}

  private get prisma() {
    return this.tenantPrisma.client;
  }

  // ───────────── Purchase Orders & RFQ ─────────────

  async create(data: CreatePurchaseOrderInput, buyer?: { id: string; name: string }) {
    return this.txService.run(async () => {
      const orderNo = await this.getNextSequenceNumber('PURCHASE_ORDER', 'PO');
      const { calculatedLines, subtotal, tax, grandTotal } = this.calculateTotals(data.lines);

      const order = await this.prisma.purchaseOrder.create({
        data: {
          orderNo,
          vendorId: data.vendorId,
          vendorName: data.vendorName,
          stage: 'RFQ',
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
          buyerId: buyer?.id ?? null,
          buyerName: buyer?.name ?? null,
          inquiryId: data.inquiryId ?? null,
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
          vendor: true,
        },
      });

      return this.formatPurchaseOrder(order);
    });
  }

  async findAll(query: PurchaseOrderListQuery) {
    const where: Prisma.PurchaseOrderWhereInput = {
      deletedAt: null,
    };

    if (query.stage) {
      where.stage = query.stage;
    }

    if (query.vendorId) {
      where.vendorId = query.vendorId;
    }

    if (query.inquiryId) {
      where.inquiryId = query.inquiryId;
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { orderNo: { contains: s, mode: 'insensitive' } },
        { vendorName: { contains: s, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.purchaseOrder.findMany({
      where,
      orderBy: { date: 'desc' },
      take: query.limit ?? 50,
      include: {
        lines: true,
        vendor: true,
      },
    });

    return items.map((item) => this.formatPurchaseOrder(item));
  }

  async findById(id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        lines: {
          include: {
            allocations: {
              include: {
                saleOrderLine: {
                  include: {
                    order: true,
                  },
                },
              },
            },
          },
        },
        vendor: true,
        inquiry: true,
      },
    });

    if (!order) {
      throw new NotFoundException('سفارش خرید یا استعلام مورد نظر یافت نشد');
    }

    return this.formatPurchaseOrder(order);
  }

  async update(id: string, data: UpdatePurchaseOrderInput) {
    return this.txService.run(async () => {
      const existing = await this.prisma.purchaseOrder.findFirst({
        where: { id, deletedAt: null },
        include: { lines: true },
      });

      if (!existing) {
        throw new NotFoundException('سفارش خرید مورد نظر یافت نشد');
      }

      if (existing.stage === 'DONE' || existing.stage === 'CANCELLED') {
        throw new BadRequestException('سفارش خرید نهایی‌شده یا لغو‌شده قابل ویرایش نیست');
      }

      let subtotal = Number(existing.subtotalToman);
      let tax = Number(existing.taxToman);
      let grandTotal = Number(existing.grandTotalToman);

      if (data.lines && data.lines.length > 0) {
        const calculated = this.calculateTotals(data.lines);
        subtotal = calculated.subtotal;
        tax = calculated.tax;
        grandTotal = calculated.grandTotal;

        await this.prisma.purchaseOrderLine.deleteMany({
          where: { orderId: id },
        });

        await this.prisma.purchaseOrderLine.createMany({
          data: calculated.calculatedLines.map((line) => ({
            id: randomUUID(),
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

      const updated = await this.prisma.purchaseOrder.update({
        where: { id },
        data: {
          deliveryDate:
            data.deliveryDate !== undefined
              ? data.deliveryDate
                ? new Date(data.deliveryDate)
                : null
              : undefined,
          notes: data.notes !== undefined ? data.notes : undefined,
          subtotalToman: new Prisma.Decimal(subtotal),
          taxToman: new Prisma.Decimal(tax),
          grandTotalToman: new Prisma.Decimal(grandTotal),
          version: { increment: 1 },
        },
        include: {
          lines: true,
          vendor: true,
        },
      });

      return this.formatPurchaseOrder(updated);
    });
  }

  async transitionStage(id: string, data: TransitionPurchaseStageInput) {
    const existing = await this.prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('سفارش خرید مورد نظر یافت نشد');
    }

    const currentStage = existing.stage;
    const nextStage = data.stage;

    const allowedTransitions: Record<string, string[]> = {
      RFQ: ['RFQ_SENT', 'PURCHASE_ORDER', 'CANCELLED'],
      RFQ_SENT: ['PURCHASE_ORDER', 'CANCELLED'],
      PURCHASE_ORDER: ['DONE', 'CANCELLED'],
      DONE: [],
      CANCELLED: ['RFQ'],
    };

    if (!allowedTransitions[currentStage]?.includes(nextStage)) {
      throw new BadRequestException(`تغییر مرحله از ${currentStage} به ${nextStage} مجاز نیست`);
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        stage: nextStage,
        version: { increment: 1 },
      },
      include: {
        lines: true,
        vendor: true,
      },
    });

    return this.formatPurchaseOrder(updated);
  }

  // ───────────── Purchase-Sale Allocation ─────────────

  async allocate(data: CreateAllocationInput) {
    return this.txService.run(async () => {
      // 1. Fetch sale line
      const saleLine = await this.prisma.saleOrderLine.findUnique({
        where: { id: data.saleOrderLineId },
        include: { order: true },
      });
      if (!saleLine) {
        throw new NotFoundException('ردیف سفارش فروش یافت نشد');
      }

      // 2. Fetch purchase line
      const purchaseLine = await this.prisma.purchaseOrderLine.findUnique({
        where: { id: data.purchaseOrderLineId },
        include: { order: true },
      });
      if (!purchaseLine) {
        throw new NotFoundException('ردیف سفارش خرید یافت نشد');
      }

      // 3. Check capacity constraints
      const saleQty = Number(saleLine.quantity);
      const saleAllocated = Number(saleLine.allocatedQuantity);
      const saleRemaining = Math.max(0, saleQty - saleAllocated);

      const purchaseQty = Number(purchaseLine.quantity);
      const purchaseAllocated = Number(purchaseLine.allocatedQuantity);
      const purchaseRemaining = Math.max(0, purchaseQty - purchaseAllocated);

      const reqAllocQty = Number(data.allocatedQuantity);

      if (reqAllocQty <= 0) {
        throw new BadRequestException('مقدار تخصیص باید بزرگتر از صفر باشد');
      }

      if (reqAllocQty > saleRemaining) {
        throw new BadRequestException(
          `مقدار تخصیص درخواستی (${reqAllocQty}) بیشتر از مقدار باقی‌مانده سفارش فروش (${saleRemaining}) است`,
        );
      }

      if (reqAllocQty > purchaseRemaining) {
        throw new BadRequestException(
          `مقدار تخصیص درخواستی (${reqAllocQty}) بیشتر از موجودی تخصیص‌نیافته سفارش خرید (${purchaseRemaining}) است`,
        );
      }

      // 4. Create allocation record
      const allocation = await this.prisma.purchaseSaleAllocation.create({
        data: {
          saleOrderLineId: data.saleOrderLineId,
          purchaseOrderLineId: data.purchaseOrderLineId,
          allocatedQuantity: new Prisma.Decimal(reqAllocQty),
          status: 'COMMITTED',
          notes: data.notes ?? null,
        },
        include: {
          saleOrderLine: {
            include: { order: true },
          },
          purchaseOrderLine: {
            include: { order: true },
          },
        },
      });

      // 5. Update allocatedQuantity on both lines
      await this.prisma.saleOrderLine.update({
        where: { id: data.saleOrderLineId },
        data: {
          allocatedQuantity: { increment: new Prisma.Decimal(reqAllocQty) },
        },
      });

      await this.prisma.purchaseOrderLine.update({
        where: { id: data.purchaseOrderLineId },
        data: {
          allocatedQuantity: { increment: new Prisma.Decimal(reqAllocQty) },
        },
      });

      return this.formatAllocation(allocation);
    });
  }

  async releaseAllocation(id: string, notes?: string) {
    return this.txService.run(async () => {
      const allocation = await this.prisma.purchaseSaleAllocation.findUnique({
        where: { id },
      });

      if (!allocation) {
        throw new NotFoundException('تخصیص مورد نظر یافت نشد');
      }

      if (allocation.status === 'RELEASED') {
        throw new BadRequestException('این تخصیص قبلاً آزاد شده است');
      }

      const allocatedQty = Number(allocation.allocatedQuantity);

      // 1. Mark allocation as RELEASED
      const updated = await this.prisma.purchaseSaleAllocation.update({
        where: { id },
        data: {
          status: 'RELEASED',
          notes: notes ? `${allocation.notes ?? ''} [لغو: ${notes}]` : allocation.notes,
        },
        include: {
          saleOrderLine: { include: { order: true } },
          purchaseOrderLine: { include: { order: true } },
        },
      });

      // 2. Decrement allocatedQuantity on sale line and purchase line
      await this.prisma.saleOrderLine.update({
        where: { id: allocation.saleOrderLineId },
        data: {
          allocatedQuantity: { decrement: new Prisma.Decimal(allocatedQty) },
        },
      });

      await this.prisma.purchaseOrderLine.update({
        where: { id: allocation.purchaseOrderLineId },
        data: {
          allocatedQuantity: { decrement: new Prisma.Decimal(allocatedQty) },
        },
      });

      return this.formatAllocation(updated);
    });
  }

  async findAllAllocations(saleOrderLineId?: string, purchaseOrderLineId?: string) {
    const where: Prisma.PurchaseSaleAllocationWhereInput = {};
    if (saleOrderLineId) {
      where.saleOrderLineId = saleOrderLineId;
    }
    if (purchaseOrderLineId) {
      where.purchaseOrderLineId = purchaseOrderLineId;
    }

    const items = await this.prisma.purchaseSaleAllocation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        saleOrderLine: { include: { order: true } },
        purchaseOrderLine: { include: { order: true } },
      },
    });

    return items.map((item) => this.formatAllocation(item));
  }

  // ───────────── Sourcing Inquiries ─────────────

  async createInquiry(data: CreateSourcingInquiryInput) {
    return this.txService.run(async () => {
      const inquiryNo = await this.getNextSequenceNumber('SOURCING_INQUIRY', 'INQ');

      const inquiry = await this.prisma.sourcingInquiry.create({
        data: {
          inquiryNo,
          title: data.title,
          saleOrderId: data.saleOrderId ?? null,
          notes: data.notes ?? null,
          stage: 'OPEN',
          lines: {
            create: data.lines.map((l) => ({
              productId: l.productId ?? null,
              productName: l.productName,
              mill: l.mill ?? '',
              quantity: new Prisma.Decimal(l.quantity),
              unit: l.unit ?? 'کیلوگرم',
              targetPriceToman:
                l.targetPriceToman !== undefined ? new Prisma.Decimal(l.targetPriceToman) : null,
            })),
          },
        },
        include: {
          lines: true,
          orders: true,
        },
      });

      return this.formatInquiry(inquiry);
    });
  }

  async findAllInquiries(query: SourcingInquiryListQuery) {
    const where: Prisma.SourcingInquiryWhereInput = {
      deletedAt: null,
    };

    if (query.stage) {
      where.stage = query.stage;
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { inquiryNo: { contains: s, mode: 'insensitive' } },
        { title: { contains: s, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.sourcingInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 50,
      include: {
        lines: true,
        orders: true,
      },
    });

    return items.map((i) => this.formatInquiry(i));
  }

  async findInquiryById(id: string) {
    const item = await this.prisma.sourcingInquiry.findFirst({
      where: { id, deletedAt: null },
      include: {
        lines: true,
        orders: {
          include: {
            lines: true,
            vendor: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('استعلام خرید مورد نظر یافت نشد');
    }

    return this.formatInquiry(item);
  }

  // ───────────── Helpers ─────────────

  private calculateTotals(
    lines: Array<{
      quantity: number;
      unitPriceToman: number;
      taxPercent?: number;
      productName: string;
      productId?: string;
      mill?: string;
      unit?: string;
    }>,
  ) {
    let subtotal = 0;
    let tax = 0;

    const calculatedLines = lines.map((line) => {
      const lineSubtotal = Math.round(Number(line.quantity) * Number(line.unitPriceToman));
      const lineTaxPercent = line.taxPercent !== undefined ? Number(line.taxPercent) : 10;
      const lineTax = Math.round(lineSubtotal * (lineTaxPercent / 100));
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      tax += lineTax;

      return {
        ...line,
        taxPercent: lineTaxPercent,
        totalPriceToman: lineTotal,
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

  private formatPurchaseOrder(
    order: PurchaseOrder & {
      lines?: (PurchaseOrderLine & {
        allocations?: (PurchaseSaleAllocation & {
          saleOrderLine?: {
            order?: {
              id: string;
              quotationNo: string;
              orderNo: string | null;
              customerName: string;
            };
          };
        })[];
      })[];
      vendor?: { id: string; name: string };
      inquiry?: SourcingInquiry | null;
    },
  ) {
    return {
      id: order.id,
      orderNo: order.orderNo,
      vendorId: order.vendorId,
      vendorName: order.vendorName,
      stage: order.stage,
      date: order.date instanceof Date ? order.date.toISOString() : order.date,
      deliveryDate: order.deliveryDate
        ? order.deliveryDate instanceof Date
          ? order.deliveryDate.toISOString()
          : order.deliveryDate
        : null,
      buyerId: order.buyerId,
      buyerName: order.buyerName,
      subtotalToman: Number(order.subtotalToman),
      taxToman: Number(order.taxToman),
      grandTotalToman: Number(order.grandTotalToman),
      inquiryId: order.inquiryId,
      notes: order.notes,
      version: order.version,
      lines: order.lines?.map((line) => ({
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
        receivedQuantity: Number(line.receivedQuantity),
        createdAt: line.createdAt instanceof Date ? line.createdAt.toISOString() : line.createdAt,
        updatedAt: line.updatedAt instanceof Date ? line.updatedAt.toISOString() : line.updatedAt,
        allocations: line.allocations?.map((a) => this.formatAllocation(a)),
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

  private formatAllocation(
    alloc: PurchaseSaleAllocation & {
      saleOrderLine?: {
        id?: string;
        productName?: string;
        quantity?: Prisma.Decimal | number;
        allocatedQuantity?: Prisma.Decimal | number;
        order?: { id: string; quotationNo: string; orderNo: string | null; customerName: string };
      };
      purchaseOrderLine?: {
        id?: string;
        productName?: string;
        quantity?: Prisma.Decimal | number;
        allocatedQuantity?: Prisma.Decimal | number;
        order?: { id: string; orderNo: string; vendorName: string };
      };
    },
  ) {
    return {
      id: alloc.id,
      saleOrderLineId: alloc.saleOrderLineId,
      purchaseOrderLineId: alloc.purchaseOrderLineId,
      allocatedQuantity: Number(alloc.allocatedQuantity),
      status: alloc.status,
      notes: alloc.notes,
      version: alloc.version,
      createdAt: alloc.createdAt instanceof Date ? alloc.createdAt.toISOString() : alloc.createdAt,
      updatedAt: alloc.updatedAt instanceof Date ? alloc.updatedAt.toISOString() : alloc.updatedAt,
      saleOrderLine: alloc.saleOrderLine
        ? {
            id: alloc.saleOrderLine.id ?? '',
            productName: alloc.saleOrderLine.productName ?? '',
            quantity: Number(alloc.saleOrderLine.quantity ?? 0),
            allocatedQuantity: Number(alloc.saleOrderLine.allocatedQuantity ?? 0),
            order: alloc.saleOrderLine.order,
          }
        : undefined,
      purchaseOrderLine: alloc.purchaseOrderLine
        ? {
            id: alloc.purchaseOrderLine.id ?? '',
            productName: alloc.purchaseOrderLine.productName ?? '',
            quantity: Number(alloc.purchaseOrderLine.quantity ?? 0),
            allocatedQuantity: Number(alloc.purchaseOrderLine.allocatedQuantity ?? 0),
            order: alloc.purchaseOrderLine.order,
          }
        : undefined,
    };
  }

  private formatInquiry(
    inq: SourcingInquiry & {
      lines?: SourcingInquiryLine[];
      orders?: PurchaseOrder[];
    },
  ) {
    return {
      id: inq.id,
      inquiryNo: inq.inquiryNo,
      title: inq.title,
      stage: inq.stage,
      saleOrderId: inq.saleOrderId,
      notes: inq.notes,
      lines: inq.lines?.map((l) => ({
        id: l.id,
        inquiryId: l.inquiryId,
        productId: l.productId,
        productName: l.productName,
        mill: l.mill,
        quantity: Number(l.quantity),
        unit: l.unit,
        targetPriceToman: l.targetPriceToman ? Number(l.targetPriceToman) : null,
        createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
        updatedAt: l.updatedAt instanceof Date ? l.updatedAt.toISOString() : l.updatedAt,
      })),
      orders: inq.orders?.map((o) => this.formatPurchaseOrder(o)),
      createdAt: inq.createdAt instanceof Date ? inq.createdAt.toISOString() : inq.createdAt,
      updatedAt: inq.updatedAt instanceof Date ? inq.updatedAt.toISOString() : inq.updatedAt,
      deletedAt: inq.deletedAt
        ? inq.deletedAt instanceof Date
          ? inq.deletedAt.toISOString()
          : inq.deletedAt
        : null,
    };
  }
}
