import { createZodDto } from 'nestjs-zod';
import {
  CreateProductTemplateInputSchema,
  UpdateProductTemplateInputSchema,
} from '@bodo/contracts';

export class CreateProductTemplateDto extends createZodDto(CreateProductTemplateInputSchema) {}
export class UpdateProductTemplateDto extends createZodDto(UpdateProductTemplateInputSchema) {}
