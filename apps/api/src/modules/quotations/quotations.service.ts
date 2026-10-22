import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { SALES_ROLES } from '../../common/auth-roles';
import { PUBLIC_VEHICLE_VISIBILITY } from '../../common/public-vehicle-visibility';
import {
  CreateQuotationDto,
  CreateQuotationRevisionDto,
  QuotationPageDto,
  QuotationStatusDto,
} from './quotations.dto';
import {
  quotationTotal,
  QuoteSnapshot,
  renderQuotation,
} from './quotation-pdf';
const hash = (value: string | Buffer) =>
  createHash('sha256').update(value).digest('hex');
const revisionFields = {
  id: true,
  number: true,
  totalPaise: true,
  createdAt: true,
  createdById: true,
  snapshot: true,
} as const;
@Injectable()
export class QuotationsService {
  constructor(private readonly db: PrismaService) {}
  private async transaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++)
      try {
        return await this.db.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          ['P2034', 'P2002'].includes(error.code)
        ) {
          if (attempt < 2) continue;
          throw new ConflictException(
            'Quotation changed; refresh and try again',
          );
        }
        throw error;
      }
    throw new ConflictException('Quotation changed');
  }
  private async sales(tx: Prisma.TransactionClient, actorId: string) {
    const user = await tx.user.findUnique({
      where: { id: actorId },
      select: { status: true, role: true },
    });
    if (!user || user.status !== 'ACTIVE' || !SALES_ROLES.includes(user.role))
      throw new ForbiddenException();
  }
  async create(dto: CreateQuotationDto) {
    const requestKey = dto.requestKey.toLowerCase();
    const phone = dto.phone.replace(/^\+91[ -]?/, '');
    const email = dto.email.toLowerCase();
    const inputHash = hash(
      JSON.stringify({
        vehicleSlug: dto.vehicleSlug,
        colourId: dto.colourId ?? null,
        phone,
        email,
        consent: true,
      }),
    );
    const request = await this.transaction(async (tx) => {
      const previous = await tx.quotationRequest.findUnique({
        where: { requestKey },
      });
      if (previous) {
        if (previous.inputHash !== inputHash)
          throw new ConflictException(
            'Request key already used; start a new request',
          );
        return previous;
      }
      const vehicle = await tx.vehicle.findFirst({
        where: { slug: dto.vehicleSlug, ...PUBLIC_VEHICLE_VISIBILITY },
        include: { brand: true, model: true, colours: true },
      });
      if (!vehicle)
        throw new NotFoundException('This car is no longer available');
      const colour = dto.colourId
        ? vehicle.colours.find((c) => c.id === dto.colourId)
        : undefined;
      if (dto.colourId && !colour)
        throw new BadRequestException('Select a colour available for this car');
      const bucket = new Date(Math.floor(Date.now() / 3600000) * 3600000);
      for (const contact of ['phone:' + phone, 'email:' + email]) {
        const key = hash(contact) + ':' + bucket.toISOString();
        const quota = await tx.quotationThrottle.upsert({
          where: { key },
          create: { key, bucket, count: 1 },
          update: { count: { increment: 1 } },
        });
        if (quota.count > 5)
          throw new HttpException(
            'Too many quotation requests. Please try again in an hour.',
            429,
          );
      }
      await tx.quotationThrottle.deleteMany({
        where: { bucket: { lt: new Date(bucket.getTime() - 24 * 3600000) } },
      });
      return tx.quotationRequest.create({
        data: {
          requestKey,
          inputHash,
          phone,
          email,
          vehicleSnapshot: {
            id: vehicle.id,
            slug: vehicle.slug,
            title: `${vehicle.year} ${vehicle.brand.name} ${vehicle.model.name}`,
            variant: vehicle.variant ?? '',
            colour: colour?.name ?? '',
            colourId: colour?.id ?? null,
          },
        },
      });
    });
    return {
      reference: request.id,
      message: 'Our team will contact you soon.',
    };
  }
  async list(query: QuotationPageDto) {
    const where = query.status ? { status: query.status } : {};
    const [items, total] = await this.db.$transaction([
      this.db.quotationRequest.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          revisions: {
            select: revisionFields,
            orderBy: { number: 'desc' },
            take: 1,
          },
        },
      }),
      this.db.quotationRequest.count({ where }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }
  async detail(id: string) {
    const result = await this.db.quotationRequest.findUnique({
      where: { id },
      include: {
        revisions: { select: revisionFields, orderBy: { number: 'desc' } },
      },
    });
    if (!result) throw new NotFoundException('Quotation request not found');
    return result;
  }
  async status(id: string, dto: QuotationStatusDto, actorId: string) {
    return this.transaction(async (tx) => {
      await this.sales(tx, actorId);
      if (
        !(await tx.quotationRequest.findUnique({
          where: { id },
          select: { id: true },
        }))
      )
        throw new NotFoundException('Quotation request not found');
      const result = await tx.quotationRequest.updateMany({
        where: { id, version: dto.expectedVersion },
        data: { status: dto.status, version: { increment: 1 } },
      });
      if (result.count !== 1)
        throw new ConflictException('Request changed; refresh before updating');
      await tx.auditLog.create({
        data: {
          userId: actorId,
          entity: 'QuotationRequest',
          entityId: id,
          action: 'QUOTATION_STATUS_CHANGED',
          metadata: { status: dto.status },
        },
      });
      return tx.quotationRequest.findUniqueOrThrow({ where: { id } });
    });
  }
  async prepare(id: string, dto: CreateQuotationRevisionDto, actorId: string) {
    if (dto.reviewed !== true)
      throw new BadRequestException(
        'Review and confirm the quotation before creating a PDF',
      );
    const totals = quotationTotal(dto.items);
    if (dto.validUntil < new Date().toISOString().slice(0, 10))
      throw new BadRequestException('Validity cannot be in the past');
    const request = await this.detail(id);
    if (request.version !== dto.expectedVersion)
      throw new ConflictException('Request changed; refresh before preparing');
    const number = (request.revisions[0]?.number ?? 0) + 1;
    const { expectedVersion, reviewed, ...fields } = dto;
    const snapshot: QuoteSnapshot = {
      ...fields,
      ...totals,
      templateVersion: 1,
      currency: 'INR',
      reference: 'Q-' + id.toUpperCase(),
      number,
      issuedAt: new Date().toISOString(),
      vehicle: request.vehicleSnapshot as unknown as QuoteSnapshot['vehicle'],
      phone: request.phone,
      email: request.email,
    };
    const pdf = await renderQuotation(snapshot);
    const revisionId = randomUUID();
    return this.transaction(async (tx) => {
      await this.sales(tx, actorId);
      const changed = await tx.quotationRequest.updateMany({
        where: { id, version: expectedVersion },
        data: { version: { increment: 1 } },
      });
      if (changed.count !== 1)
        throw new ConflictException(
          'Request changed; refresh before preparing',
        );
      const revision = await tx.quotationRevision.create({
        data: {
          id: revisionId,
          requestId: id,
          number,
          snapshot: JSON.parse(JSON.stringify(snapshot)),
          totalPaise: totals.totalPaise,
          pdf,
          sha256: hash(pdf),
          createdById: actorId,
        },
        select: revisionFields,
      });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          entity: 'QuotationRequest',
          entityId: id,
          action: 'QUOTATION_REVIEWED',
          metadata: { revisionId, number },
        },
      });
      return { revision, version: expectedVersion + 1 };
    });
  }
  async download(requestId: string, id: string) {
    const revision = await this.db.quotationRevision.findFirst({
      where: { id, requestId },
      select: { pdf: true, sha256: true, number: true },
    });
    if (!revision) throw new NotFoundException('Quotation revision not found');
    if (hash(revision.pdf) !== revision.sha256)
      throw new ServiceUnavailableException(
        'Quotation document could not be verified',
      );
    return revision;
  }
}
