import { Injectable, NotFoundException, ForbiddenException, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma, Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enquiries: true,
            bookings: true,
            favorites: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        enquiries: { orderBy: { createdAt: 'desc' }, take: 10 },
        bookings: { orderBy: { createdAt: 'desc' }, take: 10 },
        favorites: {
          include: {
            vehicle: { select: { id: true, slug: true, brand: { select: { name: true } }, model: { select: { name: true } }, variant: true, year: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateRole(userId: string, role: Role, actorId: string) {
    return this.changeUser(userId, actorId, role);
  }

  async toggleStatus(userId: string, actorId: string) {
    return this.changeUser(userId, actorId);
  }

  private async changeUser(userId: string, actorId: string, role?: Role) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const actor = await tx.user.findUnique({ where: { id: actorId } });
          if (!actor || actor.role !== 'SUPER_ADMIN' || actor.status !== 'ACTIVE') {
            throw new ForbiddenException('Super administrator access required');
          }
          const user = await tx.user.findUnique({ where: { id: userId } });
          if (!user) throw new NotFoundException('User not found');
          const status: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          const nextRole = role ?? user.role;
          const nextStatus = role === undefined ? status : user.status;
          if (userId === actorId && (nextRole !== user.role || nextStatus !== user.status)) {
            throw new ConflictException('You cannot change your own role or disable your account');
          }
          if (user.role === 'SUPER_ADMIN' && user.status === 'ACTIVE' &&
              (nextRole !== 'SUPER_ADMIN' || nextStatus !== 'ACTIVE')) {
            const activeAdmins = await tx.user.count({ where: { role: 'SUPER_ADMIN', status: 'ACTIVE' } });
            if (activeAdmins <= 1) throw new ConflictException('At least one active super administrator is required');
          }
          const updated = await tx.user.update({
            where: { id: userId },
            data: role === undefined ? { status } : { role },
            select: role === undefined
              ? { id: true, name: true, email: true, status: true }
              : { id: true, name: true, email: true, role: true },
          });
          await tx.auditLog.create({ data: {
            userId: actorId,
            action: role === undefined ? 'user.status.change' : 'user.role.change',
            entity: 'User', entityId: userId,
            metadata: { fromRole: user.role, toRole: nextRole, fromStatus: user.status, toStatus: nextStatus },
          } });
          return updated;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (error instanceof ForbiddenException || error instanceof NotFoundException || error instanceof ConflictException) throw error;
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
          if (attempt < 2) continue;
          throw new ConflictException('Concurrent account change; retry your request');
        }
        throw new ServiceUnavailableException('Account changes are temporarily unavailable');
      }
    }
    throw new ConflictException('Concurrent account change; retry your request');
  }
}