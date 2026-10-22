import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CatalogCandidate, CatalogSource, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { INVENTORY_ROLES, USER_READ_ROLES } from '../../common/auth-roles';
import { CatalogPageDto, CreateCatalogSourceDto, PrepareCatalogCandidateDto, ReviewCatalogCandidateDto } from './catalog-intake.dto';
import { DICTIONARY_VERSION, inputHash, isFresh, normalizeFacts, referenceUrl, requireFresh } from './catalog-normalization';

@Injectable()
export class CatalogIntakeService {
  constructor(private readonly prisma: PrismaService) {}

  private async mutation<T>(actorId: string, roles: string[], operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(async tx => {
          const actor = await tx.user.findUnique({ where: { id: actorId }, select: { role: true, status: true } });
          if (!actor || actor.status !== 'ACTIVE' || !roles.includes(actor.role)) throw new ForbiddenException('Current catalog permission required');
          return operation(tx);
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (error instanceof BadRequestException || error instanceof ForbiddenException || error instanceof NotFoundException || error instanceof ConflictException) throw error;
        // A concurrent keyed insert can surface as either serialization or uniqueness.
        if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(error.code)) {
          if (attempt < 2) continue;
          throw new ConflictException('Concurrent catalog change; retry your request');
        }
        throw new ServiceUnavailableException('Catalog changes are temporarily unavailable');
      }
    }
    throw new ConflictException('Concurrent catalog change; retry your request');
  }

  private requireSource(source: CatalogSource | null, now: Date): asserts source is CatalogSource {
    if (!source) throw new NotFoundException('Catalog source not found');
    if (source.revokedAt || source.validUntil <= now || !source.commercialUse || !source.storageAllowed || !source.displayAllowed || !source.modificationAllowed) {
      throw new ConflictException('Source permission is expired, revoked or incomplete');
    }
  }

  private present(candidate: CatalogCandidate, source: CatalogSource, now = new Date()) {
    const facts = candidate.facts as unknown as { observedAt: string }[];
    return { ...candidate, eligibleForPublication: candidate.status === 'ACCEPTED' && !source.revokedAt && source.validUntil > now &&
      source.commercialUse && source.storageAllowed && source.displayAllowed && source.modificationAllowed &&
      candidate.sourcePolicyVersion === source.policyVersion && isFresh(candidate.saleObservedAt, now) && facts.every(fact => isFresh(fact.observedAt, now)) };
  }

  async createSource(dto: CreateCatalogSourceDto, actorId: string) {
    const host = referenceUrl(dto.sourceUrl).hostname;
    const validUntil = new Date(dto.validUntil);
    if (!Number.isFinite(validUntil.getTime()) || validUntil <= new Date()) throw new BadRequestException('Source permission expiry must be in the future');
    return this.mutation(actorId, USER_READ_ROLES, async tx => {
      if (validUntil <= new Date()) throw new BadRequestException('Source permission expiry must be in the future');
      const source = await tx.catalogSource.create({ data: { ...dto, validUntil, host, approvedById: actorId } });
      await tx.auditLog.create({ data: { userId: actorId, action: 'catalog.source.approve', entity: 'CatalogSource', entityId: source.id, metadata: { policyVersion: source.policyVersion, license: source.license } } });
      return source;
    });
  }

  revokeSource(id: string, actorId: string) {
    return this.mutation(actorId, USER_READ_ROLES, async tx => {
      const source = await tx.catalogSource.findUnique({ where: { id } });
      if (!source) throw new NotFoundException('Catalog source not found');
      if (source.revokedAt) return source;
      const result = await tx.catalogSource.update({ where: { id }, data: { revokedAt: new Date(), revokedById: actorId } });
      await tx.auditLog.create({ data: { userId: actorId, action: 'catalog.source.revoke', entity: 'CatalogSource', entityId: id } });
      return result;
    });
  }

  prepare(dto: PrepareCatalogCandidateDto, actorId: string) {
    return this.mutation(actorId, INVENTORY_ROLES, async tx => {
      const now = new Date();
      const source = await tx.catalogSource.findUnique({ where: { id: dto.sourceId } });
      this.requireSource(source, now);
      const hash = inputHash({ ...dto, sourcePolicyVersion: source.policyVersion, dictionaryVersion: DICTIONARY_VERSION });
      const prior = await tx.catalogCandidate.findUnique({ where: { sourceId_importKey: { sourceId: dto.sourceId, importKey: dto.importKey } } });
      if (prior) {
        if (prior.inputHash !== hash) throw new ConflictException('Import key already belongs to different content');
        return this.present(prior, source, now);
      }
      referenceUrl(dto.saleEvidenceUrl, source.host);
      requireFresh(dto.saleObservedAt, now);
      const facts = normalizeFacts(dto.facts, source.host, now);
      const candidate = await tx.catalogCandidate.create({ data: {
        sourceId: source.id, sourcePolicyVersion: source.policyVersion, importKey: dto.importKey, inputHash: hash,
        dictionaryVersion: DICTIONARY_VERSION, identity: { ...dto.identity }, saleEvidenceUrl: dto.saleEvidenceUrl,
        saleObservedAt: new Date(dto.saleObservedAt), facts, submittedById: actorId,
      } });
      await tx.auditLog.create({ data: { userId: actorId, action: 'catalog.candidate.prepare', entity: 'CatalogCandidate', entityId: candidate.id, metadata: { sourceId: source.id, inputHash: hash, dictionaryVersion: DICTIONARY_VERSION } } });
      return this.present(candidate, source, now);
    });
  }

  review(id: string, dto: ReviewCatalogCandidateDto, actorId: string) {
    return this.mutation(actorId, INVENTORY_ROLES, async tx => {
      const candidate = await tx.catalogCandidate.findUnique({ where: { id }, include: { source: true } });
      if (!candidate) throw new NotFoundException('Catalog candidate not found');
      const { source, ...record } = candidate;
      const now = new Date();
      if (candidate.status !== 'READY_FOR_REVIEW') {
        if (candidate.status !== dto.decision || candidate.reviewNote !== dto.note) throw new ConflictException('Candidate already has a final review');
        return this.present(record, source, now);
      }
      if (dto.decision === 'ACCEPTED') {
        this.requireSource(source, now);
        if (source.policyVersion !== candidate.sourcePolicyVersion) throw new ConflictException('Source policy changed; submit a new candidate');
        requireFresh(candidate.saleObservedAt, now);
        for (const fact of candidate.facts as unknown as { observedAt: string }[]) requireFresh(fact.observedAt, now);
      }
      const result = await tx.catalogCandidate.updateMany({ where: { id, status: 'READY_FOR_REVIEW' }, data: { status: dto.decision, reviewNote: dto.note, reviewedById: actorId, reviewedAt: now } });
      if (result.count !== 1) throw new ConflictException('Candidate already has a final review');
      await tx.auditLog.create({ data: { userId: actorId, action: 'catalog.candidate.review', entity: 'CatalogCandidate', entityId: id, metadata: { decision: dto.decision, inputHash: candidate.inputHash } } });
      return this.present(await tx.catalogCandidate.findUniqueOrThrow({ where: { id } }), source, now);
    });
  }

  async listSources(page: CatalogPageDto) {
    const rows = await this.prisma.catalogSource.findMany({ orderBy: { id: 'desc' }, take: page.limit + 1, ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}) });
    return { items: rows.slice(0, page.limit), nextCursor: rows.length > page.limit ? rows[page.limit - 1].id : null };
  }

  async listCandidates(page: CatalogPageDto) {
    const rows = await this.prisma.catalogCandidate.findMany({ orderBy: { id: 'desc' }, take: page.limit + 1, include: { source: true }, ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}) });
    return { items: rows.slice(0, page.limit).map(({ source, ...candidate }) => this.present(candidate, source)), nextCursor: rows.length > page.limit ? rows[page.limit - 1].id : null };
  }

  async findCandidate(id: string) {
    const result = await this.prisma.catalogCandidate.findUnique({ where: { id }, include: { source: true } });
    if (!result) throw new NotFoundException('Catalog candidate not found');
    const { source, ...candidate } = result;
    return this.present(candidate, source);
  }
}
