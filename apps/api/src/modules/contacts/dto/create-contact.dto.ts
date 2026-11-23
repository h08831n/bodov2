import { createZodDto } from 'nestjs-zod';
import { CreateContactInputSchema, ContactListQuerySchema } from '@bodo/contracts';

export class CreateContactDto extends createZodDto(CreateContactInputSchema) {}
export class ContactListQueryDto extends createZodDto(ContactListQuerySchema) {}
