import Database from 'better-sqlite3';
import { Submission, SubmissionStatus } from '../domain/types.js';
import { IFeedbackRepository } from './FeedbackRepository.js';

export interface ISubmissionRepository {
  findById(id: string): Submission | null;
  findByProblemId(problemId: string): Submission[];
  create(submission: Omit<Submission, 'createdAt' | 'updatedAt'>): Submission;
  updateStatus(id: string, status: SubmissionStatus, errorMessage?: string | null): void;
}

export class SqliteSubmissionRepository implements ISubmissionRepository {
  constructor(
    private db: Database.Database,
    private feedbackRepo: IFeedbackRepository
  ) {}

  public findById(id: string): Submission | null {
    const stmt = this.db.prepare(`
      SELECT id, problem_id, user_id, guest_id, solution_content, format, language, status, error_message, created_at, updated_at
      FROM submissions
      WHERE id = ?
    `);
    const row = stmt.get(id) as any;
    if (!row) return null;

    const submission = this.mapRowToSubmission(row);
    submission.feedback = this.feedbackRepo.findBySubmissionId(submission.id);
    return submission;
  }

  public findByProblemId(problemId: string): Submission[] {
    const stmt = this.db.prepare(`
      SELECT id, problem_id, user_id, guest_id, solution_content, format, language, status, error_message, created_at, updated_at
      FROM submissions
      WHERE problem_id = ?
      ORDER BY datetime(created_at) DESC
    `);
    const rows = stmt.all(problemId) as any[];

    return rows.map((row) => {
      const submission = this.mapRowToSubmission(row);
      submission.feedback = this.feedbackRepo.findBySubmissionId(submission.id);
      return submission;
    });
  }

  public create(data: Omit<Submission, 'createdAt' | 'updatedAt'>): Submission {
    const stmt = this.db.prepare(`
      INSERT INTO submissions (id, problem_id, user_id, guest_id, solution_content, format, language, status, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.id,
      data.problemId,
      data.userId || null,
      data.guestId || null,
      data.solutionContent,
      data.format,
      data.language || 'typescript',
      data.status,
      data.errorMessage || null
    );

    return this.findById(data.id)!;
  }

  public updateStatus(id: string, status: SubmissionStatus, errorMessage?: string | null): void {
    const stmt = this.db.prepare(`
      UPDATE submissions
      SET status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, errorMessage || null, id);
  }

  private mapRowToSubmission(row: any): Submission {
    return {
      id: row.id,
      problemId: row.problem_id,
      userId: row.user_id,
      guestId: row.guest_id,
      solutionContent: row.solution_content,
      format: row.format,
      language: row.language,
      status: row.status,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
