import { createZodDto } from 'nestjs-zod';
import { UpdateProductInputSchema } from '@bodo/contracts';

export class UpdateProductDto extends createZodDto(UpdateProductInputSchema) {}
