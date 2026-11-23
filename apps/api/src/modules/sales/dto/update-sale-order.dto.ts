import { createZodDto } from 'nestjs-zod';
import { UpdateSaleOrderInputSchema } from '@bodo/contracts';

export class UpdateSaleOrderDto extends createZodDto(UpdateSaleOrderInputSchema) {}
