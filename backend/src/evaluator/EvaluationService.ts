import { v4 as uuidv4 } from 'uuid';
import {
  Submission,
  SubmissionFormat,
  SubmissionStatus,
  Problem,
  Feedback
} from '../domain/types.js';
import { IProblemRepository } from '../repositories/ProblemRepository.js';
import { ISubmissionRepository } from '../repositories/SubmissionRepository.js';
import { IFeedbackRepository } from '../repositories/FeedbackRepository.js';
import { DeterministicValidator } from './DeterministicValidator.js';
import { IEvaluator } from './IEvaluator.js';

export interface SubmitRequest {
  problemId: string;
  solutionContent: string;
  format: SubmissionFormat;
  language?: string;
  userId?: string;
  guestId?: string;
}

export class EvaluationService {
  constructor(
    private problemRepo: IProblemRepository,
    private submissionRepo: ISubmissionRepository,
    private feedbackRepo: IFeedbackRepository,
    private validator: DeterministicValidator,
    private evaluator: IEvaluator
  ) {}

  /**
   * Creates a new submission in PENDING state and processes evaluation through the pipeline.
   */
  public async submitAndEvaluate(request: SubmitRequest): Promise<Submission> {
    const problem = this.problemRepo.findById(request.problemId);
    if (!problem) {
      throw new Error(`Problem not found with ID: ${request.problemId}`);
    }

    const submissionId = uuidv4();
    const submission = this.submissionRepo.create({
      id: submissionId,
      problemId: problem.id,
      userId: request.userId,
      guestId: request.guestId || 'guest_user',
      solutionContent: request.solutionContent,
      format: request.format,
      language: request.language || (request.format === 'CODE' ? 'typescript' : 'text'),
      status: 'PENDING'
    });

    // Execute evaluation lifecycle
    return await this.evaluateSubmission(submission, problem);
  }

  /**
   * Orchestrates the evaluation lifecycle:
   * PENDING -> EVALUATING -> Validator -> Evaluator -> COMPLETED or FAILED
   */
  public async evaluateSubmission(submission: Submission, problem: Problem): Promise<Submission> {
    try {
      // Transition to EVALUATING
      this.submissionRepo.updateStatus(submission.id, 'EVALUATING');

      // Step 1: Run Deterministic Sanity & Structural Checks
      const validationResult = this.validator.validate(submission, problem);
      if (!validationResult.isValid) {
        const errorMessage = validationResult.errors.join(' ');
        this.submissionRepo.updateStatus(submission.id, 'FAILED', errorMessage);

        // Store failure feedback so the user gets actionable guidance
        const failureFeedback: Feedback = {
          id: uuidv4(),
          submissionId: submission.id,
          overallScore: 0,
          criteriaScores: {
            solidPrinciples: 0,
            classResponsibilities: 0,
            extensibility: 0,
            edgeCases: 0
          },
          strengths: [],
          concerns: validationResult.errors,
          actionableSuggestions: [
            'Ensure your solution contains meaningful class/interface declarations and method definitions.',
            'Review the problem requirements and implement the primary domain entities.'
          ],
          summary: `Deterministic validation failed: ${errorMessage}`
        };
        this.feedbackRepo.save(failureFeedback);

        return this.submissionRepo.findById(submission.id)!;
      }

      // Step 2: Run Rubric Evaluator (LLM with fallback)
      const evaluationResult = await this.evaluator.evaluate(submission, problem);

      // Step 3: Persist Feedback
      const feedback: Feedback = {
        id: uuidv4(),
        submissionId: submission.id,
        overallScore: evaluationResult.overallScore,
        criteriaScores: evaluationResult.criteriaScores,
        strengths: evaluationResult.strengths,
        concerns: evaluationResult.concerns,
        actionableSuggestions: evaluationResult.actionableSuggestions,
        summary: evaluationResult.summary
      };
      this.feedbackRepo.save(feedback);

      // Step 4: Transition to COMPLETED
      this.submissionRepo.updateStatus(submission.id, 'COMPLETED');

      return this.submissionRepo.findById(submission.id)!;
    } catch (err: any) {
      console.error(`Evaluation failed for submission ${submission.id}:`, err);
      const errorMsg = err?.message || 'An unexpected error occurred during evaluation.';
      this.submissionRepo.updateStatus(submission.id, 'FAILED', errorMsg);
      return this.submissionRepo.findById(submission.id)!;
    }
  }
}
