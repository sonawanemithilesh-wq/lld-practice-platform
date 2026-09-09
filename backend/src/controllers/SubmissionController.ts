import { Request, Response } from 'express';
import { ISubmissionRepository } from '../repositories/SubmissionRepository.js';
import { EvaluationService } from '../evaluator/EvaluationService.js';
import { SubmissionFormat } from '../domain/types.js';

export class SubmissionController {
  constructor(
    private submissionRepo: ISubmissionRepository,
    private evaluationService: EvaluationService
  ) {}

  public submitAttempt = async (req: Request, res: Response): Promise<void> => {
    try {
      const { problemId, solutionContent, format, language, userId, guestId } = req.body;

      if (!problemId) {
        res.status(400).json({
          success: false,
          error: 'Field "problemId" is required.'
        });
        return;
      }

      if (solutionContent === undefined || solutionContent === null) {
        res.status(400).json({
          success: false,
          error: 'Field "solutionContent" is required.'
        });
        return;
      }

      const validFormats: SubmissionFormat[] = ['CODE', 'TEXT'];
      const submissionFormat: SubmissionFormat = validFormats.includes(format?.toUpperCase())
        ? (format.toUpperCase() as SubmissionFormat)
        : 'CODE';

      const evaluatedSubmission = await this.evaluationService.submitAndEvaluate({
        problemId,
        solutionContent: String(solutionContent),
        format: submissionFormat,
        language: language || (submissionFormat === 'CODE' ? 'typescript' : 'text'),
        userId,
        guestId
      });

      res.status(201).json({
        success: true,
        data: evaluatedSubmission
      });
    } catch (error: any) {
      console.error('Submission error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process submission'
      });
    }
  };

  public getSubmissionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const submission = this.submissionRepo.findById(id);

      if (!submission) {
        res.status(404).json({
          success: false,
          error: `Submission not found with ID '${id}'`
        });
        return;
      }

      res.json({
        success: true,
        data: submission
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch submission'
      });
    }
  };
}
