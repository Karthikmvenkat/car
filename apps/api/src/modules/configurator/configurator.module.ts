import { Module } from '@nestjs/common';
import { ConfiguratorAdminController } from './configurator-admin.controller';
import { ConfiguratorPublicController } from './configurator-public.controller';
import { ConfiguratorAdminService } from './configurator-admin.service';
import { ConfiguratorPublicService } from './configurator-public.service';
import { StorageService } from './storage/storage.service';
import { PipelineService } from './pipeline/pipeline.service';
import { JobQueueService } from './pipeline/job-queue.service';
import { ModelDiscoveryService } from './discovery/model-discovery.service';
import { SketchfabProvider } from './discovery/sketchfab.provider';
import { OpenAIImageProvider } from './images/openai-image.provider';

@Module({
  controllers: [ConfiguratorAdminController, ConfiguratorPublicController],
  providers: [
    StorageService,
    SketchfabProvider,
    OpenAIImageProvider,
    ModelDiscoveryService,
    PipelineService,
    JobQueueService,
    ConfiguratorAdminService,
    ConfiguratorPublicService,
  ],
  exports: [StorageService],
})
export class ConfiguratorModule {}
