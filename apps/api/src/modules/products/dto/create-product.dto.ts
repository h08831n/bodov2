import { createZodDto } from 'nestjs-zod';
import { CreateProductInputSchema, ProductListQuerySchema } from '@bodo/contracts';

export class CreateProductDto extends createZodDto(CreateProductInputSchema) {}
export class ProductListQueryDto extends createZodDto(ProductListQuerySchema) {}
