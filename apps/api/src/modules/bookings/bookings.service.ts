import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { PUBLIC_VEHICLE_VISIBILITY } from '../../common/public-vehicle-visibility';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBookingDto) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { slug: dto.vehicleSlug, ...PUBLIC_VEHICLE_VISIBILITY },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return this.prisma.testDriveBooking.create({
      data: {
        name: dto.customerName,
        email: dto.customerEmail,
        phone: dto.customerPhone,
        requestedDate: new Date(dto.preferredDate),
        requestedTime: dto.preferredTime,
        notes: dto.notes,
        status: 'PENDING',
        vehicle: { connect: { id: vehicle.id } },
        // Public caller-supplied userId is not an authenticated identity.
      },
      include: { vehicle: true },
    });
  }

  async findAll(status?: string) {
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    return this.prisma.testDriveBooking.findMany({
      where,
      include: {
        vehicle: { select: { id: true, brand: { select: { name: true } }, model: { select: { name: true } }, variant: true, year: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { requestedDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.testDriveBooking.findUnique({
      where: { id },
      include: {
        vehicle: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.testDriveBooking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.testDriveBooking.update({
      where: { id },
      data: { status: dto.status as any },
      include: { vehicle: true },
    });
  }
}
