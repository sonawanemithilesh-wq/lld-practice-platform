import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initSchema } from '../db/connection.js';
import { SqliteProblemRepository } from '../repositories/ProblemRepository.js';
import { SqliteSubmissionRepository } from '../repositories/SubmissionRepository.js';
import { SqliteFeedbackRepository } from '../repositories/FeedbackRepository.js';
import { DeterministicValidator } from '../evaluator/DeterministicValidator.js';
import { IEvaluator } from '../evaluator/IEvaluator.js';
import { EvaluationService } from '../evaluator/EvaluationService.js';
import { Problem, Submission, EvaluationResult } from '../domain/types.js';

describe('Submission Lifecycle & State Transitions', () => {
  let db: Database.Database;
  let problemRepo: SqliteProblemRepository;
  let submissionRepo: SqliteSubmissionRepository;
  let feedbackRepo: SqliteFeedbackRepository;
  let validator: DeterministicValidator;

  const sampleProblem: Problem = {
    id: 'test-prob-1',
    slug: 'test-parking-lot',
    title: 'Test Parking Lot',
    difficulty: 'Medium',
    description: 'Design a parking lot with spots',
    requirements: ['Support vehicle parking'],
    constraints: ['Max capacity 100'],
    evaluationRubric: [
      { key: 'solid', name: 'SOLID', maxScore: 25, description: 'Test' }
    ]
  };

  beforeEach(() => {
    db = new Database(':memory:');
    initSchema(db);
    feedbackRepo = new SqliteFeedbackRepository(db);
    problemRepo = new SqliteProblemRepository(db);
    submissionRepo = new SqliteSubmissionRepository(db, feedbackRepo);
    validator = new DeterministicValidator();

    problemRepo.save(sampleProblem);
  });

  it('successfully transitions from PENDING -> EVALUATING -> COMPLETED and persists feedback', async () => {
    const mockEvaluator: IEvaluator = {
      evaluate: async (sub: Submission, prob: Problem): Promise<EvaluationResult> => {
        return {
          overallScore: 88,
          criteriaScores: {
            solidPrinciples: 22,
            classResponsibilities: 22,
            extensibility: 22,
            edgeCases: 22
          },
          strengths: ['Great modularity', 'Clean interfaces'],
          concerns: ['Ensure thread-safety'],
          actionableSuggestions: ['Use ConcurrentHashMap'],
          summary: 'High quality solution.'
        };
      }
    };

    const service = new EvaluationService(
      problemRepo,
      submissionRepo,
      feedbackRepo,
      validator,
      mockEvaluator
    );

    const validCode = `
      public class ParkingLot {
        private List<ParkingSpot> spots = new ArrayList<>();
        public boolean park(Vehicle v) { return true; }
      }
    `;

    const result = await service.submitAndEvaluate({
      problemId: sampleProblem.id,
      solutionContent: validCode,
      format: 'CODE',
      language: 'java'
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.errorMessage).toBeNull();
    expect(result.feedback).toBeDefined();
    expect(result.feedback?.overallScore).toBe(88);
    expect(result.feedback?.strengths).toContain('Great modularity');

    // Confirm persisted state in DB
    const fetched = submissionRepo.findById(result.id);
    expect(fetched?.status).toBe('COMPLETED');
    expect(fetched?.feedback?.overallScore).toBe(88);
  });

  it('transitions to FAILED when deterministic validation fails (e.g. empty content)', async () => {
    const mockEvaluator: IEvaluator = {
      evaluate: async () => {
        throw new Error('Should not be called for invalid submission');
      }
    };

    const service = new EvaluationService(
      problemRepo,
      submissionRepo,
      feedbackRepo,
      validator,
      mockEvaluator
    );

    const result = await service.submitAndEvaluate({
      problemId: sampleProblem.id,
      solutionContent: '   ',
      format: 'CODE'
    });

    expect(result.status).toBe('FAILED');
    expect(result.errorMessage).toContain('Submission content cannot be empty');

    // Confirm failure feedback is generated
    const fetched = submissionRepo.findById(result.id);
    expect(fetched?.status).toBe('FAILED');
    expect(fetched?.feedback?.overallScore).toBe(0);
    expect(fetched?.feedback?.concerns.length).toBeGreaterThan(0);
  });

  it('transitions to FAILED without crashing when evaluator throws an error', async () => {
    const failingEvaluator: IEvaluator = {
      evaluate: async () => {
        throw new Error('Upstream LLM rate limit exceeded');
      }
    };

    const service = new EvaluationService(
      problemRepo,
      submissionRepo,
      feedbackRepo,
      validator,
      failingEvaluator
    );

    const validCode = `
      public class ParkingLot {
        private List<ParkingSpot> spots = new ArrayList<>();
      }
    `;

    const result = await service.submitAndEvaluate({
      problemId: sampleProblem.id,
      solutionContent: validCode,
      format: 'CODE'
    });

    expect(result.status).toBe('FAILED');
    expect(result.errorMessage).toBe('Upstream LLM rate limit exceeded');

    const fetched = submissionRepo.findById(result.id);
    expect(fetched?.status).toBe('FAILED');
    expect(fetched?.errorMessage).toBe('Upstream LLM rate limit exceeded');
  });
});
