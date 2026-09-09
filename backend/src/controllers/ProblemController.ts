import { Request, Response } from 'express';
import { IProblemRepository } from '../repositories/ProblemRepository.js';
import { ISubmissionRepository } from '../repositories/SubmissionRepository.js';

export class ProblemController {
  constructor(
    private problemRepo: IProblemRepository,
    private submissionRepo: ISubmissionRepository
  ) {}

  public getAllProblems = async (req: Request, res: Response): Promise<void> => {
    try {
      const problems = this.problemRepo.findAll();

      // Enrich with attempt metrics
      const enriched = problems.map((problem) => {
        const attempts = this.submissionRepo.findByProblemId(problem.id);
        const bestScore = attempts.reduce((max, att) => {
          const score = att.feedback?.overallScore || 0;
          return score > max ? score : max;
        }, 0);

        return {
          ...problem,
          attemptCount: attempts.length,
          bestScore: attempts.length > 0 ? bestScore : null
        };
      });

      res.json({
        success: true,
        data: enriched
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch problems'
      });
    }
  };

  public getProblemById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const problem = this.problemRepo.findById(id);

      if (!problem) {
        res.status(404).json({
          success: false,
          error: `Problem not found with identifier '${id}'`
        });
        return;
      }

      const attempts = this.submissionRepo.findByProblemId(problem.id);

      res.json({
        success: true,
        data: {
          ...problem,
          attemptCount: attempts.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch problem details'
      });
    }
  };

  public getProblemAttempts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const problem = this.problemRepo.findById(id);

      if (!problem) {
        res.status(404).json({
          success: false,
          error: `Problem not found with identifier '${id}'`
        });
        return;
      }

      const attempts = this.submissionRepo.findByProblemId(problem.id);

      res.json({
        success: true,
        data: attempts
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch attempts for problem'
      });
    }
  };
}
