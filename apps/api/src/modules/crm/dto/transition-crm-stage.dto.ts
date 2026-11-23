import { createZodDto } from 'nestjs-zod';
import { TransitionCrmStageInputSchema } from '@bodo/contracts';

export class TransitionCrmStageDto extends createZodDto(TransitionCrmStageInputSchema) {}
