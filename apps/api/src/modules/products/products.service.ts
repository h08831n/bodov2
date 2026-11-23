import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma, ProductCategoryType } from '@prisma/client';
import { TenantPrismaService } from '../../infra/tenancy';
import { CreateProductInput, UpdateProductInput, ProductListQuery } from '@bodo/contracts';

@Injectable()
export class ProductsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  private get prisma() {
    return this.tenantPrisma.client;
  }

  async create(data: CreateProductInput) {
    const existing = await this.prisma.product.findUnique({
      where: { code: data.code },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException(`کالایی با کد «${data.code}» قبلاً ثبت شده است`);
    }

    const product = await this.prisma.product.create({
      data: {
        code: data.code,
        name: data.name,
        category: data.category ?? 'REBAR',
        mill: data.mill,
        standard: data.standard ?? 'A3',
        size: data.size,
        defaultUnit: data.defaultUnit ?? 'کیلوگرم',
        allowedUnits: data.allowedUnits ?? ['کیلوگرم', 'شاخه', 'بندل'],
        pricePerKgToman: new Prisma.Decimal(data.pricePerKgToman ?? 0),
        stockKg: new Prisma.Decimal(data.stockKg ?? 0),
      },
    });

    return this.formatProduct(product);
  }

  async findAll(query: ProductListQuery) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

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
      ...(data.stockKg !== undefined && {
        stockKg: new Prisma.Decimal(data.stockKg),
      }),
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

  private formatProduct(p: {
    id: string;
    code: string;
    name: string;
    category: ProductCategoryType;
    mill: string;
    standard: string;
    size: string;
    defaultUnit: string;
    allowedUnits: unknown;
    pricePerKgToman: Prisma.Decimal;
    stockKg: Prisma.Decimal;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    return {
      ...p,
      allowedUnits: Array.isArray(p.allowedUnits)
        ? p.allowedUnits
        : JSON.parse((p.allowedUnits as string) || '[]'),
      pricePerKgToman: p.pricePerKgToman.toNumber(),
      stockKg: p.stockKg.toNumber(),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
    };
  }
}
