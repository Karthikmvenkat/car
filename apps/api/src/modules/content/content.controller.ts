import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { UpsertPageContentDto } from './dto/upsert-page-content.dto';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { CreateFaqDto } from './dto/create-faq.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ─── Page Content ────────────────────────────────────────────

  @Get('pages/:pageKey')
  @ApiOperation({ summary: 'Get page content by key' })
  getPageContent(@Param('pageKey') pageKey: string) {
    return this.contentService.getPageContent(pageKey);
  }

  @Post('pages/:pageKey')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update page content (admin)' })
  upsertPageContent(
    @Param('pageKey') pageKey: string,
    @Body() dto: UpsertPageContentDto,
  ) {
    return this.contentService.upsertPageContent(pageKey, dto);
  }

  // ─── SEO ─────────────────────────────────────────────────────

  @Get('seo/:pagePath')
  @ApiOperation({ summary: 'Get SEO metadata for a page' })
  getSeoMetadata(@Param('pagePath') pagePath: string) {
    return this.contentService.getSeoMetadata(pagePath);
  }

  @Post('seo/:pagePath')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update SEO metadata (admin)' })
  upsertSeoMetadata(
    @Param('pagePath') pagePath: string,
    @Body()
    data: {
      title: string;
      description: string;
      keywords?: string[];
      ogImage?: string;
    },
  ) {
    return this.contentService.upsertSeoMetadata(pagePath, data);
  }

  // ─── Testimonials ────────────────────────────────────────────

  @Get('testimonials')
  @ApiOperation({ summary: 'List testimonials' })
  @ApiQuery({ name: 'featured', required: false })
  getTestimonials(@Query('featured') featured?: string) {
    return this.contentService.getTestimonials(featured === 'true');
  }

  @Post('testimonials')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a testimonial (admin)' })
  createTestimonial(@Body() dto: CreateTestimonialDto) {
    return this.contentService.createTestimonial(dto);
  }

  @Put('testimonials/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a testimonial (admin)' })
  updateTestimonial(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTestimonialDto>,
  ) {
    return this.contentService.updateTestimonial(id, dto);
  }

  @Delete('testimonials/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a testimonial (admin)' })
  deleteTestimonial(@Param('id') id: string) {
    return this.contentService.deleteTestimonial(id);
  }

  // ─── FAQs ────────────────────────────────────────────────────

  @Get('faqs')
  @ApiOperation({ summary: 'List FAQs' })
  @ApiQuery({ name: 'category', required: false })
  getFaqs(@Query('category') category?: string) {
    return this.contentService.getFaqs(category);
  }

  @Get('faqs/categories')
  @ApiOperation({ summary: 'List FAQ categories' })
  getFaqCategories() {
    return this.contentService.getFaqCategories();
  }

  @Post('faqs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an FAQ (admin)' })
  createFaq(@Body() dto: CreateFaqDto) {
    return this.contentService.createFaq(dto);
  }

  @Put('faqs/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an FAQ (admin)' })
  updateFaq(@Param('id') id: string, @Body() dto: Partial<CreateFaqDto>) {
    return this.contentService.updateFaq(id, dto);
  }

  @Delete('faqs/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an FAQ (admin)' })
  deleteFaq(@Param('id') id: string) {
    return this.contentService.deleteFaq(id);
  }
}
