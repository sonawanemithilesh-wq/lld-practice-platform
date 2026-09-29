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
  attemptCount?: number;
  bestScore?: number | null;
  createdAt?: string;
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

export interface LabHint {
  id: string;
  trigger: string;
  text: string;
}

export interface LabReference {
  title: string;
  url: string;
}

export interface LabPrerequisites {
  knowledge?: string[];
  system?: string[];
  keys?: string[];
}

export interface Lab {
  id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: number;
  estimatedTimeMinutes: number;
  format: string;
  tags: string[];
  learningObjectives: string[];
  prerequisites?: LabPrerequisites;
  hints: LabHint[];
  references: LabReference[];
  instructions: string;
  targetUrl: string;
  collectorUrl: string;
  readyCheckUrl: string;
  ports: {
    target: number;
    collector: number;
    readyz: number;
  };
  proofToken: string;
  status: 'not_started' | 'starting' | 'ready' | 'stopped';
  proved: boolean;
}

export interface LabValidationResult {
  ok: boolean;
  passed: boolean;
  output: string;
  details?: Record<string, unknown>;
}
