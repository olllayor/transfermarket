import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';

import type { PaginatedResult } from '@/common/dtos/pagination.dto';
import { type RecordStatus } from '@/common/schema/provenance.schema';

import { News, type NewsDocument } from './news.schema';
import { type CreateNewsDto, type NewsQueryDto, type UpdateNewsDto } from './dto/news.dto';

@Injectable()
export class NewsService {
  constructor(@InjectModel(News.name) private readonly newsModel: Model<NewsDocument>) {}

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugify(title, { lower: true, strict: true, trim: true }).slice(0, 80);
    let slug = base;

    for (let i = 0; i < 20; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await this.newsModel.exists({ slug });
      if (!exists) {
        return slug;
      }
      slug = `${base}-${i + 2}`;
    }

    return `${base}-${new Types.ObjectId().toString().slice(-6)}`;
  }

  async create(dto: CreateNewsDto): Promise<NewsDocument> {
    const slug = await this.generateUniqueSlug(dto.title);

    return this.newsModel.create({
      title: dto.title,
      body: dto.body,
      slug,
      publishedAt: new Date(dto.publishedAt),
      sourceName: dto.sourceName,
      sourceUrl: dto.sourceUrl,
      language: dto.language ?? 'en',
      tags: dto.tags ?? [],
      relatedPlayerIds: dto.relatedPlayerIds?.map((id) => new Types.ObjectId(id)) ?? [],
      relatedClubIds: dto.relatedClubIds?.map((id) => new Types.ObjectId(id)) ?? [],
      provenance: {
        sources: [{ provider: 'manual', url: dto.sourceUrl, fetchedAt: new Date() }],
        status: 'pending',
      },
    });
  }

  async findById(id: string): Promise<NewsDocument> {
    const doc = await this.newsModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('News not found');
    }
    return doc;
  }

  async list(query: NewsQueryDto): Promise<PaginatedResult<NewsDocument>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.language) filter.language = query.language;

    const mongoFilter = query.q ? { ...filter, $text: { $search: query.q } } : filter;

    const [items, total] = await Promise.all([
      this.newsModel
        .find(mongoFilter)
        .sort(query.q ? { score: { $meta: 'textScore' } } : { publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.newsModel.countDocuments(mongoFilter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async update(id: string, dto: UpdateNewsDto): Promise<NewsDocument> {
    const news = await this.findById(id);

    if (dto.title && dto.title !== news.title) {
      news.title = dto.title;
      news.slug = await this.generateUniqueSlug(dto.title);
    }

    if (dto.body !== undefined) news.body = dto.body;
    if (dto.publishedAt !== undefined) news.publishedAt = new Date(dto.publishedAt);
    if (dto.sourceName !== undefined) news.sourceName = dto.sourceName;
    if (dto.sourceUrl !== undefined) news.sourceUrl = dto.sourceUrl;
    if (dto.language !== undefined) news.language = dto.language;
    if (dto.tags) news.tags = dto.tags;
    if (dto.relatedPlayerIds)
      news.relatedPlayerIds = dto.relatedPlayerIds.map((id) => new Types.ObjectId(id));
    if (dto.relatedClubIds)
      news.relatedClubIds = dto.relatedClubIds.map((id) => new Types.ObjectId(id));

    await news.save();
    return news;
  }

  async verify(id: string, status: RecordStatus = 'verified'): Promise<NewsDocument> {
    const news = await this.findById(id);
    news.provenance.status = status;
    news.provenance.lastVerifiedAt = new Date();
    news.provenance.sources = news.provenance.sources.map((s) => ({
      ...s,
      lastVerifiedAt: s.lastVerifiedAt ?? news.provenance.lastVerifiedAt,
    }));
    await news.save();
    return news;
  }
}
