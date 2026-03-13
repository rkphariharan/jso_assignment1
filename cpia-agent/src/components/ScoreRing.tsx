'use client';

import { scoreColor } from '@/lib/utils';

type Props = {
  score: number;
  size?: number;
  label?: string;
};

export default function ScoreRing({ score, size = 80, label }: Props) {
  const radius = (size - 12) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="text-center -mt-[68px] flex flex-col items-center justify-center" style={{ height: size }}>
        <span className={`font-bold text-lg ${scoreColor(score)}`}>{score}</span>
        <span className="text-[10px] text-gray-400">/100</span>
      </div>
      {label && <span className="text-xs text-gray-500 font-medium mt-1">{label}</span>}
    </div>
  );
}
