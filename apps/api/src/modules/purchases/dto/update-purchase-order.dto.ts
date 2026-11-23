import { createZodDto } from 'nestjs-zod';
import { UpdatePurchaseOrderInputSchema } from '@bodo/contracts';

export class UpdatePurchaseOrderDto extends createZodDto(UpdatePurchaseOrderInputSchema) {}
