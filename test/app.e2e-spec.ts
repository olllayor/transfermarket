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
    process.env.NODE_ENV = 'test';
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

  it('admin can create and query core entities', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin12345' })
      .expect(201);

    const token: string = login.body.accessToken;
    expect(typeof token).toBe('string');

    const competition = await request(app.getHttpServer())
      .post('/api/admin/competitions')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Uzbekistan Super League', type: 'league', country: 'Uzbekistan' })
      .expect(201);

    const club1 = await request(app.getHttpServer())
      .post('/api/admin/clubs')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Pakhtakor Tashkent', country: 'Uzbekistan', competitionId: competition.body._id })
      .expect(201);

    const club2 = await request(app.getHttpServer())
      .post('/api/admin/clubs')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'FC Nasaf', country: 'Uzbekistan', competitionId: competition.body._id })
      .expect(201);

    const player = await request(app.getHttpServer())
      .post('/api/admin/players')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Eldor Shomurodov',
        nationality: ['Uzbekistan'],
        positions: ['Forward'],
        currentClubId: club1.body._id,
      })
      .expect(201);

    const transfer = await request(app.getHttpServer())
      .post('/api/admin/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        playerId: player.body._id,
        fromClubId: club1.body._id,
        toClubId: club2.body._id,
        date: '2024-02-01',
        fee: 1000000,
        currency: 'EUR',
        isLoan: false,
      })
      .expect(201);

    const match = await request(app.getHttpServer())
      .post('/api/admin/matches')
      .set('Authorization', `Bearer ${token}`)
      .send({
        competitionId: competition.body._id,
        season: '2024',
        date: '2024-03-01T12:00:00.000Z',
        homeClubId: club1.body._id,
        awayClubId: club2.body._id,
        homeScore: 2,
        awayScore: 1,
        status: 'finished',
      })
      .expect(201);

    const news = await request(app.getHttpServer())
      .post('/api/admin/news')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Shomurodov scores again',
        body: 'A short match report about an Uzbek striker.',
        publishedAt: '2024-03-02T10:00:00.000Z',
        relatedPlayerIds: [player.body._id],
        relatedClubIds: [club1.body._id],
        tags: ['Uzbekistan', 'Player'],
      })
      .expect(201);

    expect(transfer.body.playerId).toBe(player.body._id);
    expect(match.body.competitionId).toBe(competition.body._id);
    expect(news.body.title).toBe('Shomurodov scores again');

    const playersSearch = await request(app.getHttpServer())
      .get('/api/players')
      .query({ q: 'Shomurodov' })
      .expect(200);
    expect(playersSearch.body.total).toBe(1);

    const clubsSearch = await request(app.getHttpServer())
      .get('/api/clubs')
      .query({ q: 'Pakhtakor' })
      .expect(200);
    expect(clubsSearch.body.total).toBe(1);

    const compsList = await request(app.getHttpServer())
      .get('/api/competitions')
      .query({ q: 'Super League' })
      .expect(200);
    expect(compsList.body.total).toBe(1);

    const transfersList = await request(app.getHttpServer())
      .get('/api/transfers')
      .query({ playerId: player.body._id })
      .expect(200);
    expect(transfersList.body.total).toBe(1);

    const matchesList = await request(app.getHttpServer())
      .get('/api/matches')
      .query({ competitionId: competition.body._id })
      .expect(200);
    expect(matchesList.body.total).toBe(1);

    const newsList = await request(app.getHttpServer())
      .get('/api/news')
      .query({ q: 'scores' })
      .expect(200);
    expect(newsList.body.total).toBe(1);

    const clubProfile = await request(app.getHttpServer())
      .get(`/api/clubs/${club1.body._id}/profile`)
      .expect(200);
    expect(clubProfile.body.squad.length).toBe(1);

    const playerProfile = await request(app.getHttpServer())
      .get(`/api/players/${player.body._id}/profile`)
      .expect(200);
    expect(playerProfile.body.transfers.length).toBe(1);
    expect(playerProfile.body.news.length).toBe(1);

    // ingestion (CSV) + dedupe
    const playersCsv =
      'name,fullName,dateOfBirth,nationality,positions,aliases,externalId,sourceUrl\n' +
      'Test Player,Test Player,2000-01-01,Uzbekistan,Forward,,test-player-1,https://example.com/test\n';

    await request(app.getHttpServer())
      .post('/api/admin/ingestion/csv/players')
      .set('Authorization', `Bearer ${token}`)
      .query({ sourceName: 'test-csv', sourceUrl: 'https://example.com/source' })
      .attach('file', Buffer.from(playersCsv, 'utf-8'), 'players.csv')
      .expect(201);

    const ingested = await request(app.getHttpServer())
      .get('/api/players')
      .query({ q: 'Test Player' })
      .expect(200);
    expect(ingested.body.total).toBe(1);
  });
});
