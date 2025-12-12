import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';

import { Competition, type CompetitionDocument } from './competition.schema';
import {
  type CompetitionsQueryDto,
  type CreateCompetitionDto,
  type UpdateCompetitionDto,
} from './dto/competition.dto';

import type { PaginatedResult } from '@/common/dtos/pagination.dto';
import { type RecordStatus } from '@/common/schema/provenance.schema';


@Injectable()
export class CompetitionsService {
  constructor(
    @InjectModel(Competition.name) private readonly competitionModel: Model<CompetitionDocument>,
  ) {}

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name, { lower: true, strict: true, trim: true });
    let slug = base;

    for (let i = 0; i < 20; i += 1) {
      const exists = await this.competitionModel.exists({ slug });
      if (!exists) {
        return slug;
      }
      slug = `${base}-${i + 2}`;
    }

    return `${base}-${new Types.ObjectId().toString().slice(-6)}`;
  }

  async create(dto: CreateCompetitionDto): Promise<CompetitionDocument> {
    const slug = await this.generateUniqueSlug(dto.name);

    return this.competitionModel.create({
      name: dto.name,
      slug,
      type: dto.type,
      country: dto.country,
      region: dto.region ?? 'Central Asia',
      seasons:
        dto.seasons?.map((s) => ({
          season: s.season,
          startDate: s.startDate ? new Date(s.startDate) : undefined,
          endDate: s.endDate ? new Date(s.endDate) : undefined,
          table:
            s.table?.map((r) => ({
              clubId: new Types.ObjectId(r.clubId),
              position: r.position,
              played: r.played ?? 0,
              won: r.won ?? 0,
              drawn: r.drawn ?? 0,
              lost: r.lost ?? 0,
              goalsFor: r.goalsFor ?? 0,
              goalsAgainst: r.goalsAgainst ?? 0,
              points: r.points ?? 0,
            })) ?? [],
        })) ?? [],
      provenance: {
        sources: [{ provider: 'manual', url: dto.sourceUrl, fetchedAt: new Date() }],
        status: 'pending',
      },
    });
  }

  async findById(id: string): Promise<CompetitionDocument> {
    const doc = await this.competitionModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Competition not found');
    }
    return doc;
  }

  async list(query: CompetitionsQueryDto): Promise<PaginatedResult<CompetitionDocument>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.country) filter.country = query.country;
    if (query.type) filter.type = query.type;

    const mongoFilter = query.q ? { ...filter, $text: { $search: query.q } } : filter;

    const [items, total] = await Promise.all([
      this.competitionModel
        .find(mongoFilter)
        .sort(query.q ? { score: { $meta: 'textScore' } } : { country: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.competitionModel.countDocuments(mongoFilter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async update(id: string, dto: UpdateCompetitionDto): Promise<CompetitionDocument> {
    const competition = await this.findById(id);

    if (dto.name && dto.name !== competition.name) {
      competition.name = dto.name;
      competition.slug = await this.generateUniqueSlug(dto.name);
    }

    if (dto.type !== undefined) competition.type = dto.type;
    if (dto.country !== undefined) competition.country = dto.country;
    if (dto.region !== undefined) competition.region = dto.region;

    if (dto.seasons)
      competition.seasons = dto.seasons.map((s) => ({
        season: s.season,
        startDate: s.startDate ? new Date(s.startDate) : undefined,
        endDate: s.endDate ? new Date(s.endDate) : undefined,
        table:
          s.table?.map((r) => ({
            clubId: new Types.ObjectId(r.clubId),
            position: r.position,
            played: r.played ?? 0,
            won: r.won ?? 0,
            drawn: r.drawn ?? 0,
            lost: r.lost ?? 0,
            goalsFor: r.goalsFor ?? 0,
            goalsAgainst: r.goalsAgainst ?? 0,
            points: r.points ?? 0,
          })) ?? [],
      }));

    if (dto.sourceUrl) {
      competition.provenance.sources = [
        ...competition.provenance.sources,
        { provider: 'manual', url: dto.sourceUrl, fetchedAt: new Date() },
      ];
    }

    await competition.save();
    return competition;
  }

  async verify(id: string, status: RecordStatus = 'verified'): Promise<CompetitionDocument> {
    const competition = await this.findById(id);
    competition.provenance.status = status;
    competition.provenance.lastVerifiedAt = new Date();
    competition.provenance.sources = competition.provenance.sources.map((s) => ({
      ...s,
      lastVerifiedAt: s.lastVerifiedAt ?? competition.provenance.lastVerifiedAt,
    }));
    await competition.save();
    return competition;
  }
}
