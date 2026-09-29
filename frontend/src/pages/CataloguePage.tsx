import React, { useState, useMemo } from 'react';
import { Problem, Difficulty } from '../types';
import { DifficultyBadge } from '../components/Badge';
import { useTypewriter } from '../hooks/useTypewriter';
import { ArrowUpRight, Search } from 'lucide-react';

interface CataloguePageProps {
  problems: Problem[];
  isLoading: boolean;
  onSelectProblem: (problemIdOrSlug: string) => void;
  onNavigateLabs?: () => void;
}

export function CataloguePage({ problems, isLoading, onSelectProblem, onNavigateLabs }: CataloguePageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | Difficulty>('All');

  const typewriterText =
    'Choose a system design challenge. Structure your domain model, submit, and inspect trade-offs.';
  const { displayed, done } = useTypewriter(typewriterText, 28, 400);

  const categories = ['All', 'State Machines', 'Strategy Algorithms', 'Concurrency', 'Resource Allocation', 'Cybersecurity Labs'];

  const handleCategoryClick = (cat: string) => {
    if (cat === 'Cybersecurity Labs' && onNavigateLabs) {
      onNavigateLabs();
      return;
    }
    setSelectedCategory(cat);
  };

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const matchesSearch =
        problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDifficulty =
        selectedDifficulty === 'All' || problem.difficulty === selectedDifficulty;

      let matchesCategory = true;
      if (selectedCategory !== 'All' && selectedCategory !== 'Cybersecurity Labs') {
        if (selectedCategory === 'State Machines') {
          matchesCategory = problem.slug === 'vending-machine';
        } else if (selectedCategory === 'Strategy Algorithms') {
          matchesCategory = problem.slug === 'parking-lot' || problem.slug === 'elevator-control-system';
        } else if (selectedCategory === 'Concurrency') {
          matchesCategory = problem.slug === 'elevator-control-system' || problem.slug === 'parking-lot';
        } else if (selectedCategory === 'Resource Allocation') {
          matchesCategory = problem.slug === 'parking-lot';
        }
      }

      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  }, [problems, searchTerm, selectedDifficulty, selectedCategory]);

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-5 sm:px-8">
      {/* Hero Section */}
      <div className="mb-14 sm:mb-20">
        {/* Blurred Intro Label */}
        <div
          style={{
            fontSize: 'clamp(16px, 3vw, 22px)',
            filter: 'blur(3px)',
            color: '#fff',
            lineHeight: 1.3
          }}
          className="select-none pointer-events-none mb-4 tracking-tight"
        >
          Autonomous Low-Level Design Engine,<br />
          Continuous Architecture Feedback & Rubric Evaluation
        </div>

        {/* Typewriter Header */}
        <h1
          style={{ fontFamily: 'var(--font-heading)' }}
          className="text-3xl sm:text-5xl lg:text-6xl font-normal text-white tracking-tight leading-[1.15] max-w-5xl mb-8 min-h-[4rem] sm:min-h-[7rem]"
        >
          {displayed}
          <span className="inline-block w-2 sm:w-3 h-7 sm:h-12 bg-white ml-2 align-middle animate-cursor-blink" />
        </h1>

        {/* Action Pills / Quick Filter categories */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`${
                selectedCategory === cat
                  ? 'bg-white text-black'
                  : cat === 'Cybersecurity Labs'
                  ? 'bg-sky-950/40 text-sky-300 hover:bg-sky-400 hover:text-black border border-sky-500/30'
                  : 'bg-black text-white hover:bg-white hover:text-black border border-white/20'
              } rounded-full px-5 py-1.5 text-sm font-medium transition-colors`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase font-mono tracking-widest text-zinc-400">
            DIFFICULTY:
          </span>
          <div className="flex items-center gap-1.5">
            {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                  selectedDifficulty === diff
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white border border-white/10'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search specs, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-black border border-white/15 rounded-full text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
          />
        </div>
      </div>

      {/* Problem Cards / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 bg-black border border-white/15 rounded-2xl p-6 animate-pulse"
            />
          ))}
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/15 rounded-2xl">
          <p className="text-sm font-mono text-zinc-400 mb-2">NO PROBLEMS MATCH QUERY</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setSelectedDifficulty('All');
            }}
            className="text-xs text-white underline underline-offset-4 hover:opacity-70"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProblems.map((problem, index) => (
            <div
              key={problem.id}
              className="group bg-black border border-white/15 hover:border-white/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative"
            >
              <div>
                {/* Top header row */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-zinc-400">
                      0{index + 1} //
                    </span>
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </div>
                  {problem.attemptCount && problem.attemptCount > 0 ? (
                    <span className="text-[11px] font-mono text-zinc-400">
                      {problem.attemptCount} ATTEMPT{problem.attemptCount > 1 ? 'S' : ''}
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-zinc-400">NEW</span>
                  )}
                </div>

                {/* Problem Title */}
                <h3
                  style={{ fontFamily: 'var(--font-heading)' }}
                  className="text-xl sm:text-2xl font-normal text-white mb-3 tracking-tight group-hover:underline underline-offset-4 transition"
                >
                  {problem.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mb-6 font-normal">
                  {problem.description}
                </p>

                {/* Requirements preview */}
                <div className="space-y-2 mb-8 pt-4 border-t border-white/10">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                    System Requirements:
                  </div>
                  {problem.requirements.slice(0, 3).map((req, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-2 text-xs text-zinc-300">
                      <span className="text-zinc-400 font-mono text-[11px] mt-0.5">↳</span>
                      <span className="line-clamp-1">{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Launch Button */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  {problem.bestScore ? (
                    <div className="text-xs font-mono">
                      <span className="text-zinc-400">BEST SCORE: </span>
                      <span className="text-white font-bold">{problem.bestScore}/100</span>
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-zinc-400">
                      NOT ATTEMPTED
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onSelectProblem(problem.slug || problem.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black hover:bg-zinc-200 transition-all text-xs font-semibold uppercase tracking-wider"
                >
                  <span>Launch Workspace</span>
                  <span className="text-[15px] leading-none">✳︎</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
