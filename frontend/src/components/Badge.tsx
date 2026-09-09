import React from 'react';
import { Difficulty, SubmissionStatus, SubmissionFormat } from '../types';

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const styles: Record<Difficulty, string> = {
    Easy: 'border-white/30 text-white/90 bg-white/5',
    Medium: 'border-white/50 text-white bg-white/10 font-semibold',
    Hard: 'border-white text-black bg-white font-bold'
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-0.5 rounded-full text-[11px] uppercase tracking-wider font-mono border ${
        styles[difficulty] || styles.Medium
      }`}
    >
      {difficulty}
    </span>
  );
}

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const styles: Record<SubmissionStatus, { border: string; bg: string; text: string; label: string }> = {
    PENDING: { border: 'border-white/20', bg: 'bg-white/5', text: 'text-zinc-400', label: 'PENDING' },
    EVALUATING: { border: 'border-white/60', bg: 'bg-white/10 animate-pulse', text: 'text-white font-semibold', label: 'EVALUATING...' },
    COMPLETED: { border: 'border-white', bg: 'bg-white', text: 'text-black font-semibold', label: 'COMPLETED' },
    FAILED: { border: 'border-red-500/50', bg: 'bg-red-500/10', text: 'text-red-400', label: 'FAILED' }
  };

  const current = styles[status] || styles.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono tracking-wider border ${current.border} ${current.bg} ${current.text}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {current.label}
    </span>
  );
}

export function FormatBadge({ format }: { format: SubmissionFormat }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-zinc-900 text-zinc-300 border border-white/15">
      {format}
    </span>
  );
}
