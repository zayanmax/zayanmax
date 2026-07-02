import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  DocumentLinkedEntityTypeDto,
  DocumentStatusDto,
  DocumentVisibilityDto,
  KnowledgeArticleStatusDto,
} from './documents-knowledge-base.enums';

export class CreateDocumentFolderDto {
  @IsOptional()
  @IsUUID()
  parentFolderId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DocumentVisibilityDto)
  visibility?: DocumentVisibilityDto;
}

export class UpdateDocumentFolderDto {
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DocumentVisibilityDto)
  visibility?: DocumentVisibilityDto;
}

export class DocumentFolderQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  parentFolderId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsEnum(DocumentVisibilityDto)
  visibility?: DocumentVisibilityDto;
}

export class CreateDocumentCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class DocumentCategoryQueryDto extends PaginationQueryDto {}

export class CreateDocumentTagDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class DocumentTagQueryDto extends PaginationQueryDto {}

export class CreateDocumentDto {
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DocumentVisibilityDto)
  visibility?: DocumentVisibilityDto;

  @IsOptional()
  @IsEnum(DocumentLinkedEntityTypeDto)
  linkedEntityType?: DocumentLinkedEntityTypeDto;

  @IsOptional()
  @IsUUID()
  linkedEntityId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsISO8601({ strict: true })
  expiresAt?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  reminderAt?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  storageKey?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number;

  @IsOptional()
  @IsString()
  checksum?: string;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DocumentVisibilityDto)
  visibility?: DocumentVisibilityDto;

  @IsOptional()
  @IsISO8601({ strict: true })
  expiresAt?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  reminderAt?: string;
}

export class DocumentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsEnum(DocumentVisibilityDto)
  visibility?: DocumentVisibilityDto;

  @IsOptional()
  @IsEnum(DocumentStatusDto)
  declare status?: DocumentStatusDto;

  @IsOptional()
  @IsEnum(DocumentLinkedEntityTypeDto)
  linkedEntityType?: DocumentLinkedEntityTypeDto;

  @IsOptional()
  @IsUUID()
  linkedEntityId?: string;
}

export class ChangeDocumentStatusDto {
  @IsEnum(DocumentStatusDto)
  status!: DocumentStatusDto;
}

export class CreateDocumentVersionDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  storageKey!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  size!: number;

  @IsOptional()
  @IsString()
  checksum?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateKnowledgeBaseCategoryDto {
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class KnowledgeBaseCategoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;
}

export class CreateKnowledgeBaseArticleDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  authorUserId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  tagIds?: string[];
}

export class UpdateKnowledgeBaseArticleDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

export class KnowledgeBaseArticleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(KnowledgeArticleStatusDto)
  declare status?: KnowledgeArticleStatusDto;
}

export class ChangeKnowledgeBaseArticleStatusDto {
  @IsEnum(KnowledgeArticleStatusDto)
  status!: KnowledgeArticleStatusDto;
}
