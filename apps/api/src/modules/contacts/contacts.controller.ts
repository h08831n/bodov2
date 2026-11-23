import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto, ContactListQueryDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiTags('Contacts')
@ApiBearerAuth()
@Controller('v1/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ایجاد مخاطب جدید (مشتری، تامین‌کننده، باربری)' })
  @ApiResponse({ status: 201, description: 'مخاطب با موفقیت ایجاد شد' })
  async create(@Body() body: CreateContactDto) {
    return this.contactsService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'لیست مخاطبان با فیلتر و جستجو' })
  async findAll(@Query() query: ContactListQueryDto) {
    return this.contactsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت مشخصات یک مخاطب' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش مشخصات مخاطب' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateContactDto) {
    return this.contactsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف نرم مخاطب' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactsService.delete(id);
  }
}
