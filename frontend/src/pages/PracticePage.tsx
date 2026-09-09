import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Problem, Submission, SubmissionFormat } from '../types';
import { DifficultyBadge } from '../components/Badge';
import { AttemptHistory } from '../components/AttemptHistory';
import {
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';

interface PracticePageProps {
  problem: Problem;
  attempts: Submission[];
  isLoadingAttempts: boolean;
  onBackToCatalogue: () => void;
  onSubmit: (data: {
    problemId: string;
    solutionContent: string;
    format: SubmissionFormat;
    language: string;
  }) => Promise<Submission>;
  onSelectAttempt: (submissionId: string) => void;
  initialCode?: string;
  initialFormat?: SubmissionFormat;
  initialLanguage?: string;
}

export function PracticePage({
  problem,
  attempts,
  isLoadingAttempts,
  onBackToCatalogue,
  onSubmit,
  onSelectAttempt,
  initialCode,
  initialFormat = 'CODE',
  initialLanguage = 'typescript'
}: PracticePageProps) {
  const [activeTab, setActiveTab] = useState<'requirements' | 'rubric' | 'attempts'>('requirements');
  const [format, setFormat] = useState<SubmissionFormat>(initialFormat);
  const [language, setLanguage] = useState<string>(initialLanguage);
  const [code, setCode] = useState<string>(initialCode || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionPhase, setSubmissionPhase] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Requirements checklist state
  const [checkedRequirements, setCheckedRequirements] = useState<Record<number, boolean>>({});

  // Initialize code with starter template if empty
  useEffect(() => {
    if (!initialCode && (!code || code.trim() === '')) {
      if (format === 'CODE' && problem.starterTemplates?.[language]) {
        setCode(problem.starterTemplates[language]);
      } else if (format === 'TEXT') {
        setCode(`### ${problem.title} - Architectural Design\n\n1. Domain Entities & Responsibilities:\n   - Entity 1:\n   - Entity 2:\n\n2. Key Method Signatures & Interactions:\n   - ...\n\n3. Design Patterns Applied (Strategy, State, Factory, etc.):\n   - ...\n\n4. Edge Cases, Concurrency & Constraints:\n   - ...\n`);
      }
    }
  }, [problem, format, language, initialCode]);

  const toggleRequirement = (index: number) => {
    setCheckedRequirements((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (format === 'CODE' && problem.starterTemplates?.[newLang]) {
      setCode(problem.starterTemplates[newLang]);
    }
  };

  const handleCopyTemplate = () => {
    const templateContent =
      format === 'CODE' && problem.starterTemplates?.[language]
        ? problem.starterTemplates[language]
        : code;
    navigator.clipboard.writeText(templateContent);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleSubmit = async () => {
    setValidationError(null);

    const trimmed = code.trim();
    if (!trimmed) {
      setValidationError('Please provide code or text before submitting.');
      return;
    }

    if (trimmed.length < 40) {
      setValidationError('Submission requires at least 40 characters of design code.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionPhase('Pre-validating structural declarations...');

    try {
      setTimeout(() => {
        setSubmissionPhase('Evaluating against rubric criteria...');
      }, 600);

      const result = await onSubmit({
        problemId: problem.id,
        solutionContent: code,
        format,
        language
      });

      onSelectAttempt(result.id);
    } catch (err: any) {
      setValidationError(err.message || 'Submission failed. Please verify engine connectivity.');
    } finally {
      setIsSubmitting(false);
      setSubmissionPhase('');
    }
  };

  const lineCount = code ? code.split('\n').length : 0;
  const charCount = code ? code.length : 0;

  return (
    <div className="h-screen overflow-hidden bg-black text-white flex flex-col pt-[73px]">
      {/* Sub-header Bar */}
      <div className="px-5 sm:px-8 py-3 bg-black border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToCatalogue}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-mono uppercase">Catalogue</span>
          </button>
          <span className="text-white/20">/</span>
          <div className="flex items-center gap-2.5">
            <h2
              style={{ fontFamily: 'var(--font-heading)' }}
              className="text-base sm:text-lg font-normal tracking-tight text-white flex items-center gap-2"
            >
              {problem.title}
              <span className="text-[18px] select-none text-white leading-none">✳︎</span>
            </h2>
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-zinc-400">
            <span>{lineCount} LINES</span>
            <span className="text-white/20">|</span>
            <span>{charCount} CHARS</span>
          </div>
        </div>
      </div>

      {/* Main Split-Pane Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Pane: Details, Requirements, Rubric, Attempts */}
        <div className="w-full lg:w-[45%] h-1/2 lg:h-full flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 bg-black">
          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-white/10 bg-black px-4 pt-2 shrink-0">
            <button
              onClick={() => setActiveTab('requirements')}
              className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                activeTab === 'requirements'
                  ? 'border-white text-white font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Requirements
            </button>
            <button
              onClick={() => setActiveTab('rubric')}
              className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                activeTab === 'rubric'
                  ? 'border-white text-white font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              SOLID Rubric
            </button>
            <button
              onClick={() => setActiveTab('attempts')}
              className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                activeTab === 'attempts'
                  ? 'border-white text-white font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Attempt History</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-white font-mono">
                {attempts.length}
              </span>
            </button>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-zinc-300">
            {activeTab === 'requirements' && (
              <>
                {/* Scenario Description */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">
                    // SPECIFICATION OVERVIEW
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-300 font-normal">
                    {problem.description}
                  </p>
                </div>

                {/* Interactive Requirements Checklist */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                      // FUNCTIONAL REQUIREMENTS ({Object.values(checkedRequirements).filter(Boolean).length}/{problem.requirements.length})
                    </div>
                  </div>
                  <div className="space-y-2">
                    {problem.requirements.map((req, idx) => {
                      const isChecked = Boolean(checkedRequirements[idx]);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleRequirement(idx)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer select-none transition-all flex items-start gap-3 ${
                            isChecked
                              ? 'bg-white/5 border-white/40 text-zinc-400 line-through'
                              : 'bg-black border-white/15 hover:border-white/40 text-zinc-200'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                              isChecked
                                ? 'bg-white border-white text-black'
                                : 'border-white/30 bg-transparent'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="leading-relaxed">{req}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Constraints */}
                <div className="pt-4 border-t border-white/10">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">
                    // CONSTRAINTS & ASSUMPTIONS
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-400">
                    {problem.constraints.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-white select-none">↳</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {activeTab === 'rubric' && (
              <div className="space-y-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">
                  // 4-PILLAR EVALUATION RUBRIC (100 TOTAL PTS)
                </div>
                {problem.evaluationRubric.map((criterion) => (
                  <div
                    key={criterion.key}
                    className="p-4 rounded-xl border border-white/15 bg-white/5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-white">
                      <span>{criterion.name}</span>
                      <span>MAX {criterion.maxScore} PTS</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                      {criterion.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'attempts' && (
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-3">
                  // CHRONOLOGICAL ATTEMPTS
                </div>
                <AttemptHistory
                  attempts={attempts}
                  onSelectAttempt={onSelectAttempt}
                  isLoading={isLoadingAttempts}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Editor & Bottom Action Bar */}
        <div className="w-full lg:w-[55%] h-1/2 lg:h-full flex flex-col bg-black">
          {/* Editor Header Bar */}
          <div className="px-5 py-3 border-b border-white/10 bg-black flex items-center justify-between shrink-0">
            {/* Format Toggle (Code vs Text) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFormat('CODE')}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                  format === 'CODE'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white border border-white/15'
                }`}
              >
                CODE
              </button>
              <button
                onClick={() => setFormat('TEXT')}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                  format === 'TEXT'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white border border-white/15'
                }`}
              >
                TEXT / ARCHITECTURE
              </button>
            </div>

            {/* Language Selector */}
            {format === 'CODE' && (
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-black border border-white/15 rounded-full px-3 py-1 text-xs font-mono text-white focus:outline-none focus:border-white transition-colors cursor-pointer"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
            )}
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative bg-black min-h-0">
            <Editor
              height="100%"
              language={format === 'TEXT' ? 'markdown' : language === 'cpp' ? 'cpp' : language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                fontFamily: "'JetBrains Mono', monospace",
                renderLineHighlight: 'all'
              }}
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="px-5 py-4 border-t border-white/10 bg-black flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Outline pill: Copy Starter Template */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 hover:border-white hover:bg-white/5 text-xs font-mono uppercase tracking-wider text-white transition-colors focus:outline-none"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                <span>{copiedTemplate ? 'Copied to Clipboard!' : 'Copy Starter Template'}</span>
              </button>

              {validationError && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            {/* White pill: Submit Architecture for Review */}
            <button
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 bg-white text-black hover:bg-zinc-200 transition-colors rounded-full px-6 py-2 text-xs font-medium uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{submissionPhase || 'Evaluating...'}</span>
                </>
              ) : (
                <>
                  <span>Submit Architecture for Review</span>
                  <span className="text-[14px] leading-none">✳︎</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
