import { createZodDto } from 'nestjs-zod';
import { CreateSaleOrderInputSchema, SaleOrderListQuerySchema } from '@bodo/contracts';

export class CreateSaleOrderDto extends createZodDto(CreateSaleOrderInputSchema) {}
export class SaleOrderListQueryDto extends createZodDto(SaleOrderListQuerySchema) {}
