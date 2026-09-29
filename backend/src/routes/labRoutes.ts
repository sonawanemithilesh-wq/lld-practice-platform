import { Router } from 'express';
import { LabController } from '../controllers/LabController.js';

export function createLabRoutes(controller: LabController): Router {
  const router = Router();

  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.get('/:id/status', controller.getStatus);
  router.post('/:id/start', controller.start);
  router.post('/:id/stop', controller.stop);
  router.post('/:id/reset', controller.reset);
  router.post('/:id/validate', controller.validate);

  return router;
}
