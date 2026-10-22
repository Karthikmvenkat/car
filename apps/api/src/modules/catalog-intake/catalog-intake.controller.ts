import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { INVENTORY_ROLES, USER_READ_ROLES } from '../../common/auth-roles';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CatalogIntakeService } from './catalog-intake.service';
import { CatalogPageDto, CreateCatalogSourceDto, PrepareCatalogCandidateDto, ReviewCatalogCandidateDto } from './catalog-intake.dto';

type ActorRequest = { user: { sub: string } };
@ApiTags('Staff catalog intake')
@ApiBearerAuth()
@Controller('catalog-intake')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...INVENTORY_ROLES)
export class CatalogIntakeController {
  constructor(private readonly catalog: CatalogIntakeService) {}

  @Post('sources') @Roles(...USER_READ_ROLES)
  createSource(@Body() dto: CreateCatalogSourceDto, @Req() req: ActorRequest) { return this.catalog.createSource(dto, req.user.sub); }

  @Get('sources')
  listSources(@Query() page: CatalogPageDto) { return this.catalog.listSources(page); }

  @Post('sources/:id/revoke') @Roles(...USER_READ_ROLES)
  revokeSource(@Param('id') id: string, @Req() req: ActorRequest) { return this.catalog.revokeSource(id, req.user.sub); }

  @Post('candidates')
  prepare(@Body() dto: PrepareCatalogCandidateDto, @Req() req: ActorRequest) { return this.catalog.prepare(dto, req.user.sub); }

  @Get('candidates')
  listCandidates(@Query() page: CatalogPageDto) { return this.catalog.listCandidates(page); }

  @Get('candidates/:id')
  findCandidate(@Param('id') id: string) { return this.catalog.findCandidate(id); }

  @Post('candidates/:id/review')
  review(@Param('id') id: string, @Body() dto: ReviewCatalogCandidateDto, @Req() req: ActorRequest) { return this.catalog.review(id, dto, req.user.sub); }
}
