import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { initSchema } from '../db/connection.js';
import { createApp } from '../app.js';
import { seededProblems } from '../seed/seedProblems.js';
import { SqliteProblemRepository } from '../repositories/ProblemRepository.js';

describe('REST API Endpoints', () => {
  let db: Database.Database;
  let app: any;

  beforeEach(() => {
    db = new Database(':memory:');
    initSchema(db);

    const problemRepo = new SqliteProblemRepository(db);
    for (const prob of seededProblems) {
      problemRepo.save(prob);
    }

    app = createApp({ db });
  });

  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/problems returns all seeded problems', async () => {
    const res = await request(app).get('/api/problems');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(3);
    expect(res.body.data[0]).toHaveProperty('title');
    expect(res.body.data[0]).toHaveProperty('difficulty');
  });

  it('GET /api/problems/:id returns specific problem by ID or slug', async () => {
    const res = await request(app).get('/api/problems/parking-lot');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe('parking-lot');
    expect(res.body.data.requirements.length).toBeGreaterThan(0);
    expect(res.body.data.constraints.length).toBeGreaterThan(0);
    expect(res.body.data.evaluationRubric.length).toBeGreaterThan(0);
  });

  it('GET /api/problems/:id returns 404 for nonexistent problem', async () => {
    const res = await request(app).get('/api/problems/nonexistent-xyz');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/submissions submits solution, evaluates it and returns feedback', async () => {
    const validSolution = `
      public class ParkingLot {
        private List<ParkingSpot> spots = new ArrayList<>();
        public Ticket park(Vehicle v) { return new Ticket(); }
      }
    `;

    const res = await request(app)
      .post('/api/submissions')
      .send({
        problemId: 'prob-parking-lot',
        solutionContent: validSolution,
        format: 'CODE',
        language: 'java'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.feedback).toBeDefined();
    expect(res.body.data.feedback.overallScore).toBeGreaterThan(0);
    expect(res.body.data.feedback.criteriaScores.solidPrinciples).toBeGreaterThan(0);

    const submissionId = res.body.data.id;

    // Verify GET /api/submissions/:id
    const getSubRes = await request(app).get(`/api/submissions/${submissionId}`);
    expect(getSubRes.status).toBe(200);
    expect(getSubRes.body.data.id).toBe(submissionId);
    expect(getSubRes.body.data.feedback).toBeDefined();

    // Verify GET /api/problems/:id/attempts
    const getAttemptsRes = await request(app).get('/api/problems/prob-parking-lot/attempts');
    expect(getAttemptsRes.status).toBe(200);
    expect(getAttemptsRes.body.data.length).toBe(1);
    expect(getAttemptsRes.body.data[0].id).toBe(submissionId);
  });
});
