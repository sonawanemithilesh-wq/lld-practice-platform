import React, { useState } from 'react';
import { Submission, Problem } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import { RubricBreakdown } from '../components/RubricBreakdown';
import { StatusBadge, FormatBadge } from '../components/Badge';
import { ArrowLeft, Copy, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface FeedbackPageProps {
  submission: Submission;
  problem: Problem;
  onRefineDesign: (solutionContent: string, format: string, language?: string) => void;
  onBackToProblem: () => void;
  onBackToCatalogue: () => void;
}

export function FeedbackPage({
  submission,
  problem,
  onRefineDesign,
  onBackToProblem,
  onBackToCatalogue
}: FeedbackPageProps) {
  const [copied, setCopied] = useState(false);
  const [isSolutionExpanded, setIsSolutionExpanded] = useState(true);

  const feedback = submission.feedback;
  const isCompleted = submission.status === 'COMPLETED';
  const isFailed = submission.status === 'FAILED';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(submission.solutionContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pt-28 pb-20 max-w-5xl mx-auto px-5 sm:px-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-white/10">
        <button
          onClick={onBackToProblem}
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Workspace</span>
        </button>

        <button
          onClick={() =>
            onRefineDesign(
              submission.solutionContent,
              submission.format,
              submission.language
            )
          }
          className="inline-flex items-center gap-2 bg-white text-black hover:bg-zinc-200 transition-colors rounded-full px-5 py-2 text-xs font-medium uppercase tracking-wider"
        >
          <span>Iterate Design (New Attempt)</span>
          <span className="text-[14px] leading-none">✳︎</span>
        </button>
      </div>

      {/* Header Card / Scorecard */}
      <div className="p-8 rounded-2xl bg-black border border-white/15 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              AUDIT RECORD //
            </span>
            <StatusBadge status={submission.status} />
            <FormatBadge format={submission.format} />
          </div>

          <h1
            style={{ fontFamily: 'var(--font-heading)' }}
            className="text-2xl sm:text-3xl font-normal text-white mb-2 tracking-tight"
          >
            {problem.title}
          </h1>

          <div className="text-xs font-mono text-zinc-400">
            TIMESTAMP: {new Date(submission.createdAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'medium'
            })}
          </div>
        </div>

        {isCompleted && feedback && (
          <div className="md:border-l md:border-white/10 md:pl-8 flex items-center justify-center">
            <ScoreGauge score={feedback.overallScore} />
          </div>
        )}
      </div>

      {/* Failure Notification if FAILED */}
      {isFailed && (
        <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/5 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-red-400 mb-1">
                Deterministic Validation Notice
              </h3>
              <p className="text-xs text-zinc-300 mb-2 leading-relaxed">
                {submission.errorMessage ||
                  'The submission did not pass structural sanity checks.'}
              </p>
              <div className="text-[11px] font-mono text-zinc-400">
                Ensure your design includes concrete class or interface declarations and domain methods.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {feedback?.summary && (
        <div className="p-6 rounded-2xl bg-black border border-white/15 mb-8">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">
            // ARCHITECTURE EXECUTIVE SUMMARY
          </div>
          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal">
            {feedback.summary}
          </p>
        </div>
      )}

      {/* Rubric Breakdown */}
      {feedback && (
        <div className="mb-8">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-3">
            // RUBRIC BREAKDOWN (4 PILLARS)
          </div>
          <RubricBreakdown scores={feedback.criteriaScores} />
        </div>
      )}

      {/* Strengths, Concerns, Suggestions callouts with monochrome borders */}
      {feedback && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Strengths */}
          <div className="border border-white/20 rounded-xl p-5 bg-white/5 flex flex-col">
            <div className="text-xs font-mono uppercase tracking-widest text-white font-bold mb-3 flex items-center justify-between">
              <span>STRENGTHS</span>
              <span className="text-[10px] text-zinc-400 font-normal">
                ({feedback.strengths.length})
              </span>
            </div>
            <ul className="space-y-3 text-xs text-zinc-300 font-normal">
              {feedback.strengths.length === 0 ? (
                <li className="text-zinc-500 italic">No specific strengths recorded.</li>
              ) : (
                feedback.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-white select-none">↳</span>
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Concerns / Code Smells */}
          <div className="border border-white/20 rounded-xl p-5 bg-white/5 flex flex-col">
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold mb-3 flex items-center justify-between">
              <span>CODE SMELLS & GAPS</span>
              <span className="text-[10px] text-zinc-400 font-normal">
                ({feedback.concerns.length})
              </span>
            </div>
            <ul className="space-y-3 text-xs text-zinc-300 font-normal">
              {feedback.concerns.length === 0 ? (
                <li className="text-zinc-500 italic">No critical code smells flagged.</li>
              ) : (
                feedback.concerns.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-zinc-400 select-none">↳</span>
                    <span className="leading-relaxed">{c}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Concrete Actionable Suggestions */}
          <div className="border border-white/20 rounded-xl p-5 bg-white/5 flex flex-col">
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold mb-3 flex items-center justify-between">
              <span>SUGGESTED REFACTORINGS</span>
              <span className="text-[10px] text-zinc-400 font-normal">
                ({feedback.actionableSuggestions.length})
              </span>
            </div>
            <ul className="space-y-3 text-xs text-zinc-300 font-normal">
              {feedback.actionableSuggestions.length === 0 ? (
                <li className="text-zinc-500 italic">No additional suggestions.</li>
              ) : (
                feedback.actionableSuggestions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-zinc-400 select-none">↳</span>
                    <span className="leading-relaxed">{a}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Submitted Code Preview */}
      <div className="rounded-2xl border border-white/15 bg-black overflow-hidden mb-10">
        <div
          onClick={() => setIsSolutionExpanded(!isSolutionExpanded)}
          className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-white font-bold">
              SUBMITTED ARCHITECTURE SPEC
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              ({submission.format} // {submission.language || 'generic'})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyCode();
              }}
              className="px-2.5 py-1 rounded-full border border-white/20 hover:border-white text-[10px] font-mono text-zinc-300 hover:text-white transition-colors"
            >
              {copied ? 'COPIED!' : 'COPY'}
            </button>
            {isSolutionExpanded ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </div>
        </div>

        {isSolutionExpanded && (
          <pre className="p-5 overflow-x-auto text-xs font-mono text-zinc-300 bg-black max-h-[30rem] leading-relaxed">
            <code>{submission.solutionContent}</code>
          </pre>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="pt-6 border-t border-white/10 flex items-center justify-between">
        <button
          onClick={onBackToCatalogue}
          className="text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
        >
          ← Return to Catalogue
        </button>

        <button
          onClick={() =>
            onRefineDesign(
              submission.solutionContent,
              submission.format,
              submission.language
            )
          }
          className="inline-flex items-center gap-2 bg-white text-black hover:bg-zinc-200 transition-colors rounded-full px-6 py-2.5 text-xs font-medium uppercase tracking-wider shadow-sm"
        >
          <span>Iterate Design (New Attempt)</span>
          <span className="text-[14px] leading-none">✳︎</span>
        </button>
      </div>
    </div>
  );
}
