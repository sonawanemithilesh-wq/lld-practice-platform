import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import { getDatabase } from './db/connection.js';
import { SqliteProblemRepository } from './repositories/ProblemRepository.js';
import { SqliteFeedbackRepository } from './repositories/FeedbackRepository.js';
import { SqliteSubmissionRepository } from './repositories/SubmissionRepository.js';
import { DeterministicValidator } from './evaluator/DeterministicValidator.js';
import { LLMEvaluator } from './evaluator/LLMEvaluator.js';
import { IEvaluator } from './evaluator/IEvaluator.js';
import { EvaluationService } from './evaluator/EvaluationService.js';
import { ProblemController } from './controllers/ProblemController.js';
import { SubmissionController } from './controllers/SubmissionController.js';
import { createProblemRoutes } from './routes/problemRoutes.js';
import { createSubmissionRoutes } from './routes/submissionRoutes.js';

dotenv.config();

export interface AppDependencies {
  db?: Database.Database;
  evaluator?: IEvaluator;
}

export function createApp(deps?: AppDependencies): Express {
  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  // Dependency Injection setup
  const db = deps?.db || getDatabase();
  const problemRepo = new SqliteProblemRepository(db);
  const feedbackRepo = new SqliteFeedbackRepository(db);
  const submissionRepo = new SqliteSubmissionRepository(db, feedbackRepo);

  const validator = new DeterministicValidator();
  const evaluator = deps?.evaluator || new LLMEvaluator();
  const evaluationService = new EvaluationService(
    problemRepo,
    submissionRepo,
    feedbackRepo,
    validator,
    evaluator
  );

  const problemController = new ProblemController(problemRepo, submissionRepo);
  const submissionController = new SubmissionController(submissionRepo, evaluationService);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount API routers
  app.use('/api/problems', createProblemRoutes(problemController));
  app.use('/api/submissions', createSubmissionRoutes(submissionController));

  return app;
}
