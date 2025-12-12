import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { parse } from 'csv-parse/sync';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';

import { IngestionRun, type IngestionRunDocument } from './ingestion-run.schema';

import { Club, type ClubDocument } from '@/clubs/club.schema';
import { getErrorMessage } from '@/common/utils/error.util';
import { News, type NewsDocument } from '@/news/news.schema';
import { Player, type PlayerDocument } from '@/players/player.schema';
import { Transfer, type TransferDocument } from '@/transfers/transfer.schema';


export type IngestionResult = {
  runId: string;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

type CsvRow = Record<string, string | undefined>;

@Injectable()
export class IngestionService {
  constructor(
    @InjectModel(IngestionRun.name) private readonly runModel: Model<IngestionRunDocument>,
    @InjectModel(Player.name) private readonly playerModel: Model<PlayerDocument>,
    @InjectModel(Club.name) private readonly clubModel: Model<ClubDocument>,
    @InjectModel(Transfer.name) private readonly transferModel: Model<TransferDocument>,
    @InjectModel(News.name) private readonly newsModel: Model<NewsDocument>,
  ) {}

  private parseCsv(buffer: Buffer): CsvRow[] {
    const text = buffer.toString('utf-8');
    return parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as CsvRow[];
  }

  private toSlug(value: string): string {
    return slugify(value, { lower: true, strict: true, trim: true });
  }

  private splitList(value?: string): string[] {
    if (!value) return [];
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  async importPlayersCsv(params: {
    buffer: Buffer;
    sourceName: string;
    sourceUrl?: string;
  }): Promise<IngestionResult> {
    const run = await this.runModel.create({
      kind: 'csv-players',
      sourceName: params.sourceName,
      sourceUrl: params.sourceUrl,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    });

    const rows = this.parseCsv(params.buffer);

    for (const [idx, row] of rows.entries()) {
      const name = row.name?.trim();
      if (!name) {
        run.skipped += 1;
        continue;
      }

      const slug = this.toSlug(name);
      const externalId = row.externalId?.trim();
      const dob = row.dateOfBirth ? new Date(row.dateOfBirth) : undefined;

      const query = externalId
        ? { 'provenance.sources.externalId': externalId }
        : dob
          ? { slug, dateOfBirth: dob }
          : { slug };

      const existing = await this.playerModel.findOne(query).exec();

      const source = {
        provider: params.sourceName,
        url: params.sourceUrl ?? row.sourceUrl,
        externalId,
        fetchedAt: new Date(),
        confidence: 0.7,
      };

      const nationality = this.splitList(row.nationality);
      const positions = this.splitList(row.positions);
      const aliases = this.splitList(row.aliases);

      if (!existing) {
        try {
          await this.playerModel.create({
            name,
            fullName: row.fullName,
            slug,
            aliases,
            nationality,
            dateOfBirth: dob,
            positions,
            provenance: { sources: [source], status: 'pending' },
          });
          run.created += 1;
        } catch (e: unknown) {
          run.errors.push(`Row ${idx + 1}: ${getErrorMessage(e)}`);
        }
        continue;
      }

      existing.fullName = existing.fullName ?? row.fullName;
      existing.dateOfBirth = existing.dateOfBirth ?? dob;
      existing.aliases = Array.from(new Set([...(existing.aliases ?? []), ...aliases]));
      existing.nationality = Array.from(new Set([...(existing.nationality ?? []), ...nationality]));
      existing.positions = Array.from(new Set([...(existing.positions ?? []), ...positions]));
      existing.provenance.sources = [...(existing.provenance.sources ?? []), source];

      try {
        await existing.save();
        run.updated += 1;
      } catch (e: unknown) {
        run.errors.push(`Row ${idx + 1}: ${getErrorMessage(e)}`);
      }
    }

    await run.save();
    return {
      runId: run._id.toString(),
      created: run.created,
      updated: run.updated,
      skipped: run.skipped,
      errors: run.errors,
    };
  }

  async importClubsCsv(params: {
    buffer: Buffer;
    sourceName: string;
    sourceUrl?: string;
  }): Promise<IngestionResult> {
    const run = await this.runModel.create({
      kind: 'csv-clubs',
      sourceName: params.sourceName,
      sourceUrl: params.sourceUrl,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    });

    const rows = this.parseCsv(params.buffer);

    for (const [idx, row] of rows.entries()) {
      const name = row.name?.trim();
      const country = row.country?.trim();
      if (!name || !country) {
        run.skipped += 1;
        continue;
      }

      const slug = this.toSlug(name);
      const query = { slug, country };
      const existing = await this.clubModel.findOne(query).exec();

      const source = {
        provider: params.sourceName,
        url: params.sourceUrl ?? row.sourceUrl,
        externalId: row.externalId,
        fetchedAt: new Date(),
        confidence: 0.7,
      };

      const aliases = this.splitList(row.aliases);
      const honors = this.splitList(row.honors);

      if (!existing) {
        try {
          await this.clubModel.create({
            name,
            slug,
            country,
            city: row.city,
            foundedYear: row.foundedYear ? Number(row.foundedYear) : undefined,
            stadium: {
              name: row.stadiumName,
              capacity: row.stadiumCapacity ? Number(row.stadiumCapacity) : undefined,
            },
            aliases,
            honors,
            provenance: { sources: [source], status: 'pending' },
          });
          run.created += 1;
        } catch (e: unknown) {
          run.errors.push(`Row ${idx + 1}: ${getErrorMessage(e)}`);
        }
        continue;
      }

      existing.city = existing.city ?? row.city;
      existing.foundedYear =
        existing.foundedYear ?? (row.foundedYear ? Number(row.foundedYear) : undefined);
      existing.stadium = existing.stadium ?? {
        name: row.stadiumName,
        capacity: row.stadiumCapacity ? Number(row.stadiumCapacity) : undefined,
      };

      existing.aliases = Array.from(new Set([...(existing.aliases ?? []), ...aliases]));
      existing.honors = Array.from(new Set([...(existing.honors ?? []), ...honors]));
      existing.provenance.sources = [...(existing.provenance.sources ?? []), source];

      try {
        await existing.save();
        run.updated += 1;
      } catch (e: unknown) {
        run.errors.push(`Row ${idx + 1}: ${getErrorMessage(e)}`);
      }
    }

    await run.save();
    return {
      runId: run._id.toString(),
      created: run.created,
      updated: run.updated,
      skipped: run.skipped,
      errors: run.errors,
    };
  }

  private async findOrCreateClubByName(name: string, country = 'Uzbekistan') {
    const slug = this.toSlug(name);
    const existing = await this.clubModel.findOne({ slug, country }).exec();
    if (existing) return existing;

    return this.clubModel.create({
      name,
      slug,
      country,
      provenance: {
        sources: [{ provider: 'derived', fetchedAt: new Date(), confidence: 0.4 }],
        status: 'pending',
      },
    });
  }

  private async findOrCreatePlayerByName(name: string) {
    const slug = this.toSlug(name);
    const existing = await this.playerModel.findOne({ slug }).exec();
    if (existing) return existing;

    return this.playerModel.create({
      name,
      slug,
      provenance: {
        sources: [{ provider: 'derived', fetchedAt: new Date(), confidence: 0.4 }],
        status: 'pending',
      },
    });
  }

  async importTransfersCsv(params: {
    buffer: Buffer;
    sourceName: string;
    sourceUrl?: string;
  }): Promise<IngestionResult> {
    const run = await this.runModel.create({
      kind: 'csv-transfers',
      sourceName: params.sourceName,
      sourceUrl: params.sourceUrl,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    });

    const rows = this.parseCsv(params.buffer);

    for (const [idx, row] of rows.entries()) {
      const playerName = row.playerName?.trim();
      const date = row.date ? new Date(row.date) : undefined;

      if (!playerName || !date) {
        run.skipped += 1;
        continue;
      }

      try {
        const player = await this.findOrCreatePlayerByName(playerName);
        const fromClub = row.fromClubName ? await this.findOrCreateClubByName(row.fromClubName) : undefined;
        const toClub = row.toClubName ? await this.findOrCreateClubByName(row.toClubName) : undefined;

        // very simple dedupe: same player + date + from/to
        const exists = await this.transferModel
          .exists({
            playerId: player._id,
            date,
            fromClubId: fromClub?._id,
            toClubId: toClub?._id,
          })
          .exec();

        if (exists) {
          run.skipped += 1;
          continue;
        }

        await this.transferModel.create({
          playerId: player._id,
          fromClubId: fromClub?._id,
          toClubId: toClub?._id,
          date,
          fee: row.fee ? Number(row.fee) : undefined,
          currency: row.currency ?? 'EUR',
          isLoan: row.isLoan === 'true' || row.isLoan === '1',
          provenance: {
            sources: [
              {
                provider: params.sourceName,
                url: params.sourceUrl ?? row.sourceUrl,
                externalId: row.externalId,
                fetchedAt: new Date(),
                confidence: 0.6,
              },
            ],
            status: 'pending',
          },
        });

        run.created += 1;
      } catch (e: unknown) {
        run.errors.push(`Row ${idx + 1}: ${getErrorMessage(e)}`);
      }
    }

    await run.save();
    return {
      runId: run._id.toString(),
      created: run.created,
      updated: run.updated,
      skipped: run.skipped,
      errors: run.errors,
    };
  }

  async importNewsCsv(params: { buffer: Buffer; sourceName: string; sourceUrl?: string }): Promise<IngestionResult> {
    const run = await this.runModel.create({
      kind: 'csv-news',
      sourceName: params.sourceName,
      sourceUrl: params.sourceUrl,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    });

    const rows = this.parseCsv(params.buffer);

    for (const [idx, row] of rows.entries()) {
      const title = row.title?.trim();
      const body = row.body?.trim();
      const publishedAt = row.publishedAt ? new Date(row.publishedAt) : undefined;

      if (!title || !body || !publishedAt) {
        run.skipped += 1;
        continue;
      }

      const slug = this.toSlug(title).slice(0, 80);

      try {
        const exists = await this.newsModel.exists({ slug }).exec();
        if (exists) {
          run.skipped += 1;
          continue;
        }

        await this.newsModel.create({
          title,
          body,
          slug,
          publishedAt,
          sourceName: row.sourceName ?? params.sourceName,
          sourceUrl: row.sourceUrl ?? params.sourceUrl,
          language: row.language ?? 'en',
          tags: this.splitList(row.tags),
          relatedPlayerIds: [],
          relatedClubIds: [],
          provenance: {
            sources: [
              {
                provider: params.sourceName,
                url: row.sourceUrl ?? params.sourceUrl,
                externalId: row.externalId,
                fetchedAt: new Date(),
                confidence: 0.6,
              },
            ],
            status: 'pending',
          },
        });

        run.created += 1;
      } catch (e: unknown) {
        run.errors.push(`Row ${idx + 1}: ${getErrorMessage(e)}`);
      }
    }

    await run.save();
    return {
      runId: run._id.toString(),
      created: run.created,
      updated: run.updated,
      skipped: run.skipped,
      errors: run.errors,
    };
  }

  async recentRuns(limit = 20): Promise<IngestionRunDocument[]> {
    return this.runModel.find().sort({ createdAt: -1 }).limit(limit).exec();
  }

  async getRun(id: string): Promise<IngestionRunDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.runModel.findById(id).exec();
  }
}
