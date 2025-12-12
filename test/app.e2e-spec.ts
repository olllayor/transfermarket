import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { AppModule } from '@/app.module';

describe('API (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();

    process.env.MONGODB_URI = mongo.getUri();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1d';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_PASSWORD = 'admin12345';
    process.env.USE_REDIS = 'false';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongo.stop();
  });

  it('GET /api/health', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('admin can login and create a player', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin12345' })
      .expect(201);

    const token: string = login.body.accessToken;
    expect(typeof token).toBe('string');

    const club = await request(app.getHttpServer())
      .post('/api/admin/clubs')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Pakhtakor Tashkent', country: 'Uzbekistan' })
      .expect(201);

    const player = await request(app.getHttpServer())
      .post('/api/admin/players')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Eldor Shomurodov',
        nationality: ['Uzbekistan'],
        positions: ['Forward'],
        currentClubId: club.body._id,
      })
      .expect(201);

    expect(player.body.name).toBe('Eldor Shomurodov');

    const list = await request(app.getHttpServer())
      .get('/api/players')
      .query({ q: 'Shomurodov' })
      .expect(200);

    expect(list.body.total).toBe(1);
  });
});
