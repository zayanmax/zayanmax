import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ChangeDocumentStatusDto,
  ChangeKnowledgeBaseArticleStatusDto,
  CreateDocumentCategoryDto,
  CreateDocumentDto,
  CreateDocumentFolderDto,
  CreateDocumentTagDto,
  CreateDocumentVersionDto,
  CreateKnowledgeBaseArticleDto,
  CreateKnowledgeBaseCategoryDto,
  DocumentCategoryQueryDto,
  DocumentFolderQueryDto,
  DocumentQueryDto,
  DocumentTagQueryDto,
  KnowledgeBaseArticleQueryDto,
  KnowledgeBaseCategoryQueryDto,
  UpdateDocumentDto,
  UpdateDocumentFolderDto,
  UpdateKnowledgeBaseArticleDto,
} from './dto/documents-knowledge-base.dto';
import {
  DocumentLinkedEntityTypeDto,
  DocumentStatusDto,
  DocumentVisibilityDto,
  KnowledgeArticleStatusDto,
} from './dto/documents-knowledge-base.enums';

@Injectable()
export class DocumentsKnowledgeBaseService {
  constructor(private readonly prisma: PrismaService) {}

  async createFolder(
    companyId: string,
    actorId: string,
    dto: CreateDocumentFolderDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const parent = dto.parentFolderId
      ? await this.prisma.documentFolder.findFirst({
          where: { id: dto.parentFolderId, companyId, deletedAt: null },
        })
      : undefined;
    if (dto.parentFolderId && !parent) {
      throw new NotFoundException('Parent folder not found');
    }

    const path = this.childPath(parent?.path, dto.name);
    const existing = await this.prisma.documentFolder.findFirst({
      where: { companyId, path, deletedAt: null },
    });
    if (existing) throw new ConflictException('Document folder already exists');

    const folder = await this.prisma.documentFolder.create({
      data: {
        companyId,
        parentFolderId: dto.parentFolderId,
        departmentId: dto.departmentId,
        ownerUserId: dto.ownerUserId,
        name: dto.name,
        path,
        description: dto.description,
        visibility: dto.visibility ?? DocumentVisibilityDto.COMPANY,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'documents.folders.create',
      'DocumentFolder',
      folder.id,
      undefined,
      folder,
      ipAddress,
      userAgent,
    );
    return folder;
  }

  async findFolders(companyId: string, query: DocumentFolderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.DocumentFolderWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.parentFolderId ? { parentFolderId: query.parentFolderId } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.visibility ? { visibility: query.visibility } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { path: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.documentFolder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.documentFolder.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async updateFolder(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateDocumentFolderDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.documentFolder.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Document folder not found');

    const nextPath = dto.name
      ? this.childPath(this.parentPath(current.path), dto.name)
      : current.path;
    if (nextPath !== current.path) {
      const existing = await this.prisma.documentFolder.findFirst({
        where: { companyId, path: nextPath, deletedAt: null },
      });
      if (existing) {
        throw new ConflictException('Document folder already exists');
      }
    }

    const folder = await this.prisma.documentFolder.update({
      where: { id },
      data: {
        departmentId: dto.departmentId,
        ownerUserId: dto.ownerUserId,
        name: dto.name,
        path: nextPath,
        description: dto.description,
        visibility: dto.visibility,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'documents.folders.update',
      'DocumentFolder',
      folder.id,
      current,
      folder,
      ipAddress,
      userAgent,
    );
    return folder;
  }

  async removeFolder(
    companyId: string,
    id: string,
    actorId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.documentFolder.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Document folder not found');

    const folder = await this.prisma.documentFolder.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'documents.folders.delete',
      'DocumentFolder',
      id,
      current,
      { deleted: true },
      ipAddress,
      userAgent,
    );
    return folder;
  }

  async createDocumentCategory(
    companyId: string,
    actorId: string,
    dto: CreateDocumentCategoryDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.documentCategory.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Document category exists');

    const category = await this.prisma.documentCategory.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'documents.categories.create',
      'DocumentCategory',
      category.id,
      undefined,
      category,
      ipAddress,
      userAgent,
    );
    return category;
  }

  async findDocumentCategories(
    companyId: string,
    query: DocumentCategoryQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.DocumentCategoryWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.documentCategory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.documentCategory.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createDocumentTag(
    companyId: string,
    actorId: string,
    dto: CreateDocumentTagDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.documentTag.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Document tag exists');

    const tag = await this.prisma.documentTag.create({
      data: { companyId, name: dto.name, createdById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'documents.tags.create',
      'DocumentTag',
      tag.id,
      undefined,
      tag,
      ipAddress,
      userAgent,
    );
    return tag;
  }

  async findDocumentTags(companyId: string, query: DocumentTagQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.DocumentTagWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.documentTag.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.documentTag.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createDocument(
    companyId: string,
    actorId: string,
    dto: CreateDocumentDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.ensureNoDuplicateDocumentTitle(
      companyId,
      dto.folderId,
      dto.title,
    );
    const document = await this.prisma.documentRecord.create({
      data: {
        companyId,
        folderId: dto.folderId,
        categoryId: dto.categoryId,
        departmentId: dto.departmentId,
        ownerUserId: dto.ownerUserId ?? actorId,
        title: dto.title,
        description: dto.description,
        visibility: dto.visibility ?? DocumentVisibilityDto.COMPANY,
        expiresAt: this.toDateOnly(dto.expiresAt),
        reminderAt: this.toDateOnly(dto.reminderAt),
        createdById: actorId,
        tags: this.tagCreateData(companyId, dto.tagIds),
        links: this.documentLinkCreateData(
          companyId,
          dto.linkedEntityType,
          dto.linkedEntityId,
        ),
        versions: this.initialVersionCreateData(companyId, actorId, dto),
      },
      include: { tags: true, links: true, versions: true },
    });
    await this.audit(
      companyId,
      actorId,
      'documents.records.create',
      'DocumentRecord',
      document.id,
      undefined,
      document,
      ipAddress,
      userAgent,
    );
    return document;
  }

  async findDocuments(companyId: string, query: DocumentQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.DocumentRecordWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.folderId ? { folderId: query.folderId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.ownerUserId ? { ownerUserId: query.ownerUserId } : {}),
      ...(query.visibility ? { visibility: query.visibility } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.linkedEntityType && query.linkedEntityId
        ? {
            links: {
              some: {
                entityType: query.linkedEntityType,
                entityId: query.linkedEntityId,
              },
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.documentRecord.findMany({
        where,
        include: { tags: true, links: true, versions: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.documentRecord.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async updateDocument(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateDocumentDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.documentRecord.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Document not found');
    if (dto.title && dto.title !== current.title) {
      await this.ensureNoDuplicateDocumentTitle(
        companyId,
        current.folderId ?? undefined,
        dto.title,
      );
    }

    const document = await this.prisma.documentRecord.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        departmentId: dto.departmentId,
        ownerUserId: dto.ownerUserId,
        title: dto.title,
        description: dto.description,
        visibility: dto.visibility,
        expiresAt: this.toDateOnly(dto.expiresAt),
        reminderAt: this.toDateOnly(dto.reminderAt),
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'documents.records.update',
      'DocumentRecord',
      document.id,
      current,
      document,
      ipAddress,
      userAgent,
    );
    return document;
  }

  async changeDocumentStatus(
    companyId: string,
    id: string,
    actorId: string,
    dto: ChangeDocumentStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.documentRecord.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Document not found');

    const document = await this.prisma.documentRecord.update({
      where: { id },
      data: { status: dto.status, updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      this.documentStatusAuditAction(dto.status),
      'DocumentRecord',
      document.id,
      current,
      document,
      ipAddress,
      userAgent,
    );
    return document;
  }

  async removeDocument(
    companyId: string,
    id: string,
    actorId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.documentRecord.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Document not found');

    const document = await this.prisma.documentRecord.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'documents.records.delete',
      'DocumentRecord',
      id,
      current,
      { deleted: true },
      ipAddress,
      userAgent,
    );
    return document;
  }

  async createDocumentVersion(
    companyId: string,
    documentId: string,
    actorId: string,
    dto: CreateDocumentVersionDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const document = await this.prisma.documentRecord.findFirst({
      where: { id: documentId, companyId, deletedAt: null },
    });
    if (!document) throw new NotFoundException('Document not found');

    const versionAggregate = await this.prisma.documentVersion.aggregate({
      where: { companyId, documentId, deletedAt: null },
      _max: { versionNumber: true },
    });
    const versionNumber = (versionAggregate._max.versionNumber ?? 0) + 1;
    const version = await this.prisma.documentVersion.create({
      data: {
        companyId,
        documentId,
        versionNumber,
        fileName: dto.fileName,
        storageKey: dto.storageKey,
        mimeType: dto.mimeType,
        size: dto.size,
        checksum: dto.checksum,
        notes: dto.notes,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'documents.versions.create',
      'DocumentVersion',
      version.id,
      undefined,
      version,
      ipAddress,
      userAgent,
    );
    return version;
  }

  async createKnowledgeBaseCategory(
    companyId: string,
    actorId: string,
    dto: CreateKnowledgeBaseCategoryDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const parent = dto.parentCategoryId
      ? await this.prisma.knowledgeBaseCategory.findFirst({
          where: { id: dto.parentCategoryId, companyId, deletedAt: null },
        })
      : undefined;
    if (dto.parentCategoryId && !parent) {
      throw new NotFoundException('Knowledge base parent category not found');
    }

    const path = this.childPath(parent?.path, dto.name);
    const existing = await this.prisma.knowledgeBaseCategory.findFirst({
      where: { companyId, path, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Knowledge base category exists');
    }

    const category = await this.prisma.knowledgeBaseCategory.create({
      data: {
        companyId,
        parentCategoryId: dto.parentCategoryId,
        name: dto.name,
        path,
        description: dto.description,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'knowledge_base.categories.create',
      'KnowledgeBaseCategory',
      category.id,
      undefined,
      category,
      ipAddress,
      userAgent,
    );
    return category;
  }

  async findKnowledgeBaseCategories(
    companyId: string,
    query: KnowledgeBaseCategoryQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.KnowledgeBaseCategoryWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.parentCategoryId
        ? { parentCategoryId: query.parentCategoryId }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { path: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.knowledgeBaseCategory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.knowledgeBaseCategory.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createKnowledgeBaseArticle(
    companyId: string,
    actorId: string,
    dto: CreateKnowledgeBaseArticleDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const article = await this.prisma.knowledgeBaseArticle.create({
      data: {
        companyId,
        categoryId: dto.categoryId,
        authorUserId: dto.authorUserId ?? actorId,
        title: dto.title,
        slug: this.slug(dto.title),
        summary: dto.summary,
        content: dto.content,
        createdById: actorId,
        tags: this.articleTagCreateData(companyId, dto.tagIds),
      },
      include: { tags: true },
    });
    await this.audit(
      companyId,
      actorId,
      'knowledge_base.articles.create',
      'KnowledgeBaseArticle',
      article.id,
      undefined,
      article,
      ipAddress,
      userAgent,
    );
    return article;
  }

  async findKnowledgeBaseArticles(
    companyId: string,
    query: KnowledgeBaseArticleQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.KnowledgeBaseArticleWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { summary: { contains: query.search, mode: 'insensitive' } },
              { content: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.knowledgeBaseArticle.findMany({
        where,
        include: { tags: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.knowledgeBaseArticle.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async updateKnowledgeBaseArticle(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateKnowledgeBaseArticleDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.knowledgeBaseArticle.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current)
      throw new NotFoundException('Knowledge base article not found');

    const article = await this.prisma.knowledgeBaseArticle.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        title: dto.title,
        slug: dto.title ? this.slug(dto.title) : undefined,
        summary: dto.summary,
        content: dto.content,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'knowledge_base.articles.update',
      'KnowledgeBaseArticle',
      article.id,
      current,
      article,
      ipAddress,
      userAgent,
    );
    return article;
  }

  async changeKnowledgeBaseArticleStatus(
    companyId: string,
    id: string,
    actorId: string,
    dto: ChangeKnowledgeBaseArticleStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.knowledgeBaseArticle.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current)
      throw new NotFoundException('Knowledge base article not found');

    const article = await this.prisma.knowledgeBaseArticle.update({
      where: { id },
      data: {
        status: dto.status,
        publishedAt:
          dto.status === KnowledgeArticleStatusDto.PUBLISHED
            ? new Date()
            : current.publishedAt,
        archivedAt:
          dto.status === KnowledgeArticleStatusDto.ARCHIVED
            ? new Date()
            : current.archivedAt,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      this.knowledgeArticleStatusAuditAction(dto.status),
      'KnowledgeBaseArticle',
      article.id,
      current,
      article,
      ipAddress,
      userAgent,
    );
    return article;
  }

  async removeKnowledgeBaseArticle(
    companyId: string,
    id: string,
    actorId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.knowledgeBaseArticle.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current)
      throw new NotFoundException('Knowledge base article not found');

    const article = await this.prisma.knowledgeBaseArticle.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'knowledge_base.articles.delete',
      'KnowledgeBaseArticle',
      id,
      current,
      { deleted: true },
      ipAddress,
      userAgent,
    );
    return article;
  }

  private async ensureNoDuplicateDocumentTitle(
    companyId: string,
    folderId: string | undefined,
    title: string,
  ) {
    const existing = await this.prisma.documentRecord.findFirst({
      where: { companyId, folderId, title, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Document title already exists in folder');
    }
  }

  private tagCreateData(companyId: string, tagIds?: string[]) {
    if (!tagIds?.length) return undefined;
    return {
      create: tagIds.map((tagId) => ({ companyId, tagId })),
    };
  }

  private articleTagCreateData(companyId: string, tagIds?: string[]) {
    if (!tagIds?.length) return undefined;
    return {
      create: tagIds.map((tagId) => ({ companyId, tagId })),
    };
  }

  private initialVersionCreateData(
    companyId: string,
    actorId: string,
    dto: CreateDocumentDto,
  ) {
    if (!dto.fileName || !dto.storageKey || !dto.mimeType || !dto.size) {
      return undefined;
    }
    return {
      create: [
        {
          companyId,
          versionNumber: 1,
          fileName: dto.fileName,
          storageKey: dto.storageKey,
          mimeType: dto.mimeType,
          size: dto.size,
          checksum: dto.checksum,
          createdById: actorId,
        },
      ],
    };
  }

  private documentLinkCreateData(
    companyId: string,
    entityType?: DocumentLinkedEntityTypeDto,
    entityId?: string,
  ) {
    if (!entityType || !entityId) return undefined;
    return {
      create: [
        {
          companyId,
          entityType,
          entityId,
          ...this.linkForeignKey(entityType, entityId),
        },
      ],
    };
  }

  private linkForeignKey(
    entityType: DocumentLinkedEntityTypeDto,
    entityId: string,
  ) {
    const map: Record<DocumentLinkedEntityTypeDto, Record<string, string>> = {
      EMPLOYEE: { employeeId: entityId },
      CLIENT: { clientId: entityId },
      PROJECT: { projectId: entityId },
      TASK: { taskId: entityId },
      VENDOR: { vendorId: entityId },
      ASSET: { assetId: entityId },
    };
    return map[entityType];
  }

  private documentStatusAuditAction(status: DocumentStatusDto) {
    const map: Record<DocumentStatusDto, string> = {
      ACTIVE: 'documents.records.update',
      ARCHIVED: 'documents.records.archive',
    };
    return map[status];
  }

  private knowledgeArticleStatusAuditAction(status: KnowledgeArticleStatusDto) {
    const map: Record<KnowledgeArticleStatusDto, string> = {
      DRAFT: 'knowledge_base.articles.update',
      PUBLISHED: 'knowledge_base.articles.publish',
      ARCHIVED: 'knowledge_base.articles.archive',
    };
    return map[status];
  }

  private childPath(parentPath: string | undefined, name: string) {
    const prefix = parentPath && parentPath !== '/' ? parentPath : '';
    return `${prefix}/${this.slug(name)}`;
  }

  private parentPath(path: string) {
    const index = path.lastIndexOf('/');
    return index <= 0 ? undefined : path.slice(0, index);
  }

  private slug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private toDateOnly(value?: string) {
    if (!value) return undefined;
    const date = new Date(value);
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private paginated<T>(data: T[], page: number, limit: number, total: number) {
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async audit(
    companyId: string,
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldValue?: unknown,
    newValue?: unknown,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        companyId,
        actorId,
        action,
        entityType,
        entityId,
        oldValue: oldValue as Prisma.InputJsonValue,
        newValue: newValue as Prisma.InputJsonValue,
        ipAddress,
        userAgent,
      },
    });
  }
}
