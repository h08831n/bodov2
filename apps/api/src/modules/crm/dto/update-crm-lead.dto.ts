import { createZodDto } from 'nestjs-zod';
import { UpdateCrmLeadInputSchema } from '@bodo/contracts';

export class UpdateCrmLeadDto extends createZodDto(UpdateCrmLeadInputSchema) {}
