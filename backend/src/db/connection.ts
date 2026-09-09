import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance: Database.Database | null = null;

export function getDatabase(dbFilePath?: string): Database.Database {
  if (dbInstance && !dbFilePath) {
    return dbInstance;
  }

  const resolvedPath = dbFilePath || path.resolve(__dirname, '../../data/lld.db');
  const dataDir = path.dirname(resolvedPath);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initSchema(db);

  if (!dbFilePath) {
    dbInstance = db;
  }

  return db;
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS problems (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT NOT NULL,
      constraints TEXT NOT NULL,
      evaluation_rubric TEXT NOT NULL,
      starter_templates TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL,
      user_id TEXT,
      guest_id TEXT,
      solution_content TEXT NOT NULL,
      format TEXT NOT NULL,
      language TEXT,
      status TEXT NOT NULL,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id TEXT PRIMARY KEY,
      submission_id TEXT UNIQUE NOT NULL,
      overall_score INTEGER NOT NULL,
      criteria_scores TEXT NOT NULL,
      strengths TEXT NOT NULL,
      concerns TEXT NOT NULL,
      actionable_suggestions TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
  `);
}
