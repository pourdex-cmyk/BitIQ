import { z } from "zod";

export const projectSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  propertyType: z.string().min(1, "Property type is required"),
  squareFootage: z.number().positive().optional(),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear()).optional(),
  purchasePrice: z.number().positive().optional(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  budgetTarget: z.number().positive().optional(),
  bidDeadline: z.string().optional(),
});

export const bidLineItemSchema = z.object({
  sowLineItemId: z.string().optional(),
  sortOrder: z.number().int().min(0),
  category: z.string().min(1),
  description: z.string().min(1),
  unit: z.string().optional(),
  quantity: z.number().positive().optional(),
  laborCost: z.number().min(0).optional(),
  materialCost: z.number().min(0).optional(),
  totalCost: z.number().min(0).optional(),
  estimatedDays: z.number().int().positive().optional(),
  subcontracted: z.boolean().default(false),
  subcontractorName: z.string().optional(),
  notes: z.string().optional(),
});

export const bidFormSchema = z.object({
  contractorCompany: z.string().min(1, "Company name is required"),
  contractorName: z.string().min(1, "Contact name is required"),
  contractorEmail: z.string().email("Valid email required"),
  contractorPhone: z.string().optional(),
  licenseNumber: z.string().optional(),
  yearsExperience: z.number().int().min(0).max(99).optional(),
  primaryTrade: z.string().optional(),
  insuranceOnFile: z.boolean().default(false),
  lineItems: z.array(bidLineItemSchema).min(1, "At least one line item required"),
  proposedStartDate: z.string().optional(),
  estimatedDays: z.number().int().positive().optional(),
  paymentTerms: z.string().optional(),
  bidValidUntil: z.string().optional(),
  exclusions: z.string().optional(),
  allowances: z.string().optional(),
  assumptions: z.string().optional(),
  notes: z.string().optional(),
});

export const inviteContractorSchema = z.object({
  projectId: z.string().cuid(),
  contractors: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
      })
    )
    .min(1, "At least one contractor required"),
});

export const analyzePhotosSchema = z.object({
  projectId: z.string().cuid(),
  photoUrls: z.array(z.string().url()).min(1),
});

export const generateSowSchema = z.object({
  projectId: z.string().cuid(),
});

export const scoreBidsSchema = z.object({
  projectId: z.string().cuid(),
});

export const draftContractSchema = z.object({
  projectId: z.string().cuid(),
  bidId: z.string().cuid(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
export type BidFormData = z.infer<typeof bidFormSchema>;
export type BidLineItemFormData = z.infer<typeof bidLineItemSchema>;
export type InviteContractorData = z.infer<typeof inviteContractorSchema>;
