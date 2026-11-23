import { createZodDto } from 'nestjs-zod';
import { TransitionPurchaseStageInputSchema } from '@bodo/contracts';

export class TransitionPurchaseStageDto extends createZodDto(TransitionPurchaseStageInputSchema) {}
