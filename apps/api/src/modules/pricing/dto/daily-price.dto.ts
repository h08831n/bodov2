import { createZodDto } from 'nestjs-zod';
import {
  BatchCreateDailyPriceInputSchema,
  CopyYesterdayPricesInputSchema,
  DailyPriceListQuerySchema,
} from '@bodo/contracts';

export class BatchCreateDailyPriceDto extends createZodDto(BatchCreateDailyPriceInputSchema) {}
export class CopyYesterdayPricesDto extends createZodDto(CopyYesterdayPricesInputSchema) {}
export class DailyPriceListQueryDto extends createZodDto(DailyPriceListQuerySchema) {}
