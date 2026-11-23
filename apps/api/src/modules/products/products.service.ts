import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import {
  Prisma,
  ProductCategoryType,
  ProductType,
  InvoicingPolicy,
  ProductTemplate,
  ProductCategory,
  Uom,
  Product,
  SupplierInfo,
} from '@prisma/client';
import { TenantPrismaService } from '../../infra/tenancy';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductListQuery,
  CreateProductTemplateInput,
  UpdateProductTemplateInput,
  CreateProductCategoryInput,
  CreateProductAttributeInput,
  CreateSupplierInfoInput,
} from '@bodo/contracts';

@Injectable()
export class ProductsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  private get prisma() {
    return this.tenantPrisma.client;
  }

  // ───────────── Odoo 17 Product Templates ─────────────

  async createTemplate(data: CreateProductTemplateInput) {
    const template = await this.prisma.productTemplate.create({
      data: {
        name: data.name,
        type: (data.type as ProductType) ?? ProductType.STORABLE,
        invoicingPolicy: (data.invoicingPolicy as InvoicingPolicy) ?? InvoicingPolicy.ORDERED,
        categoryId: data.categoryId ?? null,
        defaultCode: data.defaultCode ?? null,
        barcode: data.barcode ?? null,
        salesPriceToman: new Prisma.Decimal(data.salesPriceToman ?? 0),
        costPriceToman: new Prisma.Decimal(data.costPriceToman ?? 0),
        uomId: data.uomId ?? null,
        purchaseUomId: data.purchaseUomId ?? null,
        canBeSold: data.canBeSold ?? true,
        canBePurchased: data.canBePurchased ?? true,
        descriptionSale: data.descriptionSale ?? null,
        descriptionPurchase: data.descriptionPurchase ?? null,
        internalNotes: data.internalNotes ?? null,
        weightKg: data.weightKg ? new Prisma.Decimal(data.weightKg) : null,
      },
      include: {
        category: true,
        uom: true,
        purchaseUom: true,
        variants: true,
      },
    });

    return this.formatTemplate(template);
  }

  async findAllTemplates(query?: { search?: string; categoryId?: string }) {
    const where: Prisma.ProductTemplateWhereInput = {
      deletedAt: null,
    };

    if (query?.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query?.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { defaultCode: { contains: s, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.productTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        uom: true,
        purchaseUom: true,
        variants: true,
      },
    });

    return items.map((t) => this.formatTemplate(t));
  }

  async findTemplateById(id: string) {
    const template = await this.prisma.productTemplate.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        uom: true,
        purchaseUom: true,
        variants: {
          where: { deletedAt: null },
          include: {
            attributeValues: {
              include: {
                attributeValue: {
                  include: {
                    attribute: true,
                  },
                },
              },
            },
          },
        },
        supplierInfos: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('الگوی کالای مورد نظر یافت نشد');
    }

    return this.formatTemplate(template);
  }

  async updateTemplate(id: string, data: UpdateProductTemplateInput) {
    await this.findTemplateById(id);

    const updated = await this.prisma.productTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type as ProductType }),
        ...(data.invoicingPolicy !== undefined && {
          invoicingPolicy: data.invoicingPolicy as InvoicingPolicy,
        }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.defaultCode !== undefined && { defaultCode: data.defaultCode }),
        ...(data.barcode !== undefined && { barcode: data.barcode }),
        ...(data.salesPriceToman !== undefined && {
          salesPriceToman: new Prisma.Decimal(data.salesPriceToman),
        }),
        ...(data.costPriceToman !== undefined && {
          costPriceToman: new Prisma.Decimal(data.costPriceToman),
        }),
        ...(data.uomId !== undefined && { uomId: data.uomId }),
        ...(data.purchaseUomId !== undefined && {
          purchaseUomId: data.purchaseUomId,
        }),
        ...(data.canBeSold !== undefined && { canBeSold: data.canBeSold }),
        ...(data.canBePurchased !== undefined && {
          canBePurchased: data.canBePurchased,
        }),
        ...(data.descriptionSale !== undefined && {
          descriptionSale: data.descriptionSale,
        }),
        ...(data.descriptionPurchase !== undefined && {
          descriptionPurchase: data.descriptionPurchase,
        }),
        ...(data.internalNotes !== undefined && {
          internalNotes: data.internalNotes,
        }),
        ...(data.weightKg !== undefined && {
          weightKg: data.weightKg ? new Prisma.Decimal(data.weightKg) : null,
        }),
      },
      include: {
        category: true,
        uom: true,
        purchaseUom: true,
        variants: true,
      },
    });

    return this.formatTemplate(updated);
  }

  async deleteTemplate(id: string) {
    await this.findTemplateById(id);

    await this.prisma.productTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  // ───────────── Categories (Tree Hierarchy) ─────────────

  async findAllCategories() {
    return this.prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async createCategory(data: CreateProductCategoryInput) {
    let fullPath = data.name;
    if (data.parentId) {
      const parent = await this.prisma.productCategory.findUnique({
        where: { id: data.parentId },
      });
      if (parent) {
        fullPath = `${parent.fullPath || parent.name} / ${data.name}`;
      }
    }

    return this.prisma.productCategory.create({
      data: {
        name: data.name,
        parentId: data.parentId ?? null,
        fullPath,
      },
    });
  }

  // ───────────── Attributes & Values ─────────────

  async findAllAttributes() {
    return this.prisma.productAttribute.findMany({
      orderBy: { sequence: 'asc' },
      include: {
        values: {
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  async createAttribute(data: CreateProductAttributeInput) {
    const attribute = await this.prisma.productAttribute.create({
      data: {
        name: data.name,
        displayType: data.displayType ?? 'radio',
        sequence: data.sequence ?? 0,
        ...(data.values && {
          values: {
            create: data.values.map((val, idx) => ({
              name: val,
              sequence: idx,
            })),
          },
        }),
      },
      include: {
        values: true,
      },
    });

    return attribute;
  }

  // ───────────── Units of Measure (UoM) ─────────────

  async findAllUoms() {
    return this.prisma.uom.findMany({
      where: { isActive: true },
      include: {
        category: true,
      },
    });
  }

  // ───────────── Supplier Info (Vendor Pricelists) ─────────────

  async addSupplierInfo(data: CreateSupplierInfoInput) {
    const supplierInfo = await this.prisma.supplierInfo.create({
      data: {
        templateId: data.templateId ?? null,
        variantId: data.variantId ?? null,
        vendorId: data.vendorId,
        vendorName: data.vendorName,
        vendorProductCode: data.vendorProductCode ?? null,
        vendorProductName: data.vendorProductName ?? null,
        minQuantity: new Prisma.Decimal(data.minQuantity ?? 1),
        priceToman: new Prisma.Decimal(data.priceToman ?? 0),
        currency: data.currency ?? 'TOMAN',
        leadTimeDays: data.leadTimeDays ?? 1,
      },
    });

    return supplierInfo;
  }

  async removeSupplierInfo(id: string) {
    await this.prisma.supplierInfo.delete({
      where: { id },
    });
    return { success: true };
  }

  // ───────────── Product Variants (product.product) ─────────────

  async create(data: CreateProductInput) {
    const existing = await this.prisma.product.findUnique({
      where: { code: data.code },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException(`کالایی با کد «${data.code}» قبلاً ثبت شده است`);
    }

    const product = await this.prisma.product.create({
      data: {
        templateId: data.templateId ?? null,
        code: data.code,
        name: data.name,
        category: data.category ?? ProductCategoryType.REBAR,
        mill: data.mill ?? '',
        standard: data.standard ?? 'A3',
        size: data.size ?? '',
        defaultUnit: data.defaultUnit ?? 'کیلوگرم',
        allowedUnits: data.allowedUnits ?? ['کیلوگرم', 'شاخه', 'بندل'],
        pricePerKgToman: new Prisma.Decimal(data.pricePerKgToman ?? 0),
        priceExtraToman: new Prisma.Decimal(data.priceExtraToman ?? 0),
        stockKg: new Prisma.Decimal(data.stockKg ?? 0),
        barcode: data.barcode ?? null,
      },
    });

    return this.formatProduct(product);
  }

  async findAll(query: ProductListQuery) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

    if (query.templateId) {
      where.templateId = query.templateId;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.mill?.trim()) {
      where.mill = { contains: query.mill.trim(), mode: 'insensitive' };
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { code: { contains: s, mode: 'insensitive' } },
        { mill: { contains: s, mode: 'insensitive' } },
        { standard: { contains: s, mode: 'insensitive' } },
        { size: { contains: s } },
      ];
    }

    const items = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 50,
    });

    return items.map((item) => this.formatProduct(item));
  }

  async findById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        template: true,
        supplierInfos: true,
      },
    });

    if (!product) {
      throw new NotFoundException('کالای مورد نظر یافت نشد');
    }

    return this.formatProduct(product);
  }

  async update(id: string, data: UpdateProductInput) {
    await this.findById(id);

    if (data.code) {
      const existing = await this.prisma.product.findUnique({
        where: { code: data.code },
      });
      if (existing && existing.id !== id && !existing.deletedAt) {
        throw new ConflictException(`کالایی با کد «${data.code}» قبلاً ثبت شده است`);
      }
    }

    const updateData: Prisma.ProductUpdateInput = {
      ...(data.code !== undefined && { code: data.code }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.mill !== undefined && { mill: data.mill }),
      ...(data.standard !== undefined && { standard: data.standard }),
      ...(data.size !== undefined && { size: data.size }),
      ...(data.defaultUnit !== undefined && { defaultUnit: data.defaultUnit }),
      ...(data.allowedUnits !== undefined && { allowedUnits: data.allowedUnits }),
      ...(data.pricePerKgToman !== undefined && {
        pricePerKgToman: new Prisma.Decimal(data.pricePerKgToman),
      }),
      ...(data.priceExtraToman !== undefined && {
        priceExtraToman: new Prisma.Decimal(data.priceExtraToman),
      }),
      ...(data.stockKg !== undefined && {
        stockKg: new Prisma.Decimal(data.stockKg),
      }),
      ...(data.barcode !== undefined && { barcode: data.barcode }),
    };

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });

    return this.formatProduct(updated);
  }

  async delete(id: string) {
    await this.findById(id);

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  // ───────────── Odoo 17 Smart Buttons Metrics ─────────────

  async getMetrics(id: string) {
    const product = await this.findById(id);

    return {
      onHandKg: Number(product.stockKg),
      forecastedKg: Number(product.forecastedKg || product.stockKg),
      soldQtyKg: Number(product.soldQtyKg || 0),
      purchasedQtyKg: Number(product.purchasedQtyKg || 0),
    };
  }

  private formatTemplate(
    t: ProductTemplate & {
      category?: ProductCategory | null;
      uom?: Uom | null;
      purchaseUom?: Uom | null;
      variants?: Product[];
      supplierInfos?: SupplierInfo[];
    },
  ) {
    return {
      id: t.id,
      name: t.name,
      type: t.type,
      invoicingPolicy: t.invoicingPolicy,
      categoryId: t.categoryId,
      categoryName: t.category?.name,
      defaultCode: t.defaultCode,
      barcode: t.barcode,
      salesPriceToman: Number(t.salesPriceToman),
      costPriceToman: Number(t.costPriceToman),
      uomId: t.uomId,
      uomName: t.uom?.name,
      purchaseUomId: t.purchaseUomId,
      purchaseUomName: t.purchaseUom?.name,
      canBeSold: t.canBeSold,
      canBePurchased: t.canBePurchased,
      descriptionSale: t.descriptionSale,
      descriptionPurchase: t.descriptionPurchase,
      internalNotes: t.internalNotes,
      weightKg: t.weightKg ? Number(t.weightKg) : null,
      isActive: t.isActive,
      variantsCount: t.variants?.length ?? 0,
      variants: t.variants?.map((v: Product) => this.formatProduct(v)),
      supplierInfos: t.supplierInfos?.map((s: SupplierInfo) => ({
        id: s.id,
        vendorId: s.vendorId,
        vendorName: s.vendorName,
        priceToman: Number(s.priceToman),
        currency: s.currency,
        minQuantity: Number(s.minQuantity),
        leadTimeDays: s.leadTimeDays,
      })),
      createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
      updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
      deletedAt: t.deletedAt
        ? t.deletedAt instanceof Date
          ? t.deletedAt.toISOString()
          : t.deletedAt
        : null,
    };
  }

  private formatProduct(p: {
    id: string;
    templateId?: string | null;
    code: string;
    name: string;
    category: ProductCategoryType;
    mill: string;
    standard: string;
    size: string;
    defaultUnit: string;
    allowedUnits: unknown;
    pricePerKgToman: Prisma.Decimal;
    priceExtraToman?: Prisma.Decimal;
    stockKg: Prisma.Decimal;
    forecastedKg?: Prisma.Decimal;
    soldQtyKg?: Prisma.Decimal;
    purchasedQtyKg?: Prisma.Decimal;
    barcode?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    return {
      id: p.id,
      templateId: p.templateId ?? null,
      code: p.code,
      name: p.name,
      category: p.category,
      mill: p.mill,
      standard: p.standard,
      size: p.size,
      defaultUnit: p.defaultUnit,
      allowedUnits: Array.isArray(p.allowedUnits)
        ? p.allowedUnits
        : JSON.parse((p.allowedUnits as string) || '[]'),
      pricePerKgToman: p.pricePerKgToman.toNumber(),
      priceExtraToman: p.priceExtraToman ? p.priceExtraToman.toNumber() : 0,
      stockKg: p.stockKg.toNumber(),
      forecastedKg: p.forecastedKg ? p.forecastedKg.toNumber() : p.stockKg.toNumber(),
      soldQtyKg: p.soldQtyKg ? p.soldQtyKg.toNumber() : 0,
      purchasedQtyKg: p.purchasedQtyKg ? p.purchasedQtyKg.toNumber() : 0,
      barcode: p.barcode ?? null,
      isActive: p.isActive,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
    };
  }
}
