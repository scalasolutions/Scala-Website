"use client";

import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const data = [
  { v: 6 },
  { v: 8 },
  { v: 11 },
  { v: 9 },
  { v: 14 },
  { v: 18 },
  { v: 16 },
  { v: 22 },
  { v: 28 },
  { v: 34 },
  { v: 42 },
  { v: 50 },
];

/**
 * Compact animated sparkline used as a tile flourish. Sized to slot into the
 * bottom-right corner of the bento "Grow" tile — drawn with the same lime
 * gradient as the hero chart so the brand reads consistently.
 */
export default function GrowthSparkline() {
  return (
    <div className="w-[220px] h-[90px] pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkLime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CEF84E" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#CEF84E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke="#CEF84E"
            strokeWidth={2}
            fill="url(#sparkLime)"
            animationDuration={2200}
            animationEasing="ease-out"
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
