import { createZodDto } from 'nestjs-zod';
import { WeighbridgeListQuerySchema } from '@bodo/contracts';

export class WeighbridgeListQueryDto extends createZodDto(WeighbridgeListQuerySchema) {}
