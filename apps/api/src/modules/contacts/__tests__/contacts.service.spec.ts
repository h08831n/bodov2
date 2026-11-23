import { ContactsService } from '../contacts.service';
import { TenantPrismaService } from '../../../infra/tenancy';
import { Prisma } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('ContactsService', () => {
  let service: ContactsService;
  let mockPrisma: { contact: Record<string, jest.Mock> };
  let mockTenantPrisma: TenantPrismaService;

  beforeEach(() => {
    mockPrisma = {
      contact: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    mockTenantPrisma = {
      client: mockPrisma,
    } as unknown as TenantPrismaService;

    service = new ContactsService(mockTenantPrisma);
  });

  describe('create', () => {
    it('creates a new contact with decimal fields and returns formatted contact', async () => {
      const now = new Date();
      const mockCreated = {
        id: 'c1111111-1111-1111-1111-111111111111',
        type: 'CUSTOMER',
        name: 'شرکت فولاد مهر',
        companyName: 'فولاد مهر تبریز',
        nationalId: '10101010101',
        economicCode: '411111111111',
        phone: '04133333333',
        mobile: '09121111111',
        email: 'info@fooladmehr.ir',
        city: 'تبریز',
        address: 'شهرک صنعتی رجایی',
        balanceToman: new Prisma.Decimal(0),
        creditLimitToman: new Prisma.Decimal(500000000),
        isActive: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      mockPrisma.contact.create.mockResolvedValue(mockCreated);

      const result = await service.create({
        type: 'CUSTOMER',
        name: 'شرکت فولاد مهر',
        companyName: 'فولاد مهر تبریز',
        creditLimitToman: 500000000,
      });

      expect(mockPrisma.contact.create).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(mockCreated.id);
      expect(result.creditLimitToman).toBe(500000000);
      expect(result.balanceToman).toBe(0);
      expect(typeof result.createdAt).toBe('string');
    });
  });

  describe('findAll', () => {
    it('returns filtered contacts without deleted ones', async () => {
      const now = new Date();
      mockPrisma.contact.findMany.mockResolvedValue([
        {
          id: 'c1111111-1111-1111-1111-111111111111',
          type: 'CUSTOMER',
          name: 'شرکت فولاد مهر',
          companyName: null,
          nationalId: null,
          economicCode: null,
          phone: null,
          mobile: '09121111111',
          email: null,
          city: null,
          address: null,
          balanceToman: new Prisma.Decimal(0),
          creditLimitToman: new Prisma.Decimal(0),
          isActive: true,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ]);

      const result = await service.findAll({
        type: 'CUSTOMER',
        search: 'فولاد',
        limit: 20,
      });

      expect(mockPrisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            type: 'CUSTOMER',
          }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('شرکت فولاد مهر');
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when contact is not found', async () => {
      mockPrisma.contact.findFirst.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
