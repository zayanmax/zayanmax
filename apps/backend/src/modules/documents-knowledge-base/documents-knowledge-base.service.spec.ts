import { ConflictException, NotFoundException } from '@nestjs/common';
import { DocumentsKnowledgeBaseService } from './documents-knowledge-base.service';
import {
  DocumentLinkedEntityTypeDto,
  DocumentStatusDto,
  DocumentVisibilityDto,
  KnowledgeArticleStatusDto,
} from './dto/documents-knowledge-base.enums';

describe('DocumentsKnowledgeBaseService', () => {
  const prisma = {
    documentFolder: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    documentCategory: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    documentTag: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    documentRecord: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    documentVersion: {
      create: jest.fn(),
      aggregate: jest.fn(),
    },
    knowledgeBaseCategory: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    knowledgeBaseArticle: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  };

  beforeEach(() => jest.clearAllMocks());

  it('creates folder hierarchy paths and rejects duplicate folder paths', async () => {
    prisma.documentFolder.findFirst
      .mockResolvedValueOnce({ id: 'parent-id', path: '/policies' })
      .mockResolvedValueOnce(null);
    prisma.documentFolder.create.mockResolvedValue({
      id: 'folder-id',
      name: 'HR Policies',
      path: '/policies/hr-policies',
    });
    const service = new DocumentsKnowledgeBaseService(prisma as never);

    const result = await service.createFolder('company-id', 'actor-id', {
      parentFolderId: 'parent-id',
      name: 'HR Policies',
      visibility: DocumentVisibilityDto.DEPARTMENT,
      departmentId: 'department-id',
    });

    expect(result.path).toBe('/policies/hr-policies');
    expect(prisma.documentFolder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          parentFolderId: 'parent-id',
          path: '/policies/hr-policies',
          visibility: DocumentVisibilityDto.DEPARTMENT,
        }),
      }),
    );

    prisma.documentFolder.findFirst.mockResolvedValueOnce({
      id: 'existing-folder',
    });
    await expect(
      service.createFolder('company-id', 'actor-id', {
        name: 'HR Policies',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates document records with tags, entity links, and initial version metadata', async () => {
    prisma.documentRecord.findFirst.mockResolvedValue(null);
    prisma.documentRecord.create.mockResolvedValue({
      id: 'document-id',
      title: 'Employment Contract',
      versions: [{ id: 'version-id', versionNumber: 1 }],
    });
    const service = new DocumentsKnowledgeBaseService(prisma as never);

    const result = await service.createDocument('company-id', 'actor-id', {
      folderId: 'folder-id',
      categoryId: 'category-id',
      ownerUserId: 'owner-id',
      title: 'Employment Contract',
      visibility: DocumentVisibilityDto.COMPANY,
      linkedEntityType: DocumentLinkedEntityTypeDto.EMPLOYEE,
      linkedEntityId: 'employee-id',
      tagIds: ['tag-id'],
      expiresAt: '2027-06-13',
      reminderAt: '2027-05-13',
      fileName: 'contract.pdf',
      storageKey: 'documents/contract.pdf',
      mimeType: 'application/pdf',
      size: 4096,
    });

    expect(result.id).toBe('document-id');
    expect(prisma.documentRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          ownerUserId: 'owner-id',
          title: 'Employment Contract',
          tags: { create: [{ companyId: 'company-id', tagId: 'tag-id' }] },
          links: {
            create: [
              expect.objectContaining({
                companyId: 'company-id',
                entityType: DocumentLinkedEntityTypeDto.EMPLOYEE,
                entityId: 'employee-id',
              }),
            ],
          },
          versions: {
            create: [
              expect.objectContaining({
                companyId: 'company-id',
                versionNumber: 1,
                fileName: 'contract.pdf',
              }),
            ],
          },
        }),
      }),
    );
  });

  it('loads document detail with metadata joins and rejects missing records', async () => {
    prisma.documentRecord.findFirst.mockResolvedValueOnce({
      id: 'document-id',
      title: 'Employment Contract',
      tags: [],
      links: [],
      versions: [],
    });
    const service = new DocumentsKnowledgeBaseService(prisma as never);

    const result = await service.findDocument('company-id', 'document-id');

    expect(result.id).toBe('document-id');
    expect(prisma.documentRecord.findFirst).toHaveBeenCalledWith({
      where: { id: 'document-id', companyId: 'company-id', deletedAt: null },
      include: { tags: true, links: true, versions: true },
    });

    prisma.documentRecord.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.findDocument('company-id', 'missing-document'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('loads folder detail with company and soft-delete scoping', async () => {
    prisma.documentFolder.findFirst.mockResolvedValueOnce({
      id: 'folder-id',
      name: 'Policies',
    });
    const service = new DocumentsKnowledgeBaseService(prisma as never);

    const result = await service.findFolder('company-id', 'folder-id');

    expect(result.id).toBe('folder-id');
    expect(prisma.documentFolder.findFirst).toHaveBeenCalledWith({
      where: { id: 'folder-id', companyId: 'company-id', deletedAt: null },
    });
  });

  it('adds document versions with incremented version numbers and audit logs', async () => {
    prisma.documentRecord.findFirst.mockResolvedValue({
      id: 'document-id',
      title: 'Policy',
    });
    prisma.documentVersion.aggregate.mockResolvedValue({
      _max: { versionNumber: 2 },
    });
    prisma.documentVersion.create.mockResolvedValue({
      id: 'version-id',
      versionNumber: 3,
    });
    const service = new DocumentsKnowledgeBaseService(prisma as never);

    const result = await service.createDocumentVersion(
      'company-id',
      'document-id',
      'actor-id',
      {
        fileName: 'policy-v3.pdf',
        storageKey: 'documents/policy-v3.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        notes: 'Updated',
      },
    );

    expect(result.versionNumber).toBe(3);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'documents.versions.create',
        }),
      }),
    );
  });

  it('archives document records with status audit logs', async () => {
    prisma.documentRecord.findFirst.mockResolvedValue({
      id: 'document-id',
      status: DocumentStatusDto.ACTIVE,
    });
    prisma.documentRecord.update.mockResolvedValue({
      id: 'document-id',
      status: DocumentStatusDto.ARCHIVED,
    });
    const service = new DocumentsKnowledgeBaseService(prisma as never);

    await service.changeDocumentStatus(
      'company-id',
      'document-id',
      'actor-id',
      {
        status: DocumentStatusDto.ARCHIVED,
      },
    );

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'documents.records.archive',
        }),
      }),
    );
  });

  it('creates knowledge base categories and rejects duplicate names', async () => {
    prisma.knowledgeBaseCategory.findFirst.mockResolvedValueOnce(null);
    prisma.knowledgeBaseCategory.create.mockResolvedValue({
      id: 'kb-category-id',
      name: 'Operations',
    });
    const service = new DocumentsKnowledgeBaseService(prisma as never);

    const result = await service.createKnowledgeBaseCategory(
      'company-id',
      'actor-id',
      { name: 'Operations' },
    );

    expect(result.id).toBe('kb-category-id');

    prisma.knowledgeBaseCategory.findFirst.mockResolvedValueOnce({
      id: 'existing-category',
    });
    await expect(
      service.createKnowledgeBaseCategory('company-id', 'actor-id', {
        name: 'Operations',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates, publishes, and archives knowledge base articles with audit logs', async () => {
    prisma.knowledgeBaseArticle.findFirst.mockResolvedValue({
      id: 'article-id',
      status: KnowledgeArticleStatusDto.DRAFT,
    });
    prisma.knowledgeBaseArticle.create.mockResolvedValue({
      id: 'article-id',
      title: 'How to request leave',
      status: KnowledgeArticleStatusDto.DRAFT,
    });
    prisma.knowledgeBaseArticle.update
      .mockResolvedValueOnce({
        id: 'article-id',
        status: KnowledgeArticleStatusDto.PUBLISHED,
      })
      .mockResolvedValueOnce({
        id: 'article-id',
        status: KnowledgeArticleStatusDto.ARCHIVED,
      });
    const service = new DocumentsKnowledgeBaseService(prisma as never);

    await service.createKnowledgeBaseArticle('company-id', 'actor-id', {
      categoryId: 'kb-category-id',
      title: 'How to request leave',
      content: 'Use the leave request form.',
      tagIds: ['tag-id'],
    });
    await service.changeKnowledgeBaseArticleStatus(
      'company-id',
      'article-id',
      'actor-id',
      { status: KnowledgeArticleStatusDto.PUBLISHED },
    );
    await service.changeKnowledgeBaseArticleStatus(
      'company-id',
      'article-id',
      'actor-id',
      { status: KnowledgeArticleStatusDto.ARCHIVED },
    );

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'knowledge_base.articles.publish',
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'knowledge_base.articles.archive',
        }),
      }),
    );
  });

  it('loads knowledge base article detail with tags', async () => {
    prisma.knowledgeBaseArticle.findFirst.mockResolvedValueOnce({
      id: 'article-id',
      title: 'How to request leave',
      tags: [],
    });
    const service = new DocumentsKnowledgeBaseService(prisma as never);

    const result = await service.findKnowledgeBaseArticle(
      'company-id',
      'article-id',
    );

    expect(result.id).toBe('article-id');
    expect(prisma.knowledgeBaseArticle.findFirst).toHaveBeenCalledWith({
      where: { id: 'article-id', companyId: 'company-id', deletedAt: null },
      include: { tags: true },
    });
  });
});
