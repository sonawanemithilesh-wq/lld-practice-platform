import React, { useState, useEffect } from 'react';
import { BackgroundVideo } from './components/BackgroundVideo';
import { Navbar } from './components/Navbar';
import { CataloguePage } from './pages/CataloguePage';
import { PracticePage } from './pages/PracticePage';
import { FeedbackPage } from './pages/FeedbackPage';
import {
  fetchProblems,
  fetchProblem,
  fetchProblemAttempts,
  submitSolution,
  fetchSubmission
} from './api/client';
import { Problem, Submission, SubmissionFormat } from './types';
import { Loader2, X } from 'lucide-react';

type ViewRoute =
  | { name: 'catalogue' }
  | { name: 'practice'; problemId: string }
  | { name: 'feedback'; submissionId: string };

export function App() {
  const [route, setRoute] = useState<ViewRoute>({ name: 'catalogue' });
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);

  // Modals for header links
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);
  const [showAttemptsModal, setShowAttemptsModal] = useState(false);

  // Practice state
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [attempts, setAttempts] = useState<Submission[]>([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);
  const [editorPrefill, setEditorPrefill] = useState<{
    code: string;
    format: SubmissionFormat;
    language?: string;
  } | null>(null);

  // Feedback state
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);

  // Initial load
  useEffect(() => {
    loadProblems();

    const handlePopState = () => {
      resolveRouteFromUrl();
    };
    window.addEventListener('popstate', handlePopState);
    resolveRouteFromUrl();

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const resolveRouteFromUrl = () => {
    const path = window.location.pathname;
    if (path.startsWith('/practice/')) {
      const problemId = path.replace('/practice/', '');
      if (problemId) {
        setRoute({ name: 'practice', problemId });
        loadProblemData(problemId);
        return;
      }
    } else if (path.startsWith('/attempts/')) {
      const submissionId = path.replace('/attempts/', '');
      if (submissionId) {
        setRoute({ name: 'feedback', submissionId });
        loadSubmissionData(submissionId);
        return;
      }
    }
    setRoute({ name: 'catalogue' });
  };

  const navigateTo = (newRoute: ViewRoute) => {
    let url = '/';
    if (newRoute.name === 'practice') {
      url = `/practice/${newRoute.problemId}`;
    } else if (newRoute.name === 'feedback') {
      url = `/attempts/${newRoute.submissionId}`;
    }

    if (window.location.pathname !== url) {
      window.history.pushState(null, '', url);
    }
    setRoute(newRoute);

    if (newRoute.name === 'practice') {
      loadProblemData(newRoute.problemId);
    } else if (newRoute.name === 'feedback') {
      loadSubmissionData(newRoute.submissionId);
    }
  };

  const loadProblems = async () => {
    try {
      setIsLoadingProblems(true);
      const data = await fetchProblems();
      setProblems(data);
    } catch (err) {
      console.error('Failed to load problems:', err);
    } finally {
      setIsLoadingProblems(false);
    }
  };

  const loadProblemData = async (problemIdOrSlug: string) => {
    try {
      setIsLoadingAttempts(true);
      const problemData = await fetchProblem(problemIdOrSlug);
      setCurrentProblem(problemData);
      const attemptsData = await fetchProblemAttempts(problemData.id);
      setAttempts(attemptsData);
    } catch (err) {
      console.error('Failed to load problem details:', err);
    } finally {
      setIsLoadingAttempts(false);
    }
  };

  const loadSubmissionData = async (submissionId: string) => {
    try {
      const sub = await fetchSubmission(submissionId);
      setCurrentSubmission(sub);
      const prob = await fetchProblem(sub.problemId);
      setCurrentProblem(prob);
    } catch (err) {
      console.error('Failed to load submission data:', err);
    }
  };

  const handleRefineDesign = (code: string, format: string, language?: string) => {
    if (!currentProblem) return;
    setEditorPrefill({
      code,
      format: (format === 'TEXT' ? 'TEXT' : 'CODE') as SubmissionFormat,
      language
    });
    navigateTo({ name: 'practice', problemId: currentProblem.slug || currentProblem.id });
  };

  const handleSubmitAttempt = async (data: {
    problemId: string;
    solutionContent: string;
    format: SubmissionFormat;
    language: string;
  }): Promise<Submission> => {
    const result = await submitSolution(data);
    setCurrentSubmission(result);
    // Refresh problem attempt list
    if (currentProblem) {
      loadProblemData(currentProblem.id);
    }
    loadProblems();
    return result;
  };

  const totalAttempts = problems.reduce((sum, p) => sum + (p.attemptCount || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white relative selection:bg-white selection:text-black">
      {/* 1. Background Video with horizontal mouse-scrubbing (pointer-events-none) */}
      <BackgroundVideo />

      {/* 2. Restored LLD Content on Top (z-index: 10/20) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          onNavigateHome={() => {
            setEditorPrefill(null);
            navigateTo({ name: 'catalogue' });
          }}
          onOpenRubricModal={() => setShowRubricModal(true)}
          onOpenArchitectureModal={() => setShowArchitectureModal(true)}
          onOpenAttemptsModal={() => setShowAttemptsModal(true)}
          totalAttempts={totalAttempts}
          activeProblemTitle={
            route.name === 'practice' && currentProblem ? currentProblem.title : undefined
          }
        />

        <main className="flex-1">
          {route.name === 'catalogue' && (
            <CataloguePage
              problems={problems}
              isLoading={isLoadingProblems}
              onSelectProblem={(idOrSlug) => {
                setEditorPrefill(null);
                navigateTo({ name: 'practice', problemId: idOrSlug });
              }}
            />
          )}

          {route.name === 'practice' && currentProblem && (
            <PracticePage
              problem={currentProblem}
              attempts={attempts}
              isLoadingAttempts={isLoadingAttempts}
              initialCode={editorPrefill?.code}
              initialFormat={editorPrefill?.format}
              initialLanguage={editorPrefill?.language}
              onBackToCatalogue={() => navigateTo({ name: 'catalogue' })}
              onSubmit={handleSubmitAttempt}
              onSelectAttempt={(subId) => navigateTo({ name: 'feedback', submissionId: subId })}
            />
          )}

          {route.name === 'practice' && !currentProblem && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] pt-32">
              <Loader2 className="w-6 h-6 text-white animate-spin mb-3" />
              <p className="text-xs font-mono text-zinc-400">CONNECTING TO WORKSPACE SPEC...</p>
            </div>
          )}

          {route.name === 'feedback' && currentSubmission && currentProblem && (
            <FeedbackPage
              submission={currentSubmission}
              problem={currentProblem}
              onRefineDesign={handleRefineDesign}
              onBackToProblem={() =>
                navigateTo({ name: 'practice', problemId: currentProblem.slug || currentProblem.id })
              }
              onBackToCatalogue={() => navigateTo({ name: 'catalogue' })}
            />
          )}

          {route.name === 'feedback' && (!currentSubmission || !currentProblem) && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] pt-32">
              <Loader2 className="w-6 h-6 text-white animate-spin mb-3" />
              <p className="text-xs font-mono text-zinc-400">RETRIEVING EVALUATION REPORT...</p>
            </div>
          )}
        </main>
      </div>

      {/* Evaluation Rubric Modal */}
      {showRubricModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-5 animate-in fade-in duration-200">
          <div className="bg-black border border-white/20 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-left">
            <button
              onClick={() => setShowRubricModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">
                EVALUATION PROTOCOL //
              </div>
              <h3
                style={{ fontFamily: 'var(--font-heading)' }}
                className="text-2xl font-normal text-white tracking-tight flex items-center gap-2"
              >
                4-Pillar Architecture Rubric
                <span className="text-[20px] leading-none">✳︎</span>
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-4 rounded-xl border border-white/15 bg-white/5">
                <div className="flex items-center justify-between font-mono font-bold text-white mb-1">
                  <span>01 // SOLID Principles</span>
                  <span>25 PTS</span>
                </div>
                <p className="text-zinc-400 leading-relaxed font-normal">
                  Strict adherence to Single Responsibility per entity, Open/Closed extensibility for algorithms, and Dependency Inversion via abstractions.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/15 bg-white/5">
                <div className="flex items-center justify-between font-mono font-bold text-white mb-1">
                  <span>02 // Class Responsibilities & Modularity</span>
                  <span>25 PTS</span>
                </div>
                <p className="text-zinc-400 leading-relaxed font-normal">
                  Clean class boundaries, robust encapsulation, elimination of monolithic God classes, and cohesive method definitions.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/15 bg-white/5">
                <div className="flex items-center justify-between font-mono font-bold text-white mb-1">
                  <span>03 // Extensibility & Design Patterns</span>
                  <span>25 PTS</span>
                </div>
                <p className="text-zinc-400 leading-relaxed font-normal">
                  Intentional application of Gang of Four patterns (State, Strategy, Factory, Observer) to allow zero-modification feature additions.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/15 bg-white/5">
                <div className="flex items-center justify-between font-mono font-bold text-white mb-1">
                  <span>04 // Edge Cases & Robustness</span>
                  <span>25 PTS</span>
                </div>
                <p className="text-zinc-400 leading-relaxed font-normal">
                  Guards against boundary limits, capacity bottlenecks, concurrent mutations, and domain exception contracts.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowRubricModal(false)}
                className="px-5 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-zinc-200 transition-colors"
              >
                Close Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Architecture Modal */}
      {showArchitectureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-5 animate-in fade-in duration-200">
          <div className="bg-black border border-white/20 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-left">
            <button
              onClick={() => setShowArchitectureModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">
                SYSTEM SPECIFICATION //
              </div>
              <h3
                style={{ fontFamily: 'var(--font-heading)' }}
                className="text-2xl font-normal text-white tracking-tight flex items-center gap-2"
              >
                Autonomous LLD Engine
                <span className="text-[20px] leading-none">✳︎</span>
              </h3>
            </div>

            <div className="space-y-3.5 text-xs text-zinc-300 font-normal">
              <div className="p-4 rounded-xl border border-white/15 bg-white/5 space-y-1">
                <div className="font-mono text-white uppercase text-[11px] font-bold">
                  01. Deterministic Validation Pipeline
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Submissions are immediately evaluated by an internal deterministic tokenizer. Empty content or designs lacking object-oriented structure are rejected instantly in &lt;1ms.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/15 bg-white/5 space-y-1">
                <div className="font-mono text-white uppercase text-[11px] font-bold">
                  02. Strategy Pattern Evaluation Engine
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Decoupled <code className="font-mono text-white">IEvaluator</code> architecture seamlessly handles live Gemini and OpenAI JSON-schema evaluators, paired with a resilient heuristic fallback.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/15 bg-white/5 space-y-1">
                <div className="font-mono text-white uppercase text-[11px] font-bold">
                  03. Persistent State & SQLite Engine
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Thread-safe WAL-mode SQLite storage records every submission lifecycle state (<code className="font-mono text-white">PENDING</code> → <code className="font-mono text-white">EVALUATING</code> → <code className="font-mono text-white">COMPLETED</code>) with complete criteria feedback.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowArchitectureModal(false)}
                className="px-5 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-zinc-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attempt History Modal (Global) */}
      {showAttemptsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-5 animate-in fade-in duration-200">
          <div className="bg-black border border-white/20 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative text-left">
            <button
              onClick={() => setShowAttemptsModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1">
                PROGRESS LOG //
              </div>
              <h3
                style={{ fontFamily: 'var(--font-heading)' }}
                className="text-2xl font-normal text-white tracking-tight flex items-center gap-2"
              >
                Platform Attempt Summary
                <span className="text-[20px] leading-none">✳︎</span>
              </h3>
            </div>

            <div className="space-y-3">
              {problems.map((problem) => (
                <div
                  key={problem.id}
                  onClick={() => {
                    setShowAttemptsModal(false);
                    navigateTo({ name: 'practice', problemId: problem.slug || problem.id });
                  }}
                  className="p-4 rounded-xl border border-white/15 bg-white/5 hover:border-white/40 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <h4 className="text-sm text-white font-medium mb-0.5">{problem.title}</h4>
                    <div className="text-[11px] font-mono text-zinc-400">
                      DIFFICULTY: {problem.difficulty}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-xs text-white">
                      {problem.attemptCount || 0} ATTEMPTS
                    </div>
                    {problem.bestScore ? (
                      <div className="text-[11px] text-zinc-400">
                        BEST: {problem.bestScore}/100
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-500">UNATTEMPTED</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowAttemptsModal(false)}
                className="px-5 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-zinc-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
