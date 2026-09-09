import Database from 'better-sqlite3';
import { Problem } from '../domain/types.js';

export interface IProblemRepository {
  findAll(): Problem[];
  findById(id: string): Problem | null;
  findBySlug(slug: string): Problem | null;
  save(problem: Problem): void;
}

export class SqliteProblemRepository implements IProblemRepository {
  constructor(private db: Database.Database) {}

  public findAll(): Problem[] {
    const stmt = this.db.prepare(`
      SELECT id, slug, title, difficulty, description, requirements, constraints, evaluation_rubric, starter_templates, created_at
      FROM problems
      ORDER BY title ASC
    `);
    const rows = stmt.all() as any[];
    return rows.map(this.mapRowToProblem);
  }

  public findById(id: string): Problem | null {
    const stmt = this.db.prepare(`
      SELECT id, slug, title, difficulty, description, requirements, constraints, evaluation_rubric, starter_templates, created_at
      FROM problems
      WHERE id = ? OR slug = ?
    `);
    const row = stmt.get(id, id) as any;
    if (!row) return null;
    return this.mapRowToProblem(row);
  }

  public findBySlug(slug: string): Problem | null {
    const stmt = this.db.prepare(`
      SELECT id, slug, title, difficulty, description, requirements, constraints, evaluation_rubric, starter_templates, created_at
      FROM problems
      WHERE slug = ?
    `);
    const row = stmt.get(slug) as any;
    if (!row) return null;
    return this.mapRowToProblem(row);
  }

  public save(problem: Problem): void {
    const stmt = this.db.prepare(`
      INSERT INTO problems (id, slug, title, difficulty, description, requirements, constraints, evaluation_rubric, starter_templates)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        title = excluded.title,
        difficulty = excluded.difficulty,
        description = excluded.description,
        requirements = excluded.requirements,
        constraints = excluded.constraints,
        evaluation_rubric = excluded.evaluation_rubric,
        starter_templates = excluded.starter_templates
    `);

    stmt.run(
      problem.id,
      problem.slug,
      problem.title,
      problem.difficulty,
      problem.description,
      JSON.stringify(problem.requirements),
      JSON.stringify(problem.constraints),
      JSON.stringify(problem.evaluationRubric),
      problem.starterTemplates ? JSON.stringify(problem.starterTemplates) : null
    );
  }

  private mapRowToProblem(row: any): Problem {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      difficulty: row.difficulty,
      description: row.description,
      requirements: JSON.parse(row.requirements || '[]'),
      constraints: JSON.parse(row.constraints || '[]'),
      evaluationRubric: JSON.parse(row.evaluation_rubric || '[]'),
      starterTemplates: row.starter_templates ? JSON.parse(row.starter_templates) : undefined,
      createdAt: row.created_at
    };
  }
}
