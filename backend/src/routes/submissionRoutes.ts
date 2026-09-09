import { Router } from 'express';
import { SubmissionController } from '../controllers/SubmissionController.js';

export function createSubmissionRoutes(submissionController: SubmissionController): Router {
  const router = Router();

  router.post('/', submissionController.submitAttempt);
  router.get('/:id', submissionController.getSubmissionById);

  return router;
}
