import React, { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

interface NavbarProps {
  onNavigateHome: () => void;
  onNavigateLabs?: () => void;
  onOpenRubricModal: () => void;
  onOpenArchitectureModal: () => void;
  onOpenAttemptsModal?: () => void;
  totalAttempts?: number;
  activeProblemTitle?: string;
  activeTab?: 'problems' | 'labs';
}

export function Navbar({
  onNavigateHome,
  onNavigateLabs,
  onOpenRubricModal,
  onOpenArchitectureModal,
  onOpenAttemptsModal,
  totalAttempts = 0,
  activeProblemTitle,
  activeTab = 'problems'
}: NavbarProps) {
  const [isHealthOk, setIsHealthOk] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Probe /api/health
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setIsHealthOk(data?.status === 'ok');
      })
      .catch(() => {
        setIsHealthOk(false);
      });
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full bg-black/80 backdrop-blur-md border-b border-white/10 z-20 px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center">
        {/* Logo (Left) */}
        <div className="flex items-center">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigateHome();
            }}
            className="flex items-center text-left group focus:outline-none"
          >
            <span
              style={{ fontFamily: 'var(--font-heading)' }}
              className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:opacity-80 transition-opacity uppercase"
            >
              LLD_LABS®
            </span>
            <span className="text-[24px] select-none text-white ml-2 leading-none font-normal">
              ✳︎
            </span>
          </button>

          {activeProblemTitle && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-400 border-l border-white/10 ml-5 pl-5">
              <span className="text-zinc-400 uppercase tracking-wider text-[10px]">Challenge:</span>
              <span className="text-white font-medium truncate max-w-xs">{activeProblemTitle}</span>
            </div>
          )}
        </div>

        {/* Nav Links (Center, hidden below md) */}
        <nav className="hidden md:flex items-center space-x-1 text-white text-[16px] sm:text-[18px]">
          <button
            onClick={onNavigateHome}
            className={`hover:opacity-60 transition-opacity focus:outline-none ${
              activeTab === 'problems' ? 'text-white font-semibold underline underline-offset-8' : 'text-zinc-300'
            }`}
          >
            Problems
          </button>
          <span className="text-white/40 select-none">,</span>

          <button
            onClick={onNavigateLabs || onNavigateHome}
            className={`hover:opacity-60 transition-opacity focus:outline-none pl-1.5 ${
              activeTab === 'labs' ? 'text-white font-semibold underline underline-offset-8' : 'text-zinc-300'
            }`}
          >
            Cybersecurity Labs
          </button>
          <span className="text-white/40 select-none">,</span>

          <button
            onClick={() => {
              if (onOpenAttemptsModal) onOpenAttemptsModal();
              else onNavigateHome();
            }}
            className="hover:opacity-60 transition-opacity text-zinc-300 focus:outline-none pl-1.5"
          >
            Attempt History
          </button>
          <span className="text-white/40 select-none">,</span>

          <button
            onClick={onOpenArchitectureModal}
            className="hover:opacity-60 transition-opacity text-zinc-300 focus:outline-none pl-1.5"
          >
            System Architecture
          </button>
          <span className="text-white/40 select-none">,</span>

          <button
            onClick={onOpenRubricModal}
            className="hover:opacity-60 transition-opacity text-zinc-300 focus:outline-none pl-1.5"
          >
            Evaluation Rubric
          </button>
        </nav>

        {/* Right Status (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Health probe & attempt counter pill */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 font-mono">
            <span className="relative flex h-2 w-2">
              {isHealthOk ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </>
              ) : isHealthOk === false ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
              )}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-zinc-300">
              ENGINE: {isHealthOk ? 'LIVE' : 'CONNECTING'}
            </span>
            <span className="text-white/20">|</span>
            <span className="text-[11px] text-zinc-400">
              ATTEMPTS: <span className="text-white font-semibold">{totalAttempts}</span>
            </span>
          </div>
        </div>

        {/* Mobile Menu Button (Hamburger) */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:opacity-70 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className="block h-[1.5px] w-full bg-white transition-all"></span>
                <span className="block h-[1.5px] w-full bg-white transition-all"></span>
                <span className="block h-[1.5px] w-full bg-white transition-all"></span>
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Full-Screen Overlay Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/95 z-30 flex flex-col justify-between p-8 pt-28 md:hidden animate-in fade-in duration-200">
          <div className="flex flex-col space-y-6 text-2xl font-medium">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateHome();
              }}
              className="text-left text-white hover:opacity-60 transition"
            >
              Problems
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onNavigateLabs) onNavigateLabs();
                else onNavigateHome();
              }}
              className="text-left text-white hover:opacity-60 transition"
            >
              Cybersecurity Labs
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenAttemptsModal) onOpenAttemptsModal();
                else onNavigateHome();
              }}
              className="text-left text-white hover:opacity-60 transition"
            >
              Attempt History
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenArchitectureModal();
              }}
              className="text-left text-white hover:opacity-60 transition"
            >
              System Architecture
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRubricModal();
              }}
              className="text-left text-white hover:opacity-60 transition"
            >
              Evaluation Rubric
            </button>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isHealthOk ? 'bg-white' : 'bg-zinc-600'}`}></span>
              <span>ENGINE: {isHealthOk ? 'LIVE' : 'CONNECTING'}</span>
            </div>
            <div>ATTEMPTS: {totalAttempts}</div>
          </div>
        </div>
      )}
    </>
  );
}
