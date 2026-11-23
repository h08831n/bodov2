import { createZodDto } from 'nestjs-zod';
import { CreateProductAttributeInputSchema } from '@bodo/contracts';

export class CreateProductAttributeDto extends createZodDto(CreateProductAttributeInputSchema) {}
