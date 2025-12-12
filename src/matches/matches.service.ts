import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { type CreateMatchDto, type MatchesQueryDto, type UpdateMatchDto } from './dto/match.dto';
import { Match, type MatchDocument } from './match.schema';

import type { PaginatedResult } from '@/common/dtos/pagination.dto';
import { type RecordStatus } from '@/common/schema/provenance.schema';


@Injectable()
export class MatchesService {
  constructor(@InjectModel(Match.name) private readonly matchModel: Model<MatchDocument>) {}

  async create(dto: CreateMatchDto): Promise<MatchDocument> {
    return this.matchModel.create({
      competitionId: new Types.ObjectId(dto.competitionId),
      season: dto.season,
      round: dto.round,
      date: new Date(dto.date),
      venue: dto.venue,
      homeClubId: new Types.ObjectId(dto.homeClubId),
      awayClubId: new Types.ObjectId(dto.awayClubId),
      homeScore: dto.homeScore ?? 0,
      awayScore: dto.awayScore ?? 0,
      status: dto.status ?? 'scheduled',
      homeLineup: {
        starters: dto.homeLineup?.starters?.map((id) => new Types.ObjectId(id)) ?? [],
        substitutes: dto.homeLineup?.substitutes?.map((id) => new Types.ObjectId(id)) ?? [],
      },
      awayLineup: {
        starters: dto.awayLineup?.starters?.map((id) => new Types.ObjectId(id)) ?? [],
        substitutes: dto.awayLineup?.substitutes?.map((id) => new Types.ObjectId(id)) ?? [],
      },
      events:
        dto.events?.map((e) => ({
          type: e.type,
          minute: e.minute,
          playerId: e.playerId ? new Types.ObjectId(e.playerId) : undefined,
          relatedPlayerId: e.relatedPlayerId ? new Types.ObjectId(e.relatedPlayerId) : undefined,
          note: e.note,
        })) ?? [],
      provenance: {
        sources: [{ provider: 'manual', url: dto.sourceUrl, fetchedAt: new Date() }],
        status: 'pending',
      },
    });
  }

  async findById(id: string): Promise<MatchDocument> {
    const doc = await this.matchModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Match not found');
    }
    return doc;
  }

  async list(query: MatchesQueryDto): Promise<PaginatedResult<MatchDocument>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.competitionId) filter.competitionId = new Types.ObjectId(query.competitionId);
    if (query.season) filter.season = query.season;
    if (query.clubId) {
      const clubObjectId = new Types.ObjectId(query.clubId);
      filter.$or = [{ homeClubId: clubObjectId }, { awayClubId: clubObjectId }];
    }
    if (query.from || query.to) {
      filter.date = {};
      if (query.from) filter.date.$gte = new Date(query.from);
      if (query.to) filter.date.$lte = new Date(query.to);
    }

    const [items, total] = await Promise.all([
      this.matchModel.find(filter).sort({ date: -1 }).skip(skip).limit(limit).exec(),
      this.matchModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async update(id: string, dto: UpdateMatchDto): Promise<MatchDocument> {
    const match = await this.findById(id);

    if (dto.round !== undefined) match.round = dto.round;
    if (dto.date !== undefined) match.date = new Date(dto.date);
    if (dto.venue !== undefined) match.venue = dto.venue;
    if (dto.homeScore !== undefined) match.homeScore = dto.homeScore;
    if (dto.awayScore !== undefined) match.awayScore = dto.awayScore;
    if (dto.status !== undefined) match.status = dto.status;

    if (dto.homeLineup)
      match.homeLineup = {
        starters: dto.homeLineup.starters?.map((id) => new Types.ObjectId(id)) ?? [],
        substitutes: dto.homeLineup.substitutes?.map((id) => new Types.ObjectId(id)) ?? [],
      };

    if (dto.awayLineup)
      match.awayLineup = {
        starters: dto.awayLineup.starters?.map((id) => new Types.ObjectId(id)) ?? [],
        substitutes: dto.awayLineup.substitutes?.map((id) => new Types.ObjectId(id)) ?? [],
      };

    if (dto.events)
      match.events = dto.events.map((e) => ({
        type: e.type,
        minute: e.minute,
        playerId: e.playerId ? new Types.ObjectId(e.playerId) : undefined,
        relatedPlayerId: e.relatedPlayerId ? new Types.ObjectId(e.relatedPlayerId) : undefined,
        note: e.note,
      }));

    if (dto.sourceUrl) {
      match.provenance.sources = [
        ...match.provenance.sources,
        { provider: 'manual', url: dto.sourceUrl, fetchedAt: new Date() },
      ];
    }

    await match.save();
    return match;
  }

  async verify(id: string, status: RecordStatus = 'verified'): Promise<MatchDocument> {
    const match = await this.findById(id);
    match.provenance.status = status;
    match.provenance.lastVerifiedAt = new Date();
    match.provenance.sources = match.provenance.sources.map((s) => ({
      ...s,
      lastVerifiedAt: s.lastVerifiedAt ?? match.provenance.lastVerifiedAt,
    }));
    await match.save();
    return match;
  }
}
