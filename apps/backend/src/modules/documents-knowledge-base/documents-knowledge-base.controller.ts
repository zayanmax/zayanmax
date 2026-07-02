import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CurrentUser } from '../../common/types/current-user.type';
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
import { DocumentsKnowledgeBaseService } from './documents-knowledge-base.service';

@ApiTags('Documents & Knowledge Base')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class DocumentsKnowledgeBaseController {
  constructor(
    private readonly documentsKnowledgeBaseService: DocumentsKnowledgeBaseService,
  ) {}

  @RequirePermissions('documents.view')
  @Get('document-folders')
  findFolders(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: DocumentFolderQueryDto,
  ) {
    return this.documentsKnowledgeBaseService.findFolders(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('documents.view')
  @Get('document-folders/:id')
  findFolder(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.documentsKnowledgeBaseService.findFolder(user.companyId, id);
  }

  @RequirePermissions('documents.manage')
  @Post('document-folders')
  createFolder(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateDocumentFolderDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.documentsKnowledgeBaseService.createFolder(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('documents.manage')
  @Patch('document-folders/:id')
  updateFolder(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentFolderDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.documentsKnowledgeBaseService.updateFolder(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('documents.manage')
  @Delete('document-folders/:id')
  removeFolder(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.documentsKnowledgeBaseService.removeFolder(
      user.companyId,
      id,
      user.id,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('documents.view')
  @Get('document-categories')
  findDocumentCategories(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: DocumentCategoryQueryDto,
  ) {
    return this.documentsKnowledgeBaseService.findDocumentCategories(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('documents.manage')
  @Post('document-categories')
  createDocumentCategory(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateDocumentCategoryDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.documentsKnowledgeBaseService.createDocumentCategory(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('documents.view')
  @Get('document-tags')
  findDocumentTags(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: DocumentTagQueryDto,
  ) {
    return this.documentsKnowledgeBaseService.findDocumentTags(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('documents.manage')
  @Post('document-tags')
  createDocumentTag(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateDocumentTagDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.documentsKnowledgeBaseService.createDocumentTag(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('documents.view')
  @Get('documents')
  findDocuments(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: DocumentQueryDto,
  ) {
    return this.documentsKnowledgeBaseService.findDocuments(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('documents.view')
  @Get('documents/:id')
  findDocument(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.documentsKnowledgeBaseService.findDocument(user.companyId, id);
  }

  @RequirePermissions('documents.upload')
  @Post('documents')
  createDocument(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateDocumentDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.documentsKnowledgeBaseService.createDocument(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('documents.manage')
  @Patch('documents/:id')
  updateDocument(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.documentsKnowledgeBaseService.updateDocument(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('documents.manage')
  @Patch('documents/:id/status')
  changeDocumentStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeDocumentStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.documentsKnowledgeBaseService.changeDocumentStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('documents.manage')
  @Delete('documents/:id')
  removeDocument(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.documentsKnowledgeBaseService.removeDocument(
      user.companyId,
      id,
      user.id,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('documents.upload')
  @Post('documents/:id/versions')
  createDocumentVersion(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CreateDocumentVersionDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.documentsKnowledgeBaseService.createDocumentVersion(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('documents.view')
  @Get('knowledge-base/categories')
  findKnowledgeBaseCategories(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: KnowledgeBaseCategoryQueryDto,
  ) {
    return this.documentsKnowledgeBaseService.findKnowledgeBaseCategories(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('documents.manage')
  @Post('knowledge-base/categories')
  createKnowledgeBaseCategory(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateKnowledgeBaseCategoryDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.documentsKnowledgeBaseService.createKnowledgeBaseCategory(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('documents.view')
  @Get('knowledge-base/articles')
  findKnowledgeBaseArticles(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: KnowledgeBaseArticleQueryDto,
  ) {
    return this.documentsKnowledgeBaseService.findKnowledgeBaseArticles(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('documents.view')
  @Get('knowledge-base/articles/:id')
  findKnowledgeBaseArticle(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.documentsKnowledgeBaseService.findKnowledgeBaseArticle(
      user.companyId,
      id,
    );
  }

  @RequirePermissions('documents.manage')
  @Post('knowledge-base/articles')
  createKnowledgeBaseArticle(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateKnowledgeBaseArticleDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.documentsKnowledgeBaseService.createKnowledgeBaseArticle(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('documents.manage')
  @Patch('knowledge-base/articles/:id')
  updateKnowledgeBaseArticle(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeBaseArticleDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.documentsKnowledgeBaseService.updateKnowledgeBaseArticle(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('documents.manage')
  @Patch('knowledge-base/articles/:id/status')
  changeKnowledgeBaseArticleStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeKnowledgeBaseArticleStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.documentsKnowledgeBaseService.changeKnowledgeBaseArticleStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('documents.manage')
  @Delete('knowledge-base/articles/:id')
  removeKnowledgeBaseArticle(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.documentsKnowledgeBaseService.removeKnowledgeBaseArticle(
      user.companyId,
      id,
      user.id,
      ipAddress,
      request.headers['user-agent'],
    );
  }
}
