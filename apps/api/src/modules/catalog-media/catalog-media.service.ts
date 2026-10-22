import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CatalogSource, Prisma } from '@prisma/client';
import { INVENTORY_ROLES } from '../../common/auth-roles';
import { PrismaService } from '../../prisma/prisma.service';
import { inputHash, isFresh, referenceUrl } from '../catalog-intake/catalog-normalization';
import { MediaPageDto, ReviewCatalogMediaDto, UploadCatalogMediaDto } from './catalog-media.dto';
import { CatalogImageProcessor, hashBytes, MAX_IMAGE_BYTES } from './image-processor';
import { PrivateMediaStorage } from './private-media-storage';

const include = { source: true, candidate: { include: { source: true } } } as const;
type Media = Prisma.CatalogMediaGetPayload<{ include: typeof include }>;
const permitted = (source: CatalogSource, now: Date) => !source.revokedAt && source.validUntil > now && source.commercialUse && source.storageAllowed && source.displayAllowed && source.modificationAllowed;
function candidateEligible(candidate: Media['candidate'], now: Date) {
  return candidate.status === 'ACCEPTED' && permitted(candidate.source, now) && candidate.sourcePolicyVersion === candidate.source.policyVersion &&
    isFresh(candidate.saleObservedAt, now) && (candidate.facts as unknown as { observedAt: string }[]).every(fact => isFresh(fact.observedAt, now));
}

@Injectable()
export class CatalogMediaService {
  constructor(private readonly prisma: PrismaService, private readonly processor: CatalogImageProcessor, private readonly storage: PrivateMediaStorage) {}

  private async mutation<T>(actorId: string, action: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(async tx => {
          const actor = await tx.user.findUnique({ where: { id: actorId }, select: { role: true, status: true } });
          if (!actor || actor.status !== 'ACTIVE' || !INVENTORY_ROLES.includes(actor.role)) throw new ForbiddenException('Current inventory permission required');
          return action(tx);
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (error instanceof BadRequestException || error instanceof ConflictException || error instanceof ForbiddenException || error instanceof NotFoundException) throw error;
        if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034','P2002'].includes(error.code)) {
          if (attempt < 2) continue;
          throw new ConflictException('Concurrent media change; retry your request');
        }
        throw new ServiceUnavailableException('Media changes are temporarily unavailable');
      }
    }
    throw new ConflictException('Concurrent media change; retry your request');
  }

  private present(media: Media) {
    const { storageKey: _storageKey, source, candidate, ...record } = media;
    const now = new Date();
    return { ...record, identitySnapshot: candidate.identity, eligibleForPublication: media.status === 'ACCEPTED' && media.identityConfirmed && !media.withdrawnAt &&
      permitted(source, now) && source.policyVersion === media.sourcePolicyVersion && candidateEligible(candidate, now) };
  }

  private requirePermission(source: CatalogSource | null): asserts source is CatalogSource {
    if (!source) throw new NotFoundException('Catalog source not found');
    if (!permitted(source, new Date())) throw new ConflictException('Image source permission is expired, revoked or incomplete');
  }

  async upload(candidateId: string, dto: UploadCatalogMediaDto, bytes: Buffer | undefined, actorId: string, signal?: AbortSignal) {
    if (!bytes?.length || bytes.length > MAX_IMAGE_BYTES) throw new BadRequestException('Provide one image of at most 8 MiB');
    const acquiredAt = new Date(dto.acquiredAt);
    if (!Number.isFinite(acquiredAt.getTime()) || acquiredAt > new Date()) throw new BadRequestException('Image acquisition timestamp must not be in the future');
    const originalHash = hashBytes(bytes);
    // Bytes, provenance, candidate and immutable recipe all participate in replay identity.
    const requestHash = (sourcePolicyVersion: number) => inputHash({ candidateId, ...dto, originalHash, sourcePolicyVersion, recipeVersion: 1 });
    const preflight = async (tx: Prisma.TransactionClient) => {
      if (signal?.aborted) throw new BadRequestException('Image preparation was cancelled');
      const source = await tx.catalogSource.findUnique({ where: { id: dto.sourceId } });
      this.requirePermission(source); referenceUrl(dto.evidenceUrl, source.host);
      const hash = requestHash(source.policyVersion);
      if (!await tx.catalogCandidate.findUnique({ where: { id: candidateId }, select: { id: true } })) throw new NotFoundException('Catalog candidate not found');
      const prior = await tx.catalogMedia.findUnique({ where: { candidateId_importKey: { candidateId, importKey: dto.importKey } }, include });
      if (prior && prior.inputHash !== hash) throw new ConflictException('Upload key already belongs to different content');
      return { prior, source, hash };
    };
    const initial = await this.mutation(actorId, preflight);
    if (initial.prior) return this.present(initial.prior);
    const processed = await this.processor.process(bytes, signal);
    if (signal?.aborted) throw new BadRequestException('Image preparation was cancelled');
    const storageKey = await this.storage.write(bytes, processed);
    // Never remove this set on a DB error: commit may have succeeded before the
    // response was lost. Unreferenced private sets require conservative reconciliation.
    return this.mutation(actorId, async tx => {
      const { prior, source, hash } = await preflight(tx);
      if (source.policyVersion !== initial.source.policyVersion) throw new ConflictException('Image source policy changed during preparation');
      if (prior) return this.present(prior);
      const media = await tx.catalogMedia.create({ data: {
        candidateId, sourceId: source.id, sourcePolicyVersion: source.policyVersion, importKey: dto.importKey, inputHash: hash,
        evidenceUrl: dto.evidenceUrl, evidenceRef: dto.evidenceRef, creator: dto.creator, attribution: dto.attribution, alt: dto.alt, acquiredAt,
        originalHash, originalBytes: bytes.length, originalFormat: processed.format, width: processed.width, height: processed.height, storageKey,
        derivatives: processed.derivatives.map(item => ({ variant: item.variant, width: item.width, height: item.height, hash: item.hash, bytes: item.data.length, format: 'webp' })),
        submittedById: actorId,
      }, include });
      await tx.auditLog.create({ data: { userId: actorId, action: 'catalog.media.prepare', entity: 'CatalogMedia', entityId: media.id, metadata: { candidateId, originalHash, recipeVersion: 1 } } });
      return this.present(media);
    });
  }

  async find(id: string) {
    const media = await this.prisma.catalogMedia.findUnique({ where: { id }, include });
    if (!media) throw new NotFoundException('Catalog media not found');
    return this.present(media);
  }

  async list(candidateId: string, page: MediaPageDto) {
    const rows = await this.prisma.catalogMedia.findMany({ where: { candidateId }, orderBy: { id: 'desc' }, take: page.limit + 1, include,
      ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}) });
    return { items: rows.slice(0, page.limit).map(media => this.present(media)), nextCursor: rows.length > page.limit ? rows[page.limit - 1].id : null };
  }

  review(id: string, dto: ReviewCatalogMediaDto, actorId: string) {
    return this.mutation(actorId, async tx => {
      const media = await tx.catalogMedia.findUnique({ where: { id }, include });
      if (!media) throw new NotFoundException('Catalog media not found');
      if (media.status !== 'READY_FOR_REVIEW') {
        if (media.status !== dto.decision || media.reviewNote !== dto.note || media.identityConfirmed !== dto.identityConfirmed) throw new ConflictException('Media already has a final review');
        return this.present(media);
      }
      if (dto.decision === 'ACCEPTED') {
        this.requirePermission(media.source);
        if (!dto.identityConfirmed || media.withdrawnAt || media.sourcePolicyVersion !== media.source.policyVersion || !candidateEligible(media.candidate, new Date())) throw new ConflictException('Acceptance requires exact variant identity, current permission and eligible catalog facts');
      }
      const result = await tx.catalogMedia.updateMany({ where: { id, status: 'READY_FOR_REVIEW' }, data: { status: dto.decision, reviewNote: dto.note, identityConfirmed: dto.identityConfirmed, reviewedById: actorId, reviewedAt: new Date() } });
      if (result.count !== 1) throw new ConflictException('Media already has a final review');
      await tx.auditLog.create({ data: { userId: actorId, action: 'catalog.media.review', entity: 'CatalogMedia', entityId: id, metadata: { decision: dto.decision, identityConfirmed: dto.identityConfirmed } } });
      return this.present(await tx.catalogMedia.findUniqueOrThrow({ where: { id }, include }));
    });
  }

  withdraw(id: string, actorId: string) {
    return this.mutation(actorId, async tx => {
      const media = await tx.catalogMedia.findUnique({ where: { id }, include });
      if (!media) throw new NotFoundException('Catalog media not found');
      if (media.withdrawnAt) return this.present(media);
      const result = await tx.catalogMedia.update({ where: { id }, data: { withdrawnAt: new Date(), withdrawnById: actorId }, include });
      await tx.auditLog.create({ data: { userId: actorId, action: 'catalog.media.withdraw', entity: 'CatalogMedia', entityId: id } });
      return this.present(result);
    });
  }

  async derivative(id: string, variant: string) {
    if (!['preview','thumbnail'].includes(variant)) throw new NotFoundException('Derivative not found');
    const load = async () => {
      const media = await this.prisma.catalogMedia.findUnique({ where: { id }, include: { source: true } });
      if (!media) throw new NotFoundException('Catalog media not found');
      this.requirePermission(media.source);
      if (media.withdrawnAt) throw new ConflictException('Media has been withdrawn');
      return media;
    };
    const media = await load();
    const derivative = (media.derivatives as unknown as { variant: string; hash: string; bytes: number }[]).find(item => item.variant === variant);
    if (!derivative) throw new NotFoundException('Derivative not found');
    const bytes = await this.storage.read(media.storageKey, variant, derivative.hash, derivative.bytes);
    await load(); // Recheck rights after storage I/O before returning bytes.
    return bytes;
  }
}
