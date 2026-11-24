import { createZodDto } from 'nestjs-zod';
import { UpdateWeighbridgeSlipInputSchema } from '@bodo/contracts';

export class UpdateWeighbridgeSlipDto extends createZodDto(UpdateWeighbridgeSlipInputSchema) {}
