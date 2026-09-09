import { Problem, Submission, EvaluationResult } from '../domain/types.js';

export interface IEvaluator {
  evaluate(submission: Submission, problem: Problem): Promise<EvaluationResult>;
}
