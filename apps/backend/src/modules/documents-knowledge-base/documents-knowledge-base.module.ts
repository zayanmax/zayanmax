import { Module } from '@nestjs/common';
import { DocumentsKnowledgeBaseController } from './documents-knowledge-base.controller';
import { DocumentsKnowledgeBaseService } from './documents-knowledge-base.service';

@Module({
  controllers: [DocumentsKnowledgeBaseController],
  providers: [DocumentsKnowledgeBaseService],
})
export class DocumentsKnowledgeBaseModule {}
