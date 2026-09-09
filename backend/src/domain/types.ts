export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type SubmissionFormat = 'CODE' | 'TEXT';

export type SubmissionStatus = 'PENDING' | 'EVALUATING' | 'COMPLETED' | 'FAILED';

export interface RubricCriterion {
  key: string;
  name: string;
  maxScore: number;
  description: string;
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  description: string;
  requirements: string[];
  constraints: string[];
  evaluationRubric: RubricCriterion[];
  starterTemplates?: Record<string, string>;
  createdAt?: string;
}

export interface Submission {
  id: string;
  problemId: string;
  userId?: string;
  guestId?: string;
  solutionContent: string;
  format: SubmissionFormat;
  language?: string;
  status: SubmissionStatus;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  feedback?: Feedback | null;
}

export interface CriteriaScores {
  solidPrinciples: number; // out of 25
  classResponsibilities: number; // out of 25
  extensibility: number; // out of 25
  edgeCases: number; // out of 25
}

export interface Feedback {
  id: string;
  submissionId: string;
  overallScore: number; // out of 100
  criteriaScores: CriteriaScores;
  strengths: string[];
  concerns: string[];
  actionableSuggestions: string[];
  summary: string;
  createdAt?: string;
}

export interface EvaluationResult {
  overallScore: number;
  criteriaScores: CriteriaScores;
  strengths: string[];
  concerns: string[];
  actionableSuggestions: string[];
  summary: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
