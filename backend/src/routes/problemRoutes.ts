import { Router } from 'express';
import { ProblemController } from '../controllers/ProblemController.js';

export function createProblemRoutes(problemController: ProblemController): Router {
  const router = Router();

  router.get('/', problemController.getAllProblems);
  router.get('/:id', problemController.getProblemById);
  router.get('/:id/attempts', problemController.getProblemAttempts);

  return router;
}
