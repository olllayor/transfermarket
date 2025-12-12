import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';

import type { PaginatedResult } from '@/common/dtos/pagination.dto';
import { type RecordStatus } from '@/common/schema/provenance.schema';

import { News, type NewsDocument } from '@/news/news.schema';
import { Transfer, type TransferDocument } from '@/transfers/transfer.schema';

import { Player, type PlayerDocument } from './player.schema';
import { type CreatePlayerDto, type PlayersQueryDto, type UpdatePlayerDto } from './dto/player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectModel(Player.name) private readonly playerModel: Model<PlayerDocument>,
    @InjectModel(Transfer.name) private readonly transferModel: Model<TransferDocument>,
    @InjectModel(News.name) private readonly newsModel: Model<NewsDocument>,
  ) {}

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name, { lower: true, strict: true, trim: true });
    let slug = base;

    for (let i = 0; i < 20; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await this.playerModel.exists({ slug });
      if (!exists) {
        return slug;
      }
      slug = `${base}-${i + 2}`;
    }

    return `${base}-${new Types.ObjectId().toString().slice(-6)}`;
  }

  async create(dto: CreatePlayerDto): Promise<PlayerDocument> {
    const slug = await this.generateUniqueSlug(dto.name);

    return this.playerModel.create({
      name: dto.name,
      fullName: dto.fullName,
      slug,
      aliases: dto.aliases ?? [],
      nationality: dto.nationality ?? [],
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      positions: dto.positions ?? [],
      preferredFoot: dto.preferredFoot,
      heightCm: dto.heightCm,
      currentClubId: dto.currentClubId ? new Types.ObjectId(dto.currentClubId) : undefined,
      marketValueHistory:
        dto.marketValueHistory?.map((p) => ({
          date: new Date(p.date),
          value: p.value,
          currency: p.currency ?? 'EUR',
        })) ?? [],
      contractHistory:
        dto.contractHistory?.map((c) => ({
          clubId: new Types.ObjectId(c.clubId),
          startDate: new Date(c.startDate),
          endDate: c.endDate ? new Date(c.endDate) : undefined,
          details: c.details,
        })) ?? [],
      stats:
        dto.stats?.map((s) => ({
          season: s.season,
          competitionId: new Types.ObjectId(s.competitionId),
          appearances: s.appearances ?? 0,
          goals: s.goals ?? 0,
          assists: s.assists ?? 0,
        })) ?? [],
      provenance: {
        sources: [
          {
            provider: 'manual',
            url: dto.sourceUrl,
            fetchedAt: new Date(),
          },
        ],
        status: 'pending',
      },
    });
  }

  async findById(id: string): Promise<PlayerDocument> {
    const doc = await this.playerModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Player not found');
    }
    return doc;
  }

  async getProfile(id: string): Promise<{
    player: PlayerDocument;
    transfers: TransferDocument[];
    news: NewsDocument[];
  }> {
    const player = await this.findById(id);

    const [transfers, news] = await Promise.all([
      this.transferModel.find({ playerId: player._id }).sort({ date: -1 }).limit(200).exec(),
      this.newsModel
        .find({ relatedPlayerIds: player._id })
        .sort({ publishedAt: -1 })
        .limit(50)
        .exec(),
    ]);

    return { player, transfers, news };
  }

  async list(query: PlayersQueryDto): Promise<PaginatedResult<PlayerDocument>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.clubId) {
      filter.currentClubId = new Types.ObjectId(query.clubId);
    }
    if (query.nationality?.length) {
      filter.nationality = { $in: query.nationality };
    }

    const mongoQuery = this.playerModel
      .find(query.q ? { ...filter, $text: { $search: query.q } } : filter)
      .sort(query.q ? { score: { $meta: 'textScore' } } : { name: 1 })
      .skip(skip)
      .limit(limit);

    const [items, total] = await Promise.all([
      mongoQuery.exec(),
      this.playerModel
        .countDocuments(query.q ? { ...filter, $text: { $search: query.q } } : filter)
        .exec(),
    ]);

    return { items, total, page, limit };
  }

  async update(id: string, dto: UpdatePlayerDto): Promise<PlayerDocument> {
    const player = await this.findById(id);

    if (dto.name && dto.name !== player.name) {
      player.name = dto.name;
      player.slug = await this.generateUniqueSlug(dto.name);
    }

    if (dto.fullName !== undefined) player.fullName = dto.fullName;
    if (dto.aliases) player.aliases = dto.aliases;
    if (dto.nationality) player.nationality = dto.nationality;
    if (dto.dateOfBirth !== undefined)
      player.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined;
    if (dto.positions) player.positions = dto.positions;
    if (dto.preferredFoot !== undefined) player.preferredFoot = dto.preferredFoot;
    if (dto.heightCm !== undefined) player.heightCm = dto.heightCm;
    if (dto.currentClubId !== undefined)
      player.currentClubId = dto.currentClubId ? new Types.ObjectId(dto.currentClubId) : undefined;

    if (dto.marketValueHistory)
      player.marketValueHistory = dto.marketValueHistory.map((p) => ({
        date: new Date(p.date),
        value: p.value,
        currency: p.currency ?? 'EUR',
      }));

    if (dto.contractHistory)
      player.contractHistory = dto.contractHistory.map((c) => ({
        clubId: new Types.ObjectId(c.clubId),
        startDate: new Date(c.startDate),
        endDate: c.endDate ? new Date(c.endDate) : undefined,
        details: c.details,
      }));

    if (dto.stats)
      player.stats = dto.stats.map((s) => ({
        season: s.season,
        competitionId: new Types.ObjectId(s.competitionId),
        appearances: s.appearances ?? 0,
        goals: s.goals ?? 0,
        assists: s.assists ?? 0,
      }));

    if (dto.sourceUrl) {
      player.provenance.sources = [
        ...player.provenance.sources,
        { provider: 'manual', url: dto.sourceUrl, fetchedAt: new Date() },
      ];
    }

    await player.save();
    return player;
  }

  async verify(id: string, status: RecordStatus = 'verified'): Promise<PlayerDocument> {
    const player = await this.findById(id);
    player.provenance.status = status;
    player.provenance.lastVerifiedAt = new Date();
    player.provenance.sources = player.provenance.sources.map((s) => ({
      ...s,
      lastVerifiedAt: s.lastVerifiedAt ?? player.provenance.lastVerifiedAt,
    }));
    await player.save();
    return player;
  }

  async merge(fromId: string, intoId: string): Promise<PlayerDocument> {
    if (fromId === intoId) {
      return this.findById(intoId);
    }

    const [from, into] = await Promise.all([this.findById(fromId), this.findById(intoId)]);

    into.aliases = Array.from(new Set([...(into.aliases ?? []), from.name, ...(from.aliases ?? [])]));
    into.nationality = Array.from(new Set([...(into.nationality ?? []), ...(from.nationality ?? [])]));
    into.positions = Array.from(new Set([...(into.positions ?? []), ...(from.positions ?? [])]));

    into.fullName = into.fullName ?? from.fullName;
    into.dateOfBirth = into.dateOfBirth ?? from.dateOfBirth;
    into.preferredFoot = into.preferredFoot ?? from.preferredFoot;
    into.heightCm = into.heightCm ?? from.heightCm;
    into.currentClubId = into.currentClubId ?? from.currentClubId;

    into.marketValueHistory = [...(into.marketValueHistory ?? []), ...(from.marketValueHistory ?? [])].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    into.contractHistory = [...(into.contractHistory ?? []), ...(from.contractHistory ?? [])].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime(),
    );

    into.stats = [...(into.stats ?? []), ...(from.stats ?? [])];

    into.provenance.sources = [...(into.provenance.sources ?? []), ...(from.provenance.sources ?? [])];

    await Promise.all([
      this.transferModel.updateMany({ playerId: from._id }, { $set: { playerId: into._id } }).exec(),
      this.newsModel
        .updateMany({ relatedPlayerIds: from._id }, { $addToSet: { relatedPlayerIds: into._id } })
        .exec(),
      this.newsModel.updateMany({ relatedPlayerIds: from._id }, { $pull: { relatedPlayerIds: from._id } }).exec(),
    ]);

    await into.save();
    await from.deleteOne();

    return into;
  }
}
