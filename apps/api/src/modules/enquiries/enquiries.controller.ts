import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SALES_ROLES } from '../../common/auth-roles';
import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EnquiriesService } from './enquiries.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UpdateEnquiryStatusDto } from './dto/update-enquiry-status.dto';

@ApiTags('Enquiries')
@Controller('enquiries')
export class EnquiriesController {
  constructor(private enquiriesService: EnquiriesService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new enquiry' })
  create(@Body() dto: CreateEnquiryDto) {
    return this.enquiriesService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SALES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all enquiries (admin)' })
  findAll(@Query('status') status?: string) {
    return this.enquiriesService.findAll(status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SALES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get enquiry details (admin)' })
  findOne(@Param('id') id: string) {
    return this.enquiriesService.findOne(id);
  }

  @Post(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...SALES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update enquiry status (admin)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateEnquiryStatusDto, @GetUser('sub') actorId: string) {
    return this.enquiriesService.updateStatus(id, dto.status, actorId);
  }
}
