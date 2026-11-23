import { createZodDto } from 'nestjs-zod';
import { CreateSourcingInquiryInputSchema, SourcingInquiryListQuerySchema } from '@bodo/contracts';

export class CreateSourcingInquiryDto extends createZodDto(CreateSourcingInquiryInputSchema) {}
export class SourcingInquiryListQueryDto extends createZodDto(SourcingInquiryListQuerySchema) {}
