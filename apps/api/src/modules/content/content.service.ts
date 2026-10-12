import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertPageContentDto } from './dto/upsert-page-content.dto';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { CreateFaqDto } from './dto/create-faq.dto';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  // ─── Page Content ────────────────────────────────────────────

  async getPageContent(slug: string) {
    return this.prisma.pageContent.findUnique({
      where: { slug },
    });
  }

  async upsertPageContent(slug: string, dto: UpsertPageContentDto) {
    return this.prisma.pageContent.upsert({
      where: { slug },
      update: {
        title: dto.title,
        content: typeof dto.content === 'string' ? dto.content : JSON.stringify(dto.content),
        metadata: dto.metadata ?? undefined,
        updatedAt: new Date(),
      },
      create: {
        slug,
        title: dto.title,
        content: typeof dto.content === 'string' ? dto.content : JSON.stringify(dto.content),
        metadata: dto.metadata ?? undefined,
      },
    });
  }

  // ─── SEO Metadata ────────────────────────────────────────────

  async getSeoMetadata(path: string) {
    return this.prisma.seoMetadata.findUnique({
      where: { path },
    });
  }

  async upsertSeoMetadata(
    path: string,
    data: {
      title: string;
      description?: string;
      ogImage?: string;
      noindex?: boolean;
    },
  ) {
    return this.prisma.seoMetadata.upsert({
      where: { path },
      update: data,
      create: { path, ...data },
    });
  }

  // ─── Testimonials ────────────────────────────────────────────

  async getTestimonials(activeOnly = false) {
    return this.prisma.testimonial.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: { order: 'asc' },
    });
  }

  async createTestimonial(dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({
      data: {
        name: dto.name,
        role: dto.role,
        quote: dto.quote,
        rating: dto.rating,
        avatarUrl: dto.avatarUrl,
        active: dto.active ?? true,
        order: dto.order ?? 0,
      },
    });
  }

  async updateTestimonial(id: string, dto: Partial<CreateTestimonialDto>) {
    const testimonial = await this.prisma.testimonial.findUnique({
      where: { id },
    });
    if (!testimonial) {
      throw new NotFoundException('Testimonial not found');
    }

    return this.prisma.testimonial.update({
      where: { id },
      data: dto,
    });
  }

  async deleteTestimonial(id: string) {
    return this.prisma.testimonial.delete({ where: { id } });
  }

  // ─── FAQs ────────────────────────────────────────────────────

  async getFaqs(category?: string) {
    const where: any = {};
    if (category) {
      where.category = category;
    }
    where.active = true;

    return this.prisma.fAQ.findMany({
      where,
      orderBy: { order: 'asc' },
    });
  }

  async createFaq(dto: CreateFaqDto) {
    return this.prisma.fAQ.create({
      data: {
        question: dto.question,
        answer: dto.answer,
        category: dto.category,
        order: dto.order ?? 0,
      },
    });
  }

  async updateFaq(id: string, dto: Partial<CreateFaqDto>) {
    const faq = await this.prisma.fAQ.findUnique({ where: { id } });
    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }

    return this.prisma.fAQ.update({
      where: { id },
      data: dto,
    });
  }

  async deleteFaq(id: string) {
    return this.prisma.fAQ.delete({ where: { id } });
  }

  // ─── FAQ Categories ──────────────────────────────────────────

  async getFaqCategories() {
    const faqs = await this.prisma.fAQ.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return faqs.map((f: { category: string }) => f.category).filter(Boolean);
  }
}
