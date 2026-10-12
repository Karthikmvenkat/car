import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateModelDto } from './dto/create-model.dto';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.brand.findMany({
      include: {
        _count: {
          select: { models: true, vehicles: true },
        },
        models: {
          select: { id: true, name: true, slug: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        models: { orderBy: { name: 'asc' } },
        vehicles: {
          select: {
            id: true,
            brand: { select: { name: true } },
            model: { select: { name: true } },
            variant: true,
            year: true,
            price: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return brand;
  }

  async create(dto: CreateBrandDto) {
    return this.prisma.brand.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        logoUrl: dto.logoUrl,
        active: dto.active ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateBrandDto) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return this.prisma.brand.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { vehicles: true } } },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (brand._count.vehicles > 0) {
      throw new Error('Cannot delete brand with existing vehicles');
    }

    return this.prisma.brand.delete({ where: { id } });
  }

  async createModel(brandId: string, dto: CreateModelDto) {
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return this.prisma.model.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        bodyStyle: dto.bodyStyle,
        brand: { connect: { id: brandId } },
      },
    });
  }

  async removeModel(modelId: string) {
    return this.prisma.model.delete({ where: { id: modelId } });
  }
}
