'use client';

interface RadarChartProps {
  domains: Array<{ label: string; value: number; status: string }>;
}

export default function RadarChart({ domains }: RadarChartProps) {
  const size = 140;
  const center = size / 2;
  const radius = 52;
  const levels = 4;

  const angle = (i: number) => (Math.PI * 2 * i) / domains.length - Math.PI / 2;

  const getPoint = (value: number, i: number) => {
    const r = (value / 100) * radius;
    const a = angle(i);
    return {
      x: center + r * Math.cos(a),
      y: center + r * Math.sin(a),
    };
  };

  const gridPolygons = Array.from({ length: levels }, (_, level) => {
    const r = ((level + 1) / levels) * radius;
    return domains
      .map((_, i) => {
        const a = angle(i);
        return `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`;
      })
      .join(' ');
  });

  const dataPoints = domains
    .map((d, i) => {
      const p = getPoint(d.value, i);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  const labelPoints = domains.map((d, i) => {
    const a = angle(i);
    const labelRadius = radius + 18;
    return {
      x: center + labelRadius * Math.cos(a),
      y: center + labelRadius * Math.sin(a),
      label: d.label,
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {gridPolygons.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}

        {/* Axes */}
        {domains.map((_, i) => {
          const a = angle(i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(a)}
              y2={center + radius * Math.sin(a)}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data area */}
        <polygon
          points={dataPoints}
          fill="rgba(34,211,238,0.08)"
          stroke="#22d3ee"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {domains.map((d, i) => {
          const p = getPoint(d.value, i);
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              fill="#22d3ee"
            />
          );
        })}

        {/* Center glow */}
        <circle cx={center} cy={center} r="4" fill="#22d3ee" fillOpacity="0.3" />
        <circle cx={center} cy={center} r="2" fill="#22d3ee" />
      </svg>

      <div className="mt-2 flex items-center gap-4">
        {domains.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[9px] text-slate-500">{d.label}</span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-white">{d.value}</span>
              <span
                className={`text-[9px] ${
                  d.status === 'At Risk'
                    ? 'text-orange-400'
                    : d.status === 'Healthy' || d.status === 'Strong'
                      ? 'text-emerald-400'
                      : 'text-cyan-400'
                }`}
              >
                {d.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}