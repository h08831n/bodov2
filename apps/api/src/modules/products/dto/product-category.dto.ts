import { createZodDto } from 'nestjs-zod';
import { CreateProductCategoryInputSchema } from '@bodo/contracts';

export class CreateProductCategoryDto extends createZodDto(CreateProductCategoryInputSchema) {}
