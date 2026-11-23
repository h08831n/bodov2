import { createZodDto } from 'nestjs-zod';
import { CreateSupplierInfoInputSchema } from '@bodo/contracts';

export class CreateSupplierInfoDto extends createZodDto(CreateSupplierInfoInputSchema) {}
