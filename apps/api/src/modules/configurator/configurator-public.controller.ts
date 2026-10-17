import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfiguratorPublicService } from './configurator-public.service';
import { SaveConfigurationDto } from './dto/configurator.dto';

@ApiTags('3D Configurator')
@Controller('configurator')
export class ConfiguratorPublicController {
  constructor(private readonly service: ConfiguratorPublicService) {}

  @Get('vehicles')
  list() {
    return this.service.listPublished();
  }

  @Get('vehicles/:slug')
  get(@Param('slug') slug: string) {
    return this.service.getBySlug(slug);
  }

  @Post('configurations')
  save(@Body() dto: SaveConfigurationDto) {
    return this.service.saveConfiguration(dto);
  }

  @Get('configurations/:token')
  load(@Param('token') token: string) {
    return this.service.getConfiguration(token);
  }
}
