import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { PUBLIC_VEHICLE_VISIBILITY } from '../../common/public-vehicle-visibility';

@Injectable()
export class EnquiriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEnquiryDto) {
    // Find vehicle by slug - required in schema
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { slug: dto.vehicleSlug, ...PUBLIC_VEHICLE_VISIBILITY },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return this.prisma.enquiry.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        message: dto.message,
        vehicle: { connect: { id: vehicle.id } },
        // Public caller-supplied userId is not an authenticated identity.
        source: dto.source || 'website',
        status: 'NEW',
      },
      include: {
        vehicle: { select: { id: true, slug: true, brand: { select: { name: true } }, model: { select: { name: true } }, year: true } },
      },
    });
  }

  async findAll(status?: string) {
    const where: any = {};
    if (status && status !== 'ALL') where.status = status;

    return this.prisma.enquiry.findMany({
      where,
      include: {
        vehicle: { select: { id: true, slug: true, brand: { select: { name: true } }, model: { select: { name: true } }, year: true } },
        user: { select: { id: true, name: true, email: true } },
        notes: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const enquiry = await this.prisma.enquiry.findUnique({
      where: { id },
      include: {
        vehicle: { include: { brand: true, model: true, images: { take: 1 } } },
        user: { select: { id: true, name: true, email: true, phone: true } },
        notes: { orderBy: { createdAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!enquiry) {
      throw new NotFoundException('Enquiry not found');
    }

    return enquiry;
  }

  async updateStatus(id: string, status: string, changedBy = 'system') {
    const enquiry = await this.prisma.enquiry.findUnique({ where: { id } });
    if (!enquiry) {
      throw new NotFoundException('Enquiry not found');
    }

    return this.prisma.enquiry.update({
      where: { id },
      data: {
        status: status as any,
        statusHistory: {
          create: {
            fromStatus: enquiry.status,
            toStatus: status as any,
            changedBy,
          },
        },
      },
      include: {
        vehicle: { select: { id: true, slug: true, brand: { select: { name: true } }, model: { select: { name: true } } } },
      },
    });
  }
}
