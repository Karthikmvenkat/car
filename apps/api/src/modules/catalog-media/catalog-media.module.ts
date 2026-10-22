import { Module } from '@nestjs/common';
import { CatalogMediaController } from './catalog-media.controller';
import { CatalogMediaService } from './catalog-media.service';
import { CatalogImageProcessor } from './image-processor';
import { PrivateMediaStorage } from './private-media-storage';
import { MediaPrivacyHeadersInterceptor, MediaUploadLeaseInterceptor } from './upload-lease.interceptor';
@Module({ controllers: [CatalogMediaController], providers: [CatalogMediaService, CatalogImageProcessor, PrivateMediaStorage, MediaUploadLeaseInterceptor, MediaPrivacyHeadersInterceptor] })
export class CatalogMediaModule {}
