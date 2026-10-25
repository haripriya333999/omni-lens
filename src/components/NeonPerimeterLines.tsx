import React from 'react';

interface NeonPerimeterLinesProps {
  reduceMotion?: boolean;
}

export const NeonPerimeterLines: React.FC<NeonPerimeterLinesProps> = ({ reduceMotion = false }) => {
  // 8 distinct colors as shown in the reference image
  const lineColors = [
    { stroke: '#FFFFFF', shadow: 'rgba(255,255,255,0.7)', width: 2.2 },
    { stroke: '#00F0FF', shadow: 'rgba(0,240,255,0.7)', width: 2.2 },
    { stroke: '#2563EB', shadow: 'rgba(37,99,235,0.7)', width: 2.2 },
    { stroke: '#EC4899', shadow: 'rgba(236,72,153,0.7)', width: 2.2 },
    { stroke: '#D946EF', shadow: 'rgba(217,70,239,0.7)', width: 2.2 },
    { stroke: '#EF4444', shadow: 'rgba(239,68,68,0.7)', width: 2.2 },
    { stroke: '#F97316', shadow: 'rgba(249,115,22,0.7)', width: 2.2 },
    { stroke: '#EAB308', shadow: 'rgba(234,179,8,0.7)', width: 2.2 },
  ];

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <svg
        className={`w-full h-full ${reduceMotion ? '' : 'neon-curves-ambient'}`}
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Left Flank & Top-Left Undulating Neon Stream (matching image_89f6a0e3 and image_e7ecfc04) */}
        <g filter="url(#neon-glow)" opacity="0.95">
          {lineColors.map((line, idx) => {
            const offset = idx * 6.5;
            // Elegant S-curve flowing down left border with soft bends
            return (
              <path
                key={`left-${idx}`}
                d={`M ${18 + offset} -20 
                    C ${40 + offset} 120, ${10 + offset} 240, ${65 + offset} 380 
                    C ${110 + offset} 500, ${15 + offset} 640, ${45 + offset} 780 
                    C ${75 + offset} 890, ${20 + offset} 980, ${30 + offset} 1030`}
                fill="none"
                stroke={line.stroke}
                strokeWidth={line.width}
                strokeLinecap="round"
                className={reduceMotion ? '' : `neon-stream-left neon-delay-${idx}`}
                style={{
                  filter: `drop-shadow(0 0 4px ${line.shadow})`,
                  opacity: 0.9 - idx * 0.04,
                }}
              />
            );
          })}
        </g>

        {/* 2. Bottom Wave Flow across the base of the viewport */}
        <g filter="url(#neon-glow)" opacity="0.92">
          {lineColors.map((line, idx) => {
            const offset = idx * 6.5;
            return (
              <path
                key={`bottom-${idx}`}
                d={`M -20 ${980 - offset}
                    C 160 ${940 - offset}, 280 ${990 - offset}, 460 ${960 - offset}
                    C 680 ${925 - offset}, 820 ${985 - offset}, 1040 ${950 - offset}
                    C 1260 ${920 - offset}, 1420 ${975 - offset}, 1630 ${930 - offset}`}
                fill="none"
                stroke={line.stroke}
                strokeWidth={line.width}
                strokeLinecap="round"
                className={reduceMotion ? '' : `neon-stream-bottom neon-delay-${idx}`}
                style={{
                  filter: `drop-shadow(0 0 4px ${line.shadow})`,
                  opacity: 0.88 - idx * 0.035,
                }}
              />
            );
          })}
        </g>

        {/* 3. Right & Top-Right Border Curves (subtle echoing flow) */}
        <g filter="url(#neon-glow)" opacity="0.88">
          {lineColors.map((line, idx) => {
            const offset = idx * 6.5;
            return (
              <path
                key={`right-${idx}`}
                d={`M ${1620 - offset} -30
                    C ${1570 - offset} 90, ${1595 - offset} 220, ${1540 - offset} 360
                    C ${1490 - offset} 490, ${1580 - offset} 660, ${1535 - offset} 820
                    C ${1500 - offset} 920, ${1570 - offset} 1010, ${1550 - offset} 1040`}
                fill="none"
                stroke={line.stroke}
                strokeWidth={line.width}
                strokeLinecap="round"
                className={reduceMotion ? '' : `neon-stream-right neon-delay-${idx}`}
                style={{
                  filter: `drop-shadow(0 0 4px ${line.shadow})`,
                  opacity: 0.85 - idx * 0.04,
                }}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};
