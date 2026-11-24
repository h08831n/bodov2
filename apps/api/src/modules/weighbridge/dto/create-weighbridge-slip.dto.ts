import { createZodDto } from 'nestjs-zod';
import { CreateWeighbridgeSlipInputSchema } from '@bodo/contracts';

export class CreateWeighbridgeSlipDto extends createZodDto(CreateWeighbridgeSlipInputSchema) {}
