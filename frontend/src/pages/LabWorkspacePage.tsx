import React, { useState, useEffect } from 'react';
import { Lab, LabValidationResult } from '../types';
import {
  ArrowLeft,
  Play,
  Power,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Terminal,
  Globe,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LabWorkspacePageProps {
  lab: Lab;
  onBackToLabs: () => void;
  onStartLab: (labId: string) => Promise<void>;
  onStopLab: (labId: string) => Promise<void>;
  onResetLab: (labId: string) => Promise<void>;
  onValidateLab: (labId: string) => Promise<LabValidationResult>;
  onRefreshStatus: (labId: string) => Promise<void>;
}

export function LabWorkspacePage({
  lab,
  onBackToLabs,
  onStartLab,
  onStopLab,
  onResetLab,
  onValidateLab,
  onRefreshStatus
}: LabWorkspacePageProps) {
  const [activeLeftTab, setActiveLeftTab] = useState<'instructions' | 'hints' | 'endpoints'>('instructions');
  const [activeRightTab, setActiveRightTab] = useState<'target' | 'console' | 'collector'>('target');

  const [isRunningAction, setIsRunningAction] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<LabValidationResult | null>(null);

  const [expandedHints, setExpandedHints] = useState<Record<string, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState<number>(1);

  // Auto-refresh status periodically
  useEffect(() => {
    const timer = setInterval(() => {
      onRefreshStatus(lab.id);
    }, 6000);
    return () => clearInterval(timer);
  }, [lab.id, onRefreshStatus]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleStart = async () => {
    try {
      setIsRunningAction(true);
      setActionMessage('Starting lab containers...');
      await onStartLab(lab.id);
      setActionMessage('Containers launched. Waiting for ready check...');
      setTimeout(() => {
        setIframeKey((k) => k + 1);
        setActionMessage(null);
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionMessage(`Start failed: ${msg}`);
    } finally {
      setIsRunningAction(false);
    }
  };

  const handleStop = async () => {
    try {
      setIsRunningAction(true);
      setActionMessage('Stopping lab containers...');
      await onStopLab(lab.id);
      setActionMessage(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionMessage(`Stop failed: ${msg}`);
    } finally {
      setIsRunningAction(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsRunningAction(true);
      setActionMessage('Resetting lab state & clearing proof volume...');
      await onResetLab(lab.id);
      setValidationResult(null);
      setActionMessage('Reset complete.');
      setTimeout(() => {
        setIframeKey((k) => k + 1);
        setActionMessage(null);
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionMessage(`Reset failed: ${msg}`);
    } finally {
      setIsRunningAction(false);
    }
  };

  const handleValidate = async () => {
    try {
      setIsValidating(true);
      const res = await onValidateLab(lab.id);
      setValidationResult(res);
      if (res.passed) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setValidationResult({
        ok: false,
        passed: false,
        output: `Validation query error: ${msg}`
      });
    } finally {
      setIsValidating(false);
    }
  };

  const isReady = lab.status === 'ready';
  const isStarting = lab.status === 'starting';

  return (
    <div className="pt-20 min-h-screen flex flex-col bg-black text-white">
      {/* Top Workspace Header Bar */}
      <div className="border-b border-white/10 bg-black/90 backdrop-blur-md px-5 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-[69px] z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLabs}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ALL LABS</span>
          </button>
          <span className="text-white/20 select-none">|</span>
          <span className="text-xs font-mono text-zinc-400 font-semibold">{lab.id}</span>
          <span className="hidden sm:inline text-white font-medium text-sm truncate max-w-sm">
            {lab.title}
          </span>
        </div>

        {/* Status & Control Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider border ${
              isReady
                ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
                : isStarting
                ? 'border-amber-500/40 text-amber-400 bg-amber-950/20 animate-pulse'
                : 'border-zinc-700 text-zinc-400 bg-zinc-900/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isReady ? 'bg-emerald-400' : isStarting ? 'bg-amber-400' : 'bg-zinc-500'
              }`}
            />
            {lab.status.replace('_', ' ')}
          </span>

          {isReady ? (
            <button
              onClick={handleStop}
              disabled={isRunningAction}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border border-red-500/40 text-red-400 hover:bg-red-950/40 transition-colors"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={isRunningAction}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/40 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-emerald-400" />
              <span>Start</span>
            </button>
          )}

          <button
            onClick={handleReset}
            disabled={isRunningAction}
            title="Reset lab volume and clear proof state"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border border-white/20 text-zinc-300 hover:text-white hover:border-white/40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <a
            href={lab.targetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border border-sky-400/40 text-sky-400 hover:bg-sky-950/30 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Open Target</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={handleValidate}
            disabled={isValidating || !isReady}
            className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              lab.proved || validationResult?.passed
                ? 'bg-emerald-400 text-black hover:bg-emerald-300'
                : 'bg-white text-black hover:bg-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isValidating ? 'Checking...' : lab.proved ? 'Verified Proved' : 'Validate'}</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="bg-sky-950/60 border-b border-sky-500/30 px-5 py-2 text-xs font-mono text-sky-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{actionMessage}</span>
          </div>
        </div>
      )}

      {/* Validation Result Banner */}
      {validationResult && (
        <div
          className={`border-b px-5 py-3 text-xs font-mono flex items-center justify-between ${
            validationResult.passed
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/80 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {validationResult.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{validationResult.output}</span>
          </div>
          <button
            onClick={() => setValidationResult(null)}
            className="text-zinc-400 hover:text-white ml-4 text-[10px] uppercase font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split-Pane Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        {/* Left Pane: Instructions & Guidance */}
        <div className="flex flex-col h-full bg-black/60 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center border-b border-white/10 px-5 pt-3 gap-2 bg-zinc-950/50">
            <button
              onClick={() => setActiveLeftTab('instructions')}
              className={`pb-2.5 px-3 text-xs font-mono font-semibold transition-colors border-b-2 ${
                activeLeftTab === 'instructions'
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Walkthrough &amp; Steps
            </button>
            <button
              onClick={() => setActiveLeftTab('hints')}
              className={`pb-2.5 px-3 text-xs font-mono font-semibold transition-colors border-b-2 ${
                activeLeftTab === 'hints'
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Hints ({lab.hints.length})
            </button>
            <button
              onClick={() => setActiveLeftTab('endpoints')}
              className={`pb-2.5 px-3 text-xs font-mono font-semibold transition-colors border-b-2 ${
                activeLeftTab === 'endpoints'
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Endpoints &amp; Tools
            </button>
          </div>

          {/* Left Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-300">
            {activeLeftTab === 'instructions' && (
              <div className="space-y-6 text-sm leading-relaxed">
                {/* Scenario Header */}
                <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-5">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">
                    Scenario Overview
                  </div>
                  <h2 className="text-base font-bold text-white mb-2">{lab.title}</h2>
                  <p className="text-xs text-zinc-400">{lab.summary}</p>
                </div>

                {/* Objectives */}
                <div className="bg-zinc-950 border border-white/10 rounded-xl p-4">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">
                    Learning Objectives
                  </div>
                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {lab.learningObjectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-mono">✓</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Markdown Instructions */}
                <div className="prose prose-invert max-w-none prose-sm font-sans space-y-4">
                  {lab.instructions
                    .split('\n\n')
                    .map((block, idx) => {
                      if (block.startsWith('# ')) {
                        return (
                          <h1 key={idx} className="text-lg font-bold text-white border-b border-white/10 pb-2">
                            {block.replace('# ', '')}
                          </h1>
                        );
                      }
                      if (block.startsWith('## ')) {
                        return (
                          <h2 key={idx} className="text-base font-semibold text-white mt-6 mb-2">
                            {block.replace('## ', '')}
                          </h2>
                        );
                      }
                      if (block.startsWith('```')) {
                        const lines = block.split('\n');
                        const code = lines.slice(1, -1).join('\n');
                        return (
                          <div key={idx} className="relative group bg-zinc-950 border border-white/15 rounded-xl p-3.5 my-2">
                            <button
                              onClick={() => handleCopy(code)}
                              className="absolute top-2 right-2 p-1.5 rounded bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-colors"
                              title="Copy code"
                            >
                              {copiedText === code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <pre className="text-xs font-mono text-sky-300 overflow-x-auto pr-8">{code}</pre>
                          </div>
                        );
                      }
                      return (
                        <p key={idx} className="text-xs text-zinc-300 leading-relaxed">
                          {block}
                        </p>
                      );
                    })}
                </div>
              </div>
            )}

            {activeLeftTab === 'hints' && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400">
                  Revealing hints will help steer your investigation without giving away the full answer immediately.
                </p>

                {lab.hints.map((hint, hIdx) => {
                  const isExpanded = !!expandedHints[hint.id];
                  return (
                    <div
                      key={hint.id}
                      className="bg-zinc-950 border border-white/15 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedHints((prev) => ({ ...prev, [hint.id]: !prev[hint.id] }))
                        }
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-sky-400" />
                          <span className="text-xs font-mono font-medium text-white">
                            Hint 0{hIdx + 1}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 border-t border-white/5 leading-relaxed bg-black/40">
                          {hint.text}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeLeftTab === 'endpoints' && (
              <div className="space-y-4 text-xs">
                <div className="bg-zinc-950 border border-white/15 rounded-xl p-4 space-y-3">
                  <div className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
                    Network Configuration
                  </div>
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-zinc-400">Target Host URL:</span>
                      <a href={lab.targetUrl} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                        {lab.targetUrl}
                      </a>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-zinc-400">Collector Host URL:</span>
                      <a href={`${lab.collectorUrl}/status`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                        {lab.collectorUrl}
                      </a>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-400">Proof Token:</span>
                      <span className="text-amber-400">{lab.proofToken}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/15 rounded-xl p-4 space-y-2">
                  <div className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
                    Attacker Container Terminal
                  </div>
                  <p className="text-zinc-400 text-xs">
                    To execute commands from the isolated attacker container on this network:
                  </p>
                  <div className="relative bg-black border border-white/10 rounded-lg p-2.5 font-mono text-xs text-zinc-200">
                    <code>docker exec -it {lab.id.includes('xss') ? 'dojo-xss-tools' : 'dojo-sqli-tools'} bash</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Live Target Preview & Console */}
        <div className="flex flex-col h-full bg-zinc-950 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 pt-3 bg-black">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveRightTab('target')}
                className={`pb-2.5 px-3 text-xs font-mono font-semibold transition-colors border-b-2 ${
                  activeRightTab === 'target'
                    ? 'border-white text-white'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Live Target Preview
              </button>
              <button
                onClick={() => setActiveRightTab('console')}
                className={`pb-2.5 px-3 text-xs font-mono font-semibold transition-colors border-b-2 ${
                  activeRightTab === 'console'
                    ? 'border-white text-white'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Triage Assistant
              </button>
              <button
                onClick={() => setActiveRightTab('collector')}
                className={`pb-2.5 px-3 text-xs font-mono font-semibold transition-colors border-b-2 ${
                  activeRightTab === 'collector'
                    ? 'border-white text-white'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Collector Status
              </button>
            </div>

            {activeRightTab === 'target' && (
              <div className="flex items-center gap-2 pb-2">
                <button
                  onClick={() => setIframeKey((k) => k + 1)}
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Reload preview"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <a
                  href={lab.targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Open in new window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Right Content Area */}
          <div className="flex-1 relative bg-black">
            {activeRightTab === 'target' && (
              isReady ? (
                <iframe
                  key={iframeKey}
                  src={lab.targetUrl}
                  title="Lab Target Preview"
                  className="w-full h-full border-none bg-[#0a0e17]"
                  sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/15 flex items-center justify-center text-zinc-400">
                    <Power className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-semibold text-white uppercase tracking-wider mb-1">
                      Target Container Not Running
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                      Click the "Start" button in the top toolbar to spin up the local target container, proof collector, and attacker tools.
                    </p>
                  </div>
                  <button
                    onClick={handleStart}
                    disabled={isRunningAction}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Start Lab Container</span>
                  </button>
                </div>
              )
            )}

            {activeRightTab === 'console' && (
              <div className="p-6 h-full overflow-y-auto space-y-6">
                <div className="bg-zinc-950 border border-white/15 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-white font-semibold">
                    <Terminal className="w-4 h-4 text-sky-400" />
                    <span>AI-Assisted Security Triage</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    This lab integrates an AI triage helper to evaluate reflection context and query logic before payload crafting.
                  </p>
                  <div className="space-y-2 pt-2">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Run triage from container:</div>
                    <div className="bg-black border border-white/10 rounded-lg p-3 font-mono text-xs text-sky-300">
                      {lab.id.includes('xss') ? (
                        <code>python /attacker/tools/xss_triage.py --url 'http://target.dojo.local:8080/search?q=DOJO_MARKER' --marker DOJO_MARKER</code>
                      ) : (
                        <code>python /attacker/tools/sqli_triage.py --url 'http://target.dojo.local:8080/login' --username "analyst'"</code>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/15 rounded-xl p-5 space-y-3">
                  <div className="text-xs font-mono text-white font-semibold flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Direct Verification Command</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    You can test the exploit payload directly using curl against the local target:
                  </p>
                  <div className="bg-black border border-white/10 rounded-lg p-3 font-mono text-xs text-emerald-300">
                    {lab.id.includes('xss') ? (
                      <code>curl -s 'http://localhost:9200/search?q=%3Cimg%20src=%22http://localhost:9201/proof?token=dojo-xss-context-triage%22%3E'</code>
                    ) : (
                      <code>curl -s -X POST http://localhost:9210/login --data-urlencode "username=admin' --" -d "password=any"</code>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeRightTab === 'collector' && (
              <div className="p-6 h-full overflow-y-auto space-y-4">
                <div className="bg-zinc-950 border border-white/15 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold text-white">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Local Proof Collector Status</span>
                    </div>
                    <button
                      onClick={() => onRefreshStatus(lab.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Poll</span>
                    </button>
                  </div>

                  <div className="p-4 bg-black border border-white/10 rounded-xl space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Collector Endpoint:</span>
                      <span className="text-sky-400">{lab.collectorUrl}/status</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Expected Token:</span>
                      <span className="text-amber-400">{lab.proofToken}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-zinc-500">Proof Registered:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          lab.proved ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-zinc-900 text-zinc-500'
                        }`}
                      >
                        {lab.proved ? 'PROVED ✓' : 'NOT PROVED'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    The collector resides in a separate container on the lab bridge network and writes state to a resettable named volume. Once your payload executes, the collector records the proof.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
