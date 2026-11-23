import { z } from 'zod';

export const CrmStageSchema = z.enum([
  'NEW',
  'CONTACTED',
  'NEEDS_ANALYSIS',
  'QUOTED',
  'NEGOTIATION',
  'WON',
  'LOST',
]);
export type CrmStage = z.infer<typeof CrmStageSchema>;

export const CrmLeadSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  contactId: z.string().uuid().nullable().optional(),
  contactName: z.string(),
  contactPhone: z.string().nullable().optional(),
  stage: CrmStageSchema,
  priority: z.number().int().min(1).max(3).default(1),
  expectedRevenueToman: z.string().or(z.number()),
  expectedWeightKg: z.string().or(z.number()),
  probability: z.number().int().min(0).max(100).default(20),
  salespersonId: z.string().uuid().nullable().optional(),
  salespersonName: z.string().nullable().optional(),
  lostReasonId: z.string().uuid().nullable().optional(),
  lostNotes: z.string().nullable().optional(),
  saleOrderId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
  closeDate: z.string().nullable().optional(),
  contact: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  saleOrder: z
    .object({
      id: z.string().uuid(),
      quotationNo: z.string(),
      orderNo: z.string().nullable().optional(),
      stage: z.string().optional(),
    })
    .nullable()
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});
export type CrmLead = z.infer<typeof CrmLeadSchema>;

export const CreateCrmLeadInputSchema = z.object({
  title: z.string().min(1, 'عنوان فرصت الزامی است'),
  contactId: z.string().uuid().optional(),
  contactName: z.string().min(1, 'نام مشتری الزامی است'),
  contactPhone: z.string().optional(),
  stage: CrmStageSchema.default('NEW'),
  priority: z.number().int().min(1).max(3).default(1),
  expectedRevenueToman: z.number().nonnegative().default(0),
  expectedWeightKg: z.number().nonnegative().default(0),
  probability: z.number().int().min(0).max(100).default(20),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  closeDate: z.string().datetime().optional(),
});
export type CreateCrmLeadInput = z.input<typeof CreateCrmLeadInputSchema>;

export const UpdateCrmLeadInputSchema = z.object({
  title: z.string().min(1).optional(),
  contactId: z.string().uuid().optional(),
  contactName: z.string().min(1).optional(),
  contactPhone: z.string().optional(),
  priority: z.number().int().min(1).max(3).optional(),
  expectedRevenueToman: z.number().nonnegative().optional(),
  expectedWeightKg: z.number().nonnegative().optional(),
  probability: z.number().int().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  closeDate: z.string().datetime().optional(),
});
export type UpdateCrmLeadInput = z.input<typeof UpdateCrmLeadInputSchema>;

export const TransitionCrmStageInputSchema = z.object({
  stage: CrmStageSchema,
  lostReasonId: z.string().uuid().optional(),
  lostNotes: z.string().optional(),
});
export type TransitionCrmStageInput = z.infer<typeof TransitionCrmStageInputSchema>;

export const CrmLeadListQuerySchema = z.object({
  stage: CrmStageSchema.optional(),
  salespersonId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
});
export type CrmLeadListQuery = z.infer<typeof CrmLeadListQuerySchema>;
