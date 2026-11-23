import { createZodDto } from 'nestjs-zod';
import { CreatePurchaseOrderInputSchema, PurchaseOrderListQuerySchema } from '@bodo/contracts';

export class CreatePurchaseOrderDto extends createZodDto(CreatePurchaseOrderInputSchema) {}
export class PurchaseOrderListQueryDto extends createZodDto(PurchaseOrderListQuerySchema) {}
