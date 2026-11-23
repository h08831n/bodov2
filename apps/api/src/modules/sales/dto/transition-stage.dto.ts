import { createZodDto } from 'nestjs-zod';
import { TransitionStageInputSchema } from '@bodo/contracts';

export class TransitionStageDto extends createZodDto(TransitionStageInputSchema) {}
