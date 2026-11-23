import { createZodDto } from 'nestjs-zod';
import { CreateCrmLeadInputSchema, CrmLeadListQuerySchema } from '@bodo/contracts';

export class CreateCrmLeadDto extends createZodDto(CreateCrmLeadInputSchema) {}
export class CrmLeadListQueryDto extends createZodDto(CrmLeadListQuerySchema) {}
