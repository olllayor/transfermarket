import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import type { PaginatedResult } from '@/common/dtos/pagination.dto';
import { type RecordStatus } from '@/common/schema/provenance.schema';

import { Transfer, type TransferDocument } from './transfer.schema';
import { type CreateTransferDto, type TransfersQueryDto, type UpdateTransferDto } from './dto/transfer.dto';

@Injectable()
export class TransfersService {
  constructor(@InjectModel(Transfer.name) private readonly transferModel: Model<TransferDocument>) {}

  async create(dto: CreateTransferDto): Promise<TransferDocument> {
    return this.transferModel.create({
      playerId: new Types.ObjectId(dto.playerId),
      fromClubId: dto.fromClubId ? new Types.ObjectId(dto.fromClubId) : undefined,
      toClubId: dto.toClubId ? new Types.ObjectId(dto.toClubId) : undefined,
      date: new Date(dto.date),
      fee: dto.fee,
      currency: dto.currency ?? 'EUR',
      isLoan: dto.isLoan ?? false,
      contractUntil: dto.contractUntil ? new Date(dto.contractUntil) : undefined,
      provenance: {
        sources: [{ provider: 'manual', url: dto.sourceUrl, fetchedAt: new Date() }],
        status: 'pending',
      },
    });
  }

  async findById(id: string): Promise<TransferDocument> {
    const doc = await this.transferModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Transfer not found');
    }
    return doc;
  }

  async list(query: TransfersQueryDto): Promise<PaginatedResult<TransferDocument>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.playerId) filter.playerId = new Types.ObjectId(query.playerId);
    if (query.clubId) {
      const clubObjectId = new Types.ObjectId(query.clubId);
      filter.$or = [{ fromClubId: clubObjectId }, { toClubId: clubObjectId }];
    }
    if (query.from || query.to) {
      filter.date = {};
      if (query.from) filter.date.$gte = new Date(query.from);
      if (query.to) filter.date.$lte = new Date(query.to);
    }

    const [items, total] = await Promise.all([
      this.transferModel.find(filter).sort({ date: -1 }).skip(skip).limit(limit).exec(),
      this.transferModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async update(id: string, dto: UpdateTransferDto): Promise<TransferDocument> {
    const transfer = await this.findById(id);

    if (dto.date !== undefined) transfer.date = new Date(dto.date);
    if (dto.fee !== undefined) transfer.fee = dto.fee;
    if (dto.currency !== undefined) transfer.currency = dto.currency;
    if (dto.isLoan !== undefined) transfer.isLoan = dto.isLoan;
    if (dto.contractUntil !== undefined)
      transfer.contractUntil = dto.contractUntil ? new Date(dto.contractUntil) : undefined;

    if (dto.sourceUrl) {
      transfer.provenance.sources = [
        ...transfer.provenance.sources,
        { provider: 'manual', url: dto.sourceUrl, fetchedAt: new Date() },
      ];
    }

    await transfer.save();
    return transfer;
  }

  async verify(id: string, status: RecordStatus = 'verified'): Promise<TransferDocument> {
    const transfer = await this.findById(id);
    transfer.provenance.status = status;
    transfer.provenance.lastVerifiedAt = new Date();
    transfer.provenance.sources = transfer.provenance.sources.map((s) => ({
      ...s,
      lastVerifiedAt: s.lastVerifiedAt ?? transfer.provenance.lastVerifiedAt,
    }));
    await transfer.save();
    return transfer;
  }
}
