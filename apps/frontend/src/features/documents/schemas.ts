import { z } from "zod";
import {
  type DocumentLinkedEntityType,
  type DocumentVisibility,
} from "@/features/documents/types";
import { NONE } from "@/features/documents/utils";

export const documentVisibilityOptions: DocumentVisibility[] = [
  "COMPANY",
  "DEPARTMENT",
  "PRIVATE",
];

export const documentStatusOptions = ["ACTIVE", "ARCHIVED"] as const;

export const linkedEntityTypeOptions: Array<DocumentLinkedEntityType | typeof NONE> = [
  NONE,
  "EMPLOYEE",
  "CLIENT",
  "PROJECT",
  "TASK",
  "VENDOR",
  "ASSET",
];

export const documentFolderSchema = z.object({
  parentFolderId: z.string(),
  name: z.string().min(1, "Folder name is required"),
  description: z.string().optional(),
  visibility: z.enum(["COMPANY", "DEPARTMENT", "PRIVATE"]),
});

export type DocumentFolderFormValues = z.infer<typeof documentFolderSchema>;

export const documentCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export type DocumentCategoryFormValues = z.infer<typeof documentCategorySchema>;

export const documentTagSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type DocumentTagFormValues = z.infer<typeof documentTagSchema>;

export const documentRecordSchema = z.object({
  folderId: z.string(),
  categoryId: z.string(),
  ownerUserId: z.string(),
  title: z.string().min(1, "Document title is required"),
  description: z.string().optional(),
  visibility: z.enum(["COMPANY", "DEPARTMENT", "PRIVATE"]),
  linkedEntityType: z.enum([
    NONE,
    "EMPLOYEE",
    "CLIENT",
    "PROJECT",
    "TASK",
    "VENDOR",
    "ASSET",
  ]),
  linkedEntityId: z.string(),
  tagIds: z.array(z.string()),
  expiresAt: z.string(),
  reminderAt: z.string(),
  fileName: z.string(),
  storageKey: z.string(),
  mimeType: z.string(),
  size: z.number(),
  checksum: z.string(),
});

export type DocumentRecordFormValues = z.infer<typeof documentRecordSchema>;

export const documentVersionSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  storageKey: z.string().min(1, "Storage key is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.number().min(1, "Size is required"),
  checksum: z.string(),
  notes: z.string(),
});

export type DocumentVersionFormValues = z.infer<typeof documentVersionSchema>;
