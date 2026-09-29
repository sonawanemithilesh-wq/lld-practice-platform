import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { initSchema } from '../db/connection.js';
import { createApp } from '../app.js';

describe('Cybersecurity Lab API Endpoints', () => {
  let db: Database.Database;
  let app: any;

  beforeEach(() => {
    db = new Database(':memory:');
    initSchema(db);
    app = createApp({ db });
  });

  it('GET /api/labs returns both registered cybersecurity labs', async () => {
    const res = await request(app).get('/api/labs');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);

    const ids = res.body.data.map((l: any) => l.id);
    expect(ids).toContain('020-xss-context-triage');
    expect(ids).toContain('021-sql-injection-auth-bypass');
  });

  it('GET /api/labs/020-xss-context-triage returns full XSS lab metadata and instructions', async () => {
    const res = await request(app).get('/api/labs/020-xss-context-triage');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('020-xss-context-triage');
    expect(res.body.data.title).toContain('XSS');
    expect(res.body.data.ports.target).toBe(9200);
    expect(res.body.data.ports.collector).toBe(9201);
    expect(res.body.data.instructions).toContain('Scenario');
  });

  it('GET /api/labs/021-sql-injection-auth-bypass returns full SQLi lab metadata and instructions', async () => {
    const res = await request(app).get('/api/labs/021-sql-injection-auth-bypass');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('021-sql-injection-auth-bypass');
    expect(res.body.data.title).toContain('SQL injection');
    expect(res.body.data.ports.target).toBe(9210);
    expect(res.body.data.ports.collector).toBe(9211);
    expect(res.body.data.instructions).toContain('Scenario');
  });

  it('GET /api/labs/nonexistent returns 404', async () => {
    const res = await request(app).get('/api/labs/nonexistent-xyz');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/labs/:id/status returns status structure', async () => {
    const res = await request(app).get('/api/labs/020-xss-context-triage/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data).toHaveProperty('proved');
    expect(res.body.data).toHaveProperty('targetOnline');
  });
});
