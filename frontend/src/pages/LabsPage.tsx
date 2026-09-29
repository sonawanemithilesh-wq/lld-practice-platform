import React, { useState, useMemo } from 'react';
import { Lab } from '../types';
import { Shield, Terminal, ArrowUpRight, CheckCircle2, Play, Power, RotateCcw, AlertTriangle } from 'lucide-react';

interface LabsPageProps {
  labs: Lab[];
  isLoading: boolean;
  onSelectLab: (labId: string) => void;
  onStartLab?: (labId: string) => Promise<void>;
  onStopLab?: (labId: string) => Promise<void>;
}

export function LabsPage({ labs, isLoading, onSelectLab, onStartLab, onStopLab }: LabsPageProps) {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const tags = ['All', 'Web Pentesting', 'XSS', 'SQL Injection', 'Payload Crafting'];

  const filteredLabs = useMemo(() => {
    return labs.filter((lab) => {
      if (selectedTag === 'All') return true;
      if (selectedTag === 'Web Pentesting') return lab.tags.includes('web');
      if (selectedTag === 'XSS') return lab.tags.includes('xss');
      if (selectedTag === 'SQL Injection') return lab.tags.includes('sqli') || lab.tags.includes('sql-injection');
      if (selectedTag === 'Payload Crafting') return lab.tags.includes('payload-crafting');
      return true;
    });
  }, [labs, selectedTag]);

  const handleStart = async (e: React.MouseEvent, labId: string) => {
    e.stopPropagation();
    if (!onStartLab) return;
    try {
      setActionInProgress(labId);
      await onStartLab(labId);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleStop = async (e: React.MouseEvent, labId: string) => {
    e.stopPropagation();
    if (!onStopLab) return;
    try {
      setActionInProgress(labId);
      await onStopLab(labId);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-5 sm:px-8">
      {/* Hero Section */}
      <div className="mb-14 sm:mb-20">
        <div
          style={{
            fontSize: 'clamp(16px, 3vw, 22px)',
            filter: 'blur(3px)',
            color: '#fff',
            lineHeight: 1.3
          }}
          className="select-none pointer-events-none mb-4 tracking-tight"
        >
          AI-Augmented Security Engineering,<br />
          Hands-On Exploitation Triage & Defensive Architecture
        </div>

        <h1
          style={{ fontFamily: 'var(--font-heading)' }}
          className="text-3xl sm:text-5xl lg:text-6xl font-normal text-white tracking-tight leading-[1.15] max-w-5xl mb-6"
        >
          Hands-On Cybersecurity Labs
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base max-w-3xl leading-relaxed mb-8">
          Interactive, local containerized target environments designed to practice AI-assisted vulnerability discovery, context classification, and proof validation. Every lab includes an intentional flaw, an automated proof collector, and safe parameterized/encoded comparison routes.
        </p>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`${
                selectedTag === t
                  ? 'bg-white text-black'
                  : 'bg-black text-white hover:bg-white hover:text-black border border-white/20'
              } rounded-full px-5 py-1.5 text-sm font-medium transition-colors`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Lab Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-80 bg-black border border-white/15 rounded-2xl p-6 animate-pulse"
            />
          ))}
        </div>
      ) : filteredLabs.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/15 rounded-2xl">
          <p className="text-sm font-mono text-zinc-400 mb-2">NO CYBERSECURITY LABS MATCH QUERY</p>
          <button
            onClick={() => setSelectedTag('All')}
            className="text-xs text-white underline underline-offset-4 hover:opacity-70"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredLabs.map((lab, index) => {
            const isReady = lab.status === 'ready';
            const isStarting = lab.status === 'starting';

            return (
              <div
                key={lab.id}
                onClick={() => onSelectLab(lab.id)}
                className="group cursor-pointer bg-black border border-white/15 hover:border-white/50 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative shadow-lg"
              >
                <div>
                  {/* Top row: numbering, badges */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-zinc-400">
                        LAB 0{index + 1} //
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase border border-sky-400/30 text-sky-400 bg-sky-950/20">
                        Level {lab.difficulty} &bull; ~{lab.estimatedTimeMinutes}m
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {lab.proved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border border-emerald-500/30 text-emerald-400 bg-emerald-950/30">
                          <CheckCircle2 className="w-3 h-3" />
                          PROVED
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${
                          isReady
                            ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
                            : isStarting
                            ? 'border-amber-500/40 text-amber-400 bg-amber-950/20 animate-pulse'
                            : 'border-zinc-700 text-zinc-400 bg-zinc-900/40'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isReady ? 'bg-emerald-400' : isStarting ? 'bg-amber-400' : 'bg-zinc-500'
                          }`}
                        />
                        {lab.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    style={{ fontFamily: 'var(--font-heading)' }}
                    className="text-xl sm:text-2xl font-normal text-white mb-3 tracking-tight group-hover:underline underline-offset-4 transition"
                  >
                    {lab.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mb-6 font-normal">
                    {lab.summary}
                  </p>

                  {/* Target Endpoints Card */}
                  <div className="bg-zinc-950/80 border border-white/10 rounded-xl p-3 mb-6 font-mono text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>TARGET PORTAL:</span>
                      <span className="text-sky-400">{lab.targetUrl}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>PROOF COLLECTOR:</span>
                      <span className="text-emerald-400">{lab.collectorUrl}</span>
                    </div>
                  </div>

                  {/* Learning Objectives Preview */}
                  <div className="space-y-1.5 mb-6 pt-4 border-t border-white/10">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                      Learning Objectives:
                    </div>
                    {lab.learningObjectives.slice(0, 3).map((obj, oIdx) => (
                      <div key={oIdx} className="flex items-start gap-2 text-xs text-zinc-300">
                        <span className="text-zinc-500 font-mono text-[11px] mt-0.5">↳</span>
                        <span className="line-clamp-1">{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {onStartLab && (
                      <button
                        onClick={(e) => (isReady ? handleStop(e, lab.id) : handleStart(e, lab.id))}
                        disabled={actionInProgress === lab.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-colors border ${
                          isReady
                            ? 'border-red-500/40 text-red-400 hover:bg-red-950/40'
                            : 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/40'
                        }`}
                      >
                        {isReady ? (
                          <>
                            <Power className="w-3 h-3" />
                            Stop Container
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-emerald-400" />
                            Start Container
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectLab(lab.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black hover:bg-zinc-200 transition-all text-xs font-semibold uppercase tracking-wider"
                  >
                    <span>Open Workspace</span>
                    <span className="text-[15px] leading-none">✳︎</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
