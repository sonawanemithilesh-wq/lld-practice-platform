import { Problem, Submission, SubmissionFormat } from '../types';

const API_BASE = '/api';

export async function fetchProblems(): Promise<Problem[]> {
  const res = await fetch(`${API_BASE}/problems`);
  if (!res.ok) {
    throw new Error(`Failed to load problems: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function fetchProblem(idOrSlug: string): Promise<Problem> {
  const res = await fetch(`${API_BASE}/problems/${idOrSlug}`);
  if (!res.ok) {
    throw new Error(`Failed to load problem '${idOrSlug}': HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function fetchProblemAttempts(idOrSlug: string): Promise<Submission[]> {
  const res = await fetch(`${API_BASE}/problems/${idOrSlug}/attempts`);
  if (!res.ok) {
    throw new Error(`Failed to load attempts: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function submitSolution(data: {
  problemId: string;
  solutionContent: string;
  format: SubmissionFormat;
  language?: string;
}): Promise<Submission> {
  const res = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Submission failed with HTTP ${res.status}`);
  }
  return json.data;
}

export async function fetchSubmission(submissionId: string): Promise<Submission> {
  const res = await fetch(`${API_BASE}/submissions/${submissionId}`);
  if (!res.ok) {
    throw new Error(`Failed to load submission: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}
