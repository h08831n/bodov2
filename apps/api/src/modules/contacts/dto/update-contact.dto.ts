import { createZodDto } from 'nestjs-zod';
import { UpdateContactInputSchema } from '@bodo/contracts';

export class UpdateContactDto extends createZodDto(UpdateContactInputSchema) {}
