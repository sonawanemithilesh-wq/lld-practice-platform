import React from 'react';
import { CriteriaScores } from '../types';

interface RubricBreakdownProps {
  scores: CriteriaScores;
}

export function RubricBreakdown({ scores }: RubricBreakdownProps) {
  const criteria = [
    {
      key: 'solidPrinciples',
      name: 'SOLID Principles',
      score: scores.solidPrinciples ?? 0,
      max: 25,
      description: 'Single Responsibility, Open/Closed, Dependency Inversion abstractions.'
    },
    {
      key: 'classResponsibilities',
      name: 'Class Responsibilities & Modularity',
      score: scores.classResponsibilities ?? 0,
      max: 25,
      description: 'Clean domain boundaries, encapsulation, cohesive methods, no God classes.'
    },
    {
      key: 'extensibility',
      name: 'Extensibility & Design Patterns',
      score: scores.extensibility ?? 0,
      max: 25,
      description: 'Strategic use of GoF patterns (Strategy, State, Factory, Observer).'
    },
    {
      key: 'edgeCases',
      name: 'Edge Cases & Robustness',
      score: scores.edgeCases ?? 0,
      max: 25,
      description: 'Boundaries, error handling, thread safety, and capacity thresholds.'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {criteria.map((item) => {
        const percentage = Math.round((item.score / item.max) * 100);

        return (
          <div
            key={item.key}
            className="p-4 rounded-xl bg-black border border-white/15 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold">
                  {item.name}
                </span>
                <div className="font-mono text-xs">
                  <span className="text-white font-bold">{item.score}</span>
                  <span className="text-zinc-500">/{item.max}</span>
                  <span className="text-zinc-400 ml-1.5 font-normal">({percentage}%)</span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
                {item.description}
              </p>
            </div>

            <div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
