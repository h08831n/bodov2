import { createZodDto } from 'nestjs-zod';
import { UpdateCompanySettingsInputSchema } from '@bodo/contracts';

export class UpdateCompanySettingsDto extends createZodDto(UpdateCompanySettingsInputSchema) {}
