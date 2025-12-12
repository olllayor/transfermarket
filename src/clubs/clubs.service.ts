import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';

import type { PaginatedResult } from '@/common/dtos/pagination.dto';
import { type RecordStatus } from '@/common/schema/provenance.schema';
import { Match, type MatchDocument } from '@/matches/match.schema';
import { Player, type PlayerDocument } from '@/players/player.schema';
import { Transfer, type TransferDocument } from '@/transfers/transfer.schema';

import { Club, type ClubDocument } from './club.schema';
import { type ClubsQueryDto, type CreateClubDto, type UpdateClubDto } from './dto/club.dto';

@Injectable()
export class ClubsService {
  constructor(
    @InjectModel(Club.name) private readonly clubModel: Model<ClubDocument>,
    @InjectModel(Player.name) private readonly playerModel: Model<PlayerDocument>,
    @InjectModel(Transfer.name) private readonly transferModel: Model<TransferDocument>,
    @InjectModel(Match.name) private readonly matchModel: Model<MatchDocument>,
  ) {}

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name, { lower: true, strict: true, trim: true });
    let slug = base;

    for (let i = 0; i < 20; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await this.clubModel.exists({ slug });
      if (!exists) {
        return slug;
      }
      slug = `${base}-${i + 2}`;
    }

    return `${base}-${new Types.ObjectId().toString().slice(-6)}`;
  }

  async create(dto: CreateClubDto): Promise<ClubDocument> {
    const slug = await this.generateUniqueSlug(dto.name);
    return this.clubModel.create({
      name: dto.name,
      slug,
      country: dto.country,
      city: dto.city,
      foundedYear: dto.foundedYear,
      competitionId: dto.competitionId ? new Types.ObjectId(dto.competitionId) : undefined,
      stadium: dto.stadium,
      aliases: dto.aliases ?? [],
      honors: dto.honors ?? [],
      provenance: {
        sources: [{ provider: 'manual', url: dto.sourceUrl, fetchedAt: new Date() }],
        status: 'pending',
      },
    });
  }

  async findById(id: string): Promise<ClubDocument> {
    const doc = await this.clubModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Club not found');
    }
    return doc;
  }

  async getProfile(id: string): Promise<{
    club: ClubDocument;
    squad: PlayerDocument[];
    transfersIn: TransferDocument[];
    transfersOut: TransferDocument[];
    recentMatches: MatchDocument[];
  }> {
    const club = await this.findById(id);

    const [squad, transfersIn, transfersOut, recentMatches] = await Promise.all([
      this.playerModel.find({ currentClubId: club._id }).sort({ name: 1 }).limit(60).exec(),
      this.transferModel.find({ toClubId: club._id }).sort({ date: -1 }).limit(200).exec(),
      this.transferModel.find({ fromClubId: club._id }).sort({ date: -1 }).limit(200).exec(),
      this.matchModel
        .find({ $or: [{ homeClubId: club._id }, { awayClubId: club._id }] })
        .sort({ date: -1 })
        .limit(50)
        .exec(),
    ]);

    return { club, squad, transfersIn, transfersOut, recentMatches };
  }

  async list(query: ClubsQueryDto): Promise<PaginatedResult<ClubDocument>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.country) {
      filter.country = query.country;
    }

    const mongoFilter = query.q ? { ...filter, $text: { $search: query.q } } : filter;

    const [items, total] = await Promise.all([
      this.clubModel
        .find(mongoFilter)
        .sort(query.q ? { score: { $meta: 'textScore' } } : { name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.clubModel.countDocuments(mongoFilter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async update(id: string, dto: UpdateClubDto): Promise<ClubDocument> {
    const club = await this.findById(id);

    if (dto.name && dto.name !== club.name) {
      club.name = dto.name;
      club.slug = await this.generateUniqueSlug(dto.name);
    }

    if (dto.country !== undefined) club.country = dto.country;
    if (dto.city !== undefined) club.city = dto.city;
    if (dto.foundedYear !== undefined) club.foundedYear = dto.foundedYear;
    if (dto.stadium !== undefined) club.stadium = dto.stadium;
    if (dto.competitionId !== undefined)
      club.competitionId = dto.competitionId ? new Types.ObjectId(dto.competitionId) : undefined;
    if (dto.aliases) club.aliases = dto.aliases;
    if (dto.honors) club.honors = dto.honors;

    if (dto.sourceUrl) {
      club.provenance.sources = [
        ...club.provenance.sources,
        { provider: 'manual', url: dto.sourceUrl, fetchedAt: new Date() },
      ];
    }

    await club.save();
    return club;
  }

  async verify(id: string, status: RecordStatus = 'verified'): Promise<ClubDocument> {
    const club = await this.findById(id);
    club.provenance.status = status;
    club.provenance.lastVerifiedAt = new Date();
    club.provenance.sources = club.provenance.sources.map((s) => ({
      ...s,
      lastVerifiedAt: s.lastVerifiedAt ?? club.provenance.lastVerifiedAt,
    }));
    await club.save();
    return club;
  }

  async merge(fromId: string, intoId: string): Promise<ClubDocument> {
    if (fromId === intoId) {
      return this.findById(intoId);
    }

    const [from, into] = await Promise.all([this.findById(fromId), this.findById(intoId)]);

    into.aliases = Array.from(new Set([...(into.aliases ?? []), from.name, ...(from.aliases ?? [])]));
    into.honors = Array.from(new Set([...(into.honors ?? []), ...(from.honors ?? [])]));

    into.city = into.city ?? from.city;
    into.foundedYear = into.foundedYear ?? from.foundedYear;
    into.stadium = into.stadium ?? from.stadium;
    into.competitionId = into.competitionId ?? from.competitionId;

    into.provenance.sources = [...(into.provenance.sources ?? []), ...(from.provenance.sources ?? [])];

    const fromObjectId = from._id as Types.ObjectId;
    const intoObjectId = into._id as Types.ObjectId;

    await Promise.all([
      this.playerModel
        .updateMany({ currentClubId: fromObjectId }, { $set: { currentClubId: intoObjectId } })
        .exec(),
      this.transferModel
        .updateMany({ fromClubId: fromObjectId }, { $set: { fromClubId: intoObjectId } })
        .exec(),
      this.transferModel
        .updateMany({ toClubId: fromObjectId }, { $set: { toClubId: intoObjectId } })
        .exec(),
      this.matchModel
        .updateMany({ homeClubId: fromObjectId }, { $set: { homeClubId: intoObjectId } })
        .exec(),
      this.matchModel
        .updateMany({ awayClubId: fromObjectId }, { $set: { awayClubId: intoObjectId } })
        .exec(),
    ]);

    await into.save();
    await from.deleteOne();

    return into;
  }
}
