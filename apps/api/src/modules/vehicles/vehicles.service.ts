import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { SearchVehiclesDto } from './dto/search-vehicles.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async search(dto: SearchVehiclesDto) {
    const {
      page = 1,
      limit = 12,
      make,
      model,
      bodyStyle,
      fuelType,
      transmission,
      condition,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      sort = 'newest',
      published = true,
    } = dto;

    const where: any = {};

    if (published) {
      where.status = 'AVAILABLE';
    }
    if (make) where.brand = { slug: make };
    if (model) where.model = { slug: model };
    if (bodyStyle) where.bodyStyle = bodyStyle;
    if (fuelType) where.fuelType = fuelType;
    if (transmission) where.transmission = transmission;
    if (condition) where.condition = condition;
    if (minPrice) where.price = { ...where.price, gte: minPrice };
    if (maxPrice) where.price = { ...where.price, lte: maxPrice };
    if (minYear) where.year = { ...where.year, gte: minYear };
    if (maxYear) where.year = { ...where.year, lte: maxYear };

    const orderBy: any = {};
    switch (sort) {
      case 'price-asc':
        orderBy.price = 'asc';
        break;
      case 'price-desc':
        orderBy.price = 'desc';
        break;
      case 'year-desc':
        orderBy.year = 'desc';
        break;
      case 'year-asc':
        orderBy.year = 'asc';
        break;
      case 'mileage-asc':
        orderBy.mileage = 'asc';
        break;
      case 'newest':
      default:
        orderBy.createdAt = 'desc';
        break;
    }

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          brand: true,
          model: true,
          images: { where: { isPrimary: true }, take: 1 },
          location: true,
        },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAll() {
    return this.prisma.vehicle.findMany({
      include: {
        brand: true,
        model: true,
        images: { orderBy: { order: 'asc' }, take: 1 },
        location: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { slug },
      include: {
        brand: true,
        model: true,
        images: { orderBy: { order: 'asc' } },
        features: true,
        location: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async create(dto: CreateVehicleDto) {
    const slug = `${dto.year}-${dto.brandSlug}-${dto.modelSlug}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return this.prisma.vehicle.create({
      data: {
        slug,
        year: dto.year,
        condition: dto.condition as any,
        price: dto.price,
        mileage: dto.mileage ?? 0,
        fuelType: dto.fuelType ?? 'Petrol',
        transmission: dto.transmission ?? 'Manual',
        drivetrain: dto.drivetrain,
        bodyStyle: dto.bodyStyle ?? 'SUV',
        exteriorColor: dto.exteriorColor ?? 'Black',
        interiorColor: dto.interiorColor,
        description: dto.description,
        status: dto.status === 'AVAILABLE' ? 'AVAILABLE' : 'DRAFT',
        featured: dto.featured ?? false,
        brand: { connect: { slug: dto.brandSlug } },
        model: { connect: { id_slug: { id: '', slug: dto.modelSlug } } } as any,
        location: dto.locationId ? { connect: { id: dto.locationId } } : undefined,
        images: dto.images
          ? {
              create: dto.images.map((img, i) => ({
                url: img.url,
                alt: img.alt || '',
                order: i,
                isPrimary: i === 0,
              })),
            }
          : undefined,
        publishedAt: dto.status === 'AVAILABLE' ? new Date() : undefined,
      },
      include: { brand: true, model: true, images: true },
    });
  }

  async update(id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const updateData: any = { ...dto };

    // Handle brand/model slug connections
    if (dto.brandSlug) {
      updateData.brand = { connect: { slug: dto.brandSlug } };
      delete updateData.brandSlug;
    }
    if (dto.modelSlug) {
      updateData.model = { connect: { slug: dto.modelSlug } };
      delete updateData.modelSlug;
    }

    // Track publish date
    if (dto.status === 'AVAILABLE' && vehicle.status !== 'AVAILABLE') {
      updateData.publishedAt = new Date();
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: updateData,
      include: { brand: true, model: true, images: { orderBy: { order: 'asc' } } },
    });
  }

  async remove(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    await this.prisma.vehicle.delete({ where: { id } });
    return { deleted: true };
  }

  async getFeatured() {
    return this.prisma.vehicle.findMany({
      where: { featured: true, status: 'AVAILABLE' },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        brand: true,
        model: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
    });
  }
}
