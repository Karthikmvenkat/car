import {
  Body, Controller, Delete, Get, Param, ParseBoolPipe, Post, Put, Query, UploadedFile, UploadedFiles, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { ConfiguratorAdminService, MAX_REFERENCE_IMAGE_BYTES, MAX_RENDER_BYTES } from './configurator-admin.service';
import { JobQueueService } from './pipeline/job-queue.service';
import { MAX_MODEL_BYTES } from './discovery/model-discovery.service';
import { discoverManufacturerPhotos } from './images/manufacturer-photos';
import { lookupVariants } from './discovery/variant-lookup';
import {
  CreateConfiguratorVehicleDto, IdentityDecisionDto, ImportCandidateDto, ModelUploadDto, RenderUploadDto,
  ReplaceColoursDto, ReviewDecisionDto, StartJobDto, UpdateConfiguratorVehicleDto, UpdateMaterialMappingsDto,
} from './dto/configurator.dto';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'INVENTORY_MANAGER'];

@ApiTags('Admin — 3D Configurator')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_ROLES)
@Controller('admin/configurator')
export class ConfiguratorAdminController {
  constructor(
    private readonly service: ConfiguratorAdminService,
    private readonly jobs: JobQueueService,
  ) {}

  @Post('vehicles')
  create(@Body() dto: CreateConfiguratorVehicleDto, @GetUser('sub') userId: string) {
    return this.service.createVehicle(dto, userId);
  }

  @Get('photo-lookup')
  async photoLookup(@Query('make') make = '', @Query('model') model = '', @Query('year') year = '') {
    try { return await discoverManufacturerPhotos(make, model, Number(year)); }
    catch { return { colours: [], message: 'Manufacturer photo lookup is temporarily unavailable. Please retry.' }; }
  }

  @Get('variant-lookup')
  async variants(@Query('make') make = '', @Query('model') model = '') {
    try { return await lookupVariants(make, model); }
    catch { return { variants: [], message: 'Variant lookup is temporarily unavailable. Use Other variant.' }; }
  }

  @Get('vehicles')
  list() {
    return this.service.listVehicles();
  }

  @Get('vehicles/:id')
  get(@Param('id') id: string) {
    return this.service.getVehicle(id);
  }

  @Put('vehicles/:id')
  update(@Param('id') id: string, @Body() dto: UpdateConfiguratorVehicleDto, @GetUser('sub') userId: string) {
    return this.service.updateVehicle(id, dto, userId);
  }

  @Put('vehicles/:id/colours')
  colours(@Param('id') id: string, @Body() dto: ReplaceColoursDto, @GetUser('sub') userId: string) {
    return this.service.replaceColours(id, dto.colours, userId);
  }

  // ── Jobs ──
  @Post('vehicles/:id/jobs')
  startJob(@Param('id') id: string, @Body() dto: StartJobDto, @GetUser('sub') userId: string) {
    return this.jobs.resumeVehicle(id, dto.fromStage ?? 'VALIDATE_INPUT', userId);
  }

  @Post('jobs/:id/retry')
  retry(@Param('id') id: string, @Body() dto: StartJobDto) {
    return this.jobs.retry(id, dto.fromStage);
  }

  @Post('jobs/:id/cancel')
  cancel(@Param('id') id: string) {
    return this.jobs.cancel(id);
  }

  // ── Uploads ──
  @Post('vehicles/:id/model')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_MODEL_BYTES, files: 1 } }))
  uploadModel(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ModelUploadDto,
    @GetUser('sub') userId: string,
  ) {
    return this.service.uploadModel(id, file, dto, userId);
  }

  @Post('vehicles/:id/reference-images')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 6, { storage: memoryStorage(), limits: { fileSize: MAX_REFERENCE_IMAGE_BYTES } }))
  uploadReferences(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[], @GetUser('sub') userId: string) {
    return this.service.uploadReferenceImages(id, files, userId);
  }

  @Post('vehicles/:id/renders')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_RENDER_BYTES, files: 1 } }))
  uploadRender(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body() dto: RenderUploadDto) {
    return this.service.uploadRender(id, file, dto);
  }

  // ── Discovery ──
  @Post('vehicles/:id/candidates/search')
  searchCandidates(@Param('id') id: string) {
    return this.service.searchCandidates(id);
  }

  @Post('vehicles/:id/candidates/:assetId/import')
  importCandidate(
    @Param('id') id: string,
    @Param('assetId') assetId: string,
    @Body() dto: ImportCandidateDto,
    @GetUser('sub') userId: string,
  ) {
    return this.service.importCandidate(id, assetId, !!dto.licenceAcknowledged, userId);
  }

  // ── Review ──
  @Put('assets/:id/material-mappings')
  mappings(@Param('id') id: string, @Body() dto: UpdateMaterialMappingsDto, @GetUser('sub') userId: string) {
    return this.service.updateMaterialMappings(id, dto, userId);
  }

  @Post('assets/:id/identity')
  identity(@Param('id') id: string, @Body() dto: IdentityDecisionDto, @GetUser('sub') userId: string) {
    return this.service.decideIdentity(id, dto, userId);
  }

  @Delete('assets/:id')
  deleteAsset(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.service.deleteAsset(id, userId);
  }

  @Post('vehicles/:id/approve')
  approve(@Param('id') id: string, @Body() dto: ReviewDecisionDto, @GetUser('sub') userId: string) {
    return this.service.approve(id, userId, dto.note);
  }

  @Post('vehicles/:id/reject')
  reject(@Param('id') id: string, @Body() dto: ReviewDecisionDto, @GetUser('sub') userId: string) {
    return this.service.reject(id, userId, dto.note);
  }

  @Post('vehicles/:id/publish')
  publish(
    @Param('id') id: string,
    @Query('marketingOnly', new ParseBoolPipe({ optional: true })) marketingOnly: boolean | undefined,
    @GetUser('sub') userId: string,
  ) {
    return this.service.publish(id, !!marketingOnly, userId);
  }

  @Post('vehicles/:id/unpublish')
  unpublish(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.service.unpublish(id, userId);
  }
}
