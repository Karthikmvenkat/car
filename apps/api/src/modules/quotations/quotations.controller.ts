import {
  applyDecorators,
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { SALES_ROLES } from '../../common/auth-roles';
import {
  CreateQuotationDto,
  CreateQuotationRevisionDto,
  QuotationPageDto,
  QuotationStatusDto,
} from './quotations.dto';
import { QuotationsService } from './quotations.service';
const Private = () =>
  applyDecorators(
    Header('Cache-Control', 'private, no-store'),
    Header('X-Content-Type-Options', 'nosniff'),
  );
@Controller('quotations')
export class PublicQuotationsController {
  constructor(private readonly service: QuotationsService) {}
  @Post() @Private() create(@Body() dto: CreateQuotationDto) {
    return this.service.create(dto);
  }
}
@Controller('quotations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SALES_ROLES)
export class QuotationsController {
  constructor(private readonly service: QuotationsService) {}
  @Get() @Private() list(@Query() dto: QuotationPageDto) {
    return this.service.list(dto);
  }
  @Get(':id') @Private() detail(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.detail(id);
  }
  @Post(':id/status') @Private() status(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: QuotationStatusDto,
    @GetUser('sub') actor: string,
  ) {
    return this.service.status(id, dto, actor);
  }
  @Post(':id/revisions') @Private() prepare(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateQuotationRevisionDto,
    @GetUser('sub') actor: string,
  ) {
    return this.service.prepare(id, dto, actor);
  }
  @Get(':id/revisions/:revisionId/pdf') @Private() async download(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('revisionId', new ParseUUIDPipe()) revisionId: string,
    @Res() res: Response,
  ) {
    const revision = await this.service.download(id, revisionId);
    res.set({
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="quotation-${id}-r${revision.number}.pdf"`,
    });
    res.send(revision.pdf);
  }
}
