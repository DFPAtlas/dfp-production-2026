'use client';

interface SparklineMiniProps {
  color?: string;
}

export default function SparklineMini({ color = '#22d3ee' }: SparklineMiniProps) {
  const data = [30, 35, 32, 40, 45, 42, 50, 55, 52, 60, 65, 72];
  const width = 180;
  const height = 30;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="mt-2">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}