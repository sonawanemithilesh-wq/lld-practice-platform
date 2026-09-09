import React from 'react';
import { Submission } from '../types';
import { StatusBadge, FormatBadge } from './Badge';
import { ArrowUpRight } from 'lucide-react';

interface AttemptHistoryProps {
  attempts: Submission[];
  onSelectAttempt: (submissionId: string) => void;
  isLoading?: boolean;
}

export function AttemptHistory({ attempts, onSelectAttempt, isLoading }: AttemptHistoryProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
        ))}
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-xl border border-dashed border-white/15 text-zinc-400 font-mono">
        <p className="text-xs text-zinc-300">NO PRIOR SUBMISSIONS RECORDED</p>
        <p className="text-[11px] text-zinc-400 mt-1">Submit your first architectural model to start tracking rubric progress.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {attempts.map((att, idx) => {
        const score = att.feedback?.overallScore;
        const dateStr = new Date(att.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        return (
          <div
            key={att.id}
            onClick={() => onSelectAttempt(att.id)}
            className="group p-3.5 rounded-xl bg-black border border-white/15 hover:border-white/50 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-400">
                #{String(attempts.length - idx).padStart(2, '0')}
              </span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={att.status} />
                  <FormatBadge format={att.format} />
                </div>
                <div className="text-[11px] font-mono text-zinc-400">
                  {dateStr}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {score !== undefined ? (
                <div className="text-right font-mono">
                  <span className="text-base font-bold text-white">{score}</span>
                  <span className="text-xs text-zinc-400">/100</span>
                </div>
              ) : (
                <span className="text-xs font-mono text-zinc-400">EVALUATING</span>
              )}

              <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
