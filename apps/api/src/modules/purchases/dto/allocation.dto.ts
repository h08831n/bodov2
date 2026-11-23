import { createZodDto } from 'nestjs-zod';
import { CreateAllocationInputSchema, ReleaseAllocationInputSchema } from '@bodo/contracts';

export class CreateAllocationDto extends createZodDto(CreateAllocationInputSchema) {}
export class ReleaseAllocationDto extends createZodDto(ReleaseAllocationInputSchema) {}
