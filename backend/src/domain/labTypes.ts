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
