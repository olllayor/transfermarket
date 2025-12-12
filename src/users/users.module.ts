import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './user.schema';
import { UsersService } from './users.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule implements OnApplicationBootstrap {
  constructor(private readonly users: UsersService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.users.ensureAdminFromEnv();
  }
}
