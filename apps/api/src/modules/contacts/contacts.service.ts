import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ContactType } from '@prisma/client';
import { TenantPrismaService } from '../../infra/tenancy';
import { CreateContactInput, UpdateContactInput, ContactListQuery } from '@bodo/contracts';

@Injectable()
export class ContactsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  private get prisma() {
    return this.tenantPrisma.client;
  }

  async create(data: CreateContactInput) {
    const contact = await this.prisma.contact.create({
      data: {
        type: data.type ?? 'CUSTOMER',
        name: data.name,
        companyName: data.companyName ?? null,
        nationalId: data.nationalId ?? null,
        economicCode: data.economicCode ?? null,
        phone: data.phone ?? null,
        mobile: data.mobile ?? null,
        email: data.email ?? null,
        city: data.city ?? null,
        address: data.address ?? null,
        creditLimitToman: new Prisma.Decimal(data.creditLimitToman ?? 0),
        balanceToman: new Prisma.Decimal(0),
      },
    });

    return this.formatContact(contact);
  }

  async findAll(query: ContactListQuery) {
    const where: Prisma.ContactWhereInput = {
      deletedAt: null,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { companyName: { contains: s, mode: 'insensitive' } },
        { mobile: { contains: s } },
        { phone: { contains: s } },
      ];
    }

    const items = await this.prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 50,
    });

    return items.map((item) => this.formatContact(item));
  }

  async findById(id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, deletedAt: null },
    });

    if (!contact) {
      throw new NotFoundException('مخاطب مورد نظر یافت نشد');
    }

    return this.formatContact(contact);
  }

  async update(id: string, data: UpdateContactInput) {
    await this.findById(id);

    const updateData: Prisma.ContactUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.companyName !== undefined && { companyName: data.companyName }),
      ...(data.nationalId !== undefined && { nationalId: data.nationalId }),
      ...(data.economicCode !== undefined && { economicCode: data.economicCode }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.mobile !== undefined && { mobile: data.mobile }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.creditLimitToman !== undefined && {
        creditLimitToman: new Prisma.Decimal(data.creditLimitToman),
      }),
    };

    const updated = await this.prisma.contact.update({
      where: { id },
      data: updateData,
    });

    return this.formatContact(updated);
  }

  async delete(id: string) {
    await this.findById(id);

    await this.prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  private formatContact(c: {
    id: string;
    type: ContactType;
    name: string;
    companyName: string | null;
    nationalId: string | null;
    economicCode: string | null;
    phone: string | null;
    mobile: string | null;
    email: string | null;
    city: string | null;
    address: string | null;
    balanceToman: Prisma.Decimal;
    creditLimitToman: Prisma.Decimal;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    return {
      ...c,
      balanceToman: c.balanceToman.toNumber(),
      creditLimitToman: c.creditLimitToman.toNumber(),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      deletedAt: c.deletedAt ? c.deletedAt.toISOString() : null,
    };
  }
}
