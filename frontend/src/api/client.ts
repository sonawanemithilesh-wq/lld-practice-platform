import { Problem, Submission, SubmissionFormat, Lab, LabValidationResult } from '../types';

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

// Cybersecurity Labs API
export async function fetchLabs(): Promise<Lab[]> {
  const res = await fetch(`${API_BASE}/labs`);
  if (!res.ok) {
    throw new Error(`Failed to load labs: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function fetchLab(id: string): Promise<Lab> {
  const res = await fetch(`${API_BASE}/labs/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to load lab '${id}': HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function fetchLabStatus(
  id: string
): Promise<{ status: Lab['status']; proved: boolean; targetOnline: boolean }> {
  const res = await fetch(`${API_BASE}/labs/${id}/status`);
  if (!res.ok) {
    throw new Error(`Failed to fetch lab status for '${id}': HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function startLab(id: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/labs/${id}/start`, { method: 'POST' });
  const json = await res.json();
  return json;
}

export async function stopLab(id: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/labs/${id}/stop`, { method: 'POST' });
  const json = await res.json();
  return json;
}

export async function resetLab(id: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/labs/${id}/reset`, { method: 'POST' });
  const json = await res.json();
  return json;
}

export async function validateLab(id: string): Promise<LabValidationResult> {
  const res = await fetch(`${API_BASE}/labs/${id}/validate`, { method: 'POST' });
  const json = await res.json();
  return json;
}
