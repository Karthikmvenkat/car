import { Body, Controller, Get, Param, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { INVENTORY_ROLES } from '../../common/auth-roles';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MediaPageDto, ReviewCatalogMediaDto, UploadCatalogMediaDto } from './catalog-media.dto';
import { CatalogMediaService } from './catalog-media.service';
import { MAX_IMAGE_BYTES } from './image-processor';
import { MediaPrivacyHeadersInterceptor, MediaUploadLeaseInterceptor } from './upload-lease.interceptor';
type Actor = { user: { sub: string } };

@ApiTags('Private catalog media') @ApiBearerAuth()
@Controller('catalog-media') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(...INVENTORY_ROLES)
@UseInterceptors(MediaPrivacyHeadersInterceptor)
export class CatalogMediaController {
  constructor(private readonly media: CatalogMediaService) {}

  @Post('candidates/:candidateId/images') @ApiConsumes('multipart/form-data')
  // Busboy emits partsLimit at equality; ten permits nine useful parts. The
  // independent eight-field/one-file limits still cap accepted parts at nine.
  @UseInterceptors(MediaUploadLeaseInterceptor, FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 8, parts: 10, fieldSize: 2048, headerPairs: 50 } }))
  async upload(@Param('candidateId') id: string, @Body() dto: UploadCatalogMediaDto, @UploadedFile() file: Express.Multer.File | undefined, @Req() req: Actor, @Res({ passthrough: true }) res: Response) {
    const abort = new AbortController();
    const onClose = () => { if (!res.writableEnded) abort.abort(); };
    res.once('close', onClose);
    try { return await this.media.upload(id, dto, file?.buffer, req.user.sub, abort.signal); }
    finally { res.off('close', onClose); }
  }

  @Get('candidates/:candidateId/images')
  list(@Param('candidateId') id: string, @Query() page: MediaPageDto) { return this.media.list(id, page); }
  @Get('images/:id')
  find(@Param('id') id: string) { return this.media.find(id); }
  @Get('images/:id/derivatives/:variant')
  async derivative(@Param('id') id: string, @Param('variant') variant: string, @Res() res: Response) {
    const bytes = await this.media.derivative(id, variant);
    res.set({ 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
    res.send(bytes);
  }
  @Post('images/:id/review')
  review(@Param('id') id: string, @Body() dto: ReviewCatalogMediaDto, @Req() req: Actor) { return this.media.review(id, dto, req.user.sub); }
  @Post('images/:id/withdraw')
  withdraw(@Param('id') id: string, @Req() req: Actor) { return this.media.withdraw(id, req.user.sub); }
}
