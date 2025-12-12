import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';

import { User, type UserDocument } from './user.schema';

import type { Role } from '@/common/decorators/roles.decorator';


const hashAsync = (password: string, saltRounds: number): Promise<string> =>
  new Promise((resolve, reject) => {
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err || !hash) {
        reject(err ?? new Error('Password hashing failed'));
        return;
      }
      resolve(hash);
    });
  });

const compareAsync = (password: string, hash: string): Promise<boolean> =>
  new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, same) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(Boolean(same));
    });
  });

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly config: ConfigService,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async createUser(params: {
    email: string;
    password: string;
    roles: Role[];
  }): Promise<UserDocument> {
    const existing = await this.findByEmail(params.email);
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await hashAsync(params.password, 10);
    return this.userModel.create({
      email: params.email.toLowerCase(),
      passwordHash,
      roles: params.roles,
    });
  }

  async validatePassword(user: UserDocument, password: string): Promise<boolean> {
    return compareAsync(password, user.passwordHash);
  }

  async ensureAdminFromEnv(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');

    if (!email || !password) {
      return;
    }

    const existing = await this.findByEmail(email);
    if (existing) {
      return;
    }

    await this.createUser({ email, password, roles: ['admin'] });
  }
}
