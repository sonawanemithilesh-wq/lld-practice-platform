import React from 'react';

interface ScoreGaugeProps {
  score: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
}

export function ScoreGauge({ score, size = 120, strokeWidth = 8 }: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            className="text-zinc-900"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="text-white stroke-white transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-mono font-bold tracking-tight text-white">{clampedScore}</span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">/ 100 PTS</span>
        </div>
      </div>

      <div className="mt-3 px-3 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest border border-white/20 bg-white/5 text-zinc-300">
        {clampedScore >= 80 ? 'HIGH MODULARITY' : clampedScore >= 50 ? 'VIABLE SPEC' : 'REDESIGN REQUIRED'}
      </div>
    </div>
  );
}
