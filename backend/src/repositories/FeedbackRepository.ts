import Database from 'better-sqlite3';
import { Feedback } from '../domain/types.js';

export interface IFeedbackRepository {
  findBySubmissionId(submissionId: string): Feedback | null;
  save(feedback: Feedback): void;
}

export class SqliteFeedbackRepository implements IFeedbackRepository {
  constructor(private db: Database.Database) {}

  public findBySubmissionId(submissionId: string): Feedback | null {
    const stmt = this.db.prepare(`
      SELECT id, submission_id, overall_score, criteria_scores, strengths, concerns, actionable_suggestions, summary, created_at
      FROM feedbacks
      WHERE submission_id = ?
    `);
    const row = stmt.get(submissionId) as any;
    if (!row) return null;
    return this.mapRowToFeedback(row);
  }

  public save(feedback: Feedback): void {
    const stmt = this.db.prepare(`
      INSERT INTO feedbacks (id, submission_id, overall_score, criteria_scores, strengths, concerns, actionable_suggestions, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        overall_score = excluded.overall_score,
        criteria_scores = excluded.criteria_scores,
        strengths = excluded.strengths,
        concerns = excluded.concerns,
        actionable_suggestions = excluded.actionable_suggestions,
        summary = excluded.summary
    `);

    stmt.run(
      feedback.id,
      feedback.submissionId,
      feedback.overallScore,
      JSON.stringify(feedback.criteriaScores),
      JSON.stringify(feedback.strengths),
      JSON.stringify(feedback.concerns),
      JSON.stringify(feedback.actionableSuggestions),
      feedback.summary
    );
  }

  private mapRowToFeedback(row: any): Feedback {
    return {
      id: row.id,
      submissionId: row.submission_id,
      overallScore: row.overall_score,
      criteriaScores: JSON.parse(row.criteria_scores || '{}'),
      strengths: JSON.parse(row.strengths || '[]'),
      concerns: JSON.parse(row.concerns || '[]'),
      actionableSuggestions: JSON.parse(row.actionable_suggestions || '[]'),
      summary: row.summary,
      createdAt: row.created_at
    };
  }
}
