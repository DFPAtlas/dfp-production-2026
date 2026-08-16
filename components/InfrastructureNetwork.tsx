'use client';

import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  icon: string;
  label: string;
  color: string;
  status: string;
  metric: string;
}

export default function InfrastructureNetwork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      tiltRef.current = {
        x: ((e.clientX - cx) / rect.width) * 8,
        y: ((e.clientY - cy) / rect.height) * 8,
      };
      container.style.setProperty('--tilt-x', `${tiltRef.current.y}deg`);
      container.style.setProperty('--tilt-y', `${-tiltRef.current.x}deg`);
    };

    const onMouseLeave = () => {
      tiltRef.current = { x: 0, y: 0 };
      container.style.setProperty('--tilt-x', '0deg');
      container.style.setProperty('--tilt-y', '0deg');
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);
    return () => {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes dfp-mesh-pulse { 0%,100%{opacity:.06} 50%{opacity:.12} }
      @keyframes dfp-line-flow { to { stroke-dashoffset: -28; } }
      @keyframes dfp-ring-flow-a { to { stroke-dashoffset: -20; } }
      @keyframes dfp-ring-flow-b { to { stroke-dashoffset: -14; } }
      @keyframes dfp-packet-a {
        0%{offset-distance:0%;opacity:0}
        10%{opacity:1}
        90%{opacity:1}
        100%{offset-distance:100%;opacity:0}
      }
      @keyframes dfp-packet-b {
        0%{offset-distance:100%;opacity:0}
        10%{opacity:1}
        90%{opacity:1}
        100%{offset-distance:0%;opacity:0}
      }
      @keyframes dfp-hub-ping {
        0%{transform:scale(.6);opacity:.4}
        100%{transform:scale(1.6);opacity:0}
      }
      @keyframes dfp-hub-spin { to { transform: rotate(360deg); } }
      @keyframes dfp-hub-spin-r { to { transform: rotate(-360deg); } }
      @keyframes dfp-float-p { 0%,100%{transform:translate(0,0);opacity:.25} 50%{transform:translate(8px,-14px);opacity:.55} }
      @keyframes dfp-node-glow { 0%,100%{opacity:.5} 50%{opacity:.9} }
      @keyframes dfp-metric-tick { 0%,100%{opacity:.7} 50%{opacity:1} }
      @keyframes dfp-heartbeat {
        0%  { transform: scale(1);   opacity: .4; }
        12% { transform: scale(1.22); opacity: .8; }
        24% { transform: scale(1.1);  opacity: .55; }
        36% { transform: scale(1.28); opacity: .85; }
        55% { transform: scale(1);   opacity: .4; }
        100%{ transform: scale(1);   opacity: .4; }
      }
      @keyframes dfp-heartbeat-glow {
        0%  { box-shadow: 0 0 10px rgba(6,182,212,.12); }
        12% { box-shadow: 0 0 36px rgba(6,182,212,.45); }
        24% { box-shadow: 0 0 24px rgba(6,182,212,.3); }
        36% { box-shadow: 0 0 44px rgba(6,182,212,.55); }
        55% { box-shadow: 0 0 10px rgba(6,182,212,.12); }
        100%{ box-shadow: 0 0 10px rgba(6,182,212,.12); }
      }
      @keyframes dfp-heartbeat-ring {
        0%  { transform: scale(1);   opacity: .5; }
        12% { transform: scale(1.5); opacity: .2; }
        24% { transform: scale(1.25); opacity: .35; }
        36% { transform: scale(1.6); opacity: .15; }
        55% { transform: scale(1);   opacity: .5; }
        100%{ transform: scale(1);   opacity: .5; }
      }
      @keyframes dfp-node-border-pulse {
        0%, 100% { box-shadow: 0 0 0px var(--node-color, #06B6D4); }
        50% { box-shadow: 0 0 14px var(--node-color, #06B6D4), 0 0 28px var(--node-color, #06B6D4)33; }
      }
            .dfp-node-card:hover {
              transform: translateY(-3px);
              box-shadow: 0 8px 28px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
            }
            .dfp-node-card.group-hover-glow {
              animation: dfp-node-border-pulse 2s ease-in-out infinite;
            }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const cx = 250;
  const cy = 250;
  const outerR = 160;
  const innerR = 95;

  const nodes: Node[] = [
    { x: cx, y: cy, icon: 'ri-fingerprint-line', label: 'DFP Core', color: '#06B6D4', status: 'Online', metric: '' },
    { x: cx + outerR * Math.cos(-90 * Math.PI / 180), y: cy + outerR * Math.sin(-90 * Math.PI / 180), icon: 'ri-robot-line', label: 'AI Agents', color: '#A855F7', status: 'Processing', metric: '2.4k req/min' },
    { x: cx + outerR * Math.cos(-30 * Math.PI / 180), y: cy + outerR * Math.sin(-30 * Math.PI / 180), icon: 'ri-cloud-line', label: 'Cloud', color: '#06B6D4', status: 'Healthy', metric: '99.98% uptime' },
    { x: cx + outerR * Math.cos(30 * Math.PI / 180), y: cy + outerR * Math.sin(30 * Math.PI / 180), icon: 'ri-code-s-slash-line', label: 'Websites', color: '#F97316', status: 'Deploying', metric: '47 live' },
    { x: cx + outerR * Math.cos(90 * Math.PI / 180), y: cy + outerR * Math.sin(90 * Math.PI / 180), icon: 'ri-shield-check-line', label: 'Security', color: '#22C55E', status: 'Protected', metric: '0 breaches' },
    { x: cx + outerR * Math.cos(150 * Math.PI / 180), y: cy + outerR * Math.sin(150 * Math.PI / 180), icon: 'ri-flow-chart', label: 'Automation', color: '#EF4444', status: 'Running', metric: '128 flows' },
    { x: cx + outerR * Math.cos(210 * Math.PI / 180), y: cy + outerR * Math.sin(210 * Math.PI / 180), icon: 'ri-server-line', label: 'Infra', color: '#EAB308', status: 'Scaled', metric: '12 regions' },
  ];

  const hub = nodes[0];
  const outerNodes = nodes.slice(1);

  const connections: { a: number; b: number; dur: number; delay: number }[] = [];
  for (let i = 1; i < nodes.length; i++) {
    connections.push({ a: 0, b: i, dur: 2.2 + (i % 3) * 0.3, delay: (i - 1) * 0.25 });
  }
  for (let i = 1; i < nodes.length; i++) {
    const next = i === nodes.length - 1 ? 1 : i + 1;
    connections.push({ a: i, b: next, dur: 3.0 + (i % 2) * 0.4, delay: i * 0.18 });
  }

  return (
    <div ref={containerRef} className="dfp-mesh-container relative w-full h-full min-h-[520px] lg:min-h-[600px] flex items-center justify-center select-none overflow-hidden">
      <div className="dfp-mesh-inner relative w-[500px] h-[500px] mx-auto">

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 65%)', animation: 'dfp-mesh-pulse 5s ease-in-out infinite' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 60%)', animation: 'dfp-mesh-pulse 4s ease-in-out infinite 1s' }} />

        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]" viewBox="0 0 500 500">
          <defs>
            <pattern id="hexMesh2" width="24" height="42" patternUnits="userSpaceOnUse">
              <path d="M12 0 L24 7 L24 21 L12 28 L0 21 L0 7 Z" fill="none" stroke="rgba(6,182,212,0.7)" strokeWidth=".5" />
            </pattern>
          </defs>
          <rect width="500" height="500" fill="url(#hexMesh2)" />
        </svg>

        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="hubGlow3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(6,182,212,0.25)" />
              <stop offset="50%" stopColor="rgba(6,182,212,0.06)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id="glow3">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glow2">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <circle cx={hub.x} cy={hub.y} r="50" fill="url(#hubGlow3)" />

          <circle cx={hub.x} cy={hub.y} r={outerR} fill="none" stroke="rgba(6,182,212,0.08)" strokeWidth="1" />
          <circle cx={hub.x} cy={hub.y} r={outerR} fill="none" stroke="rgba(6,182,212,0.18)" strokeWidth="1.5" strokeDasharray="4 10" style={{ animation: 'dfp-ring-flow-a 3.5s linear infinite' }} />

          <circle cx={hub.x} cy={hub.y} r={innerR} fill="none" stroke="rgba(6,182,212,0.06)" strokeWidth="1" strokeDasharray="2 6" />
          <circle cx={hub.x} cy={hub.y} r={innerR} fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1" strokeDasharray="1 4" style={{ animation: 'dfp-ring-flow-b 5s linear infinite reverse' }} />

          <circle cx={hub.x} cy={hub.y} r="55" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1" style={{ animation: 'dfp-hub-ping 2.5s ease-out infinite' }} />
          <circle cx={hub.x} cy={hub.y} r="55" fill="none" stroke="rgba(6,182,212,0.1)" strokeWidth="1" style={{ animation: 'dfp-hub-ping 2.5s ease-out infinite 1.25s' }} />

          <g style={{ transformOrigin: `${hub.x}px ${hub.y}px`, animation: 'dfp-hub-spin 14s linear infinite' }}>
            <circle cx={hub.x} cy={hub.y} r="32" fill="none" stroke="rgba(6,182,212,0.1)" strokeWidth=".8" />
            <circle cx={hub.x} cy={hub.y} r="22" fill="none" stroke="rgba(6,182,212,0.06)" strokeWidth=".5" />
          </g>
          <g style={{ transformOrigin: `${hub.x}px ${hub.y}px`, animation: 'dfp-hub-spin-r 10s linear infinite' }}>
            <circle cx={hub.x} cy={hub.y} r="28" fill="none" stroke="rgba(6,182,212,0.08)" strokeWidth=".6" strokeDasharray="3 6" />
          </g>

          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <circle key={`hbd-${i}`} cx={hub.x + 36 * Math.cos((deg - 90) * Math.PI / 180)} cy={hub.y + 36 * Math.sin((deg - 90) * Math.PI / 180)} r="1.5" fill="#06B6D4" opacity="0.35" style={{ animation: 'dfp-node-glow 2.2s ease-in-out infinite', animationDelay: `${i * 0.35}s` }} />
          ))}

          {connections.map((c, i) => (
            <line key={`base-${i}`} x1={nodes[c.a].x} y1={nodes[c.a].y} x2={nodes[c.b].x} y2={nodes[c.b].y} stroke="rgba(6,182,212,0.05)" strokeWidth="1" />
          ))}

          {connections.map((c, i) => (
            <line key={`flow-${i}`} x1={nodes[c.a].x} y1={nodes[c.a].y} x2={nodes[c.b].x} y2={nodes[c.b].y}
              stroke="rgba(6,182,212,0.2)" strokeWidth="1.5" strokeDasharray="4 14"
              style={{ animation: `dfp-line-flow ${c.dur}s linear infinite`, animationDelay: `${c.delay}s` }} />
          ))}

          {connections.map((c, i) => {
            const na = nodes[c.a];
            const nb = nodes[c.b];
            const pathD = `M${na.x},${na.y} L${nb.x},${nb.y}`;
            const color = i % 2 === 0 ? '#06B6D4' : (c.a === 0 ? nb.color : na.color);
            return (
              <g key={`pkt-${i}`}>
                <path d={pathD} fill="none" id={`path-${i}`} />
                <circle r="2.5" fill={color} filter="url(#glow2)" opacity="0">
                  <animateMotion dur={`${c.dur}s`} repeatCount="indefinite" begin={`${c.delay}s`}>
                    <mpath href={`#path-${i}`} />
                  </animateMotion>
                  <animate attributeName="opacity" values="0;1;1;0" dur={`${c.dur}s`} repeatCount="indefinite" begin={`${c.delay}s`} />
                </circle>
              </g>
            );
          })}

          {outerNodes.map((n, i) => (
            <circle key={`nglow-${i}`} cx={n.x} cy={n.y} r="18" fill={n.color} opacity="0.06" style={{ animation: 'dfp-mesh-pulse 3s ease-in-out infinite', animationDelay: `${i * 0.5}s` }} />
          ))}
        </svg>

        <div className="absolute z-30"
          style={{ left: hub.x, top: hub.y, transform: 'translate(-50%, -50%)' }}>
          <div className="relative w-[66px] h-[66px] sm:w-[78px] sm:h-[78px]">
            {/* Heartbeat layers behind the logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#06B6D4]/20"
                style={{ animation: 'dfp-heartbeat 1.8s ease-in-out infinite' }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full rounded-full border-2 border-[#06B6D4]/30"
                style={{ animation: 'dfp-heartbeat-ring 1.8s ease-in-out infinite' }} />
            </div>

            {/* Logo on top */}
            <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-[#06B6D4]/30 via-[#0891B2]/12 to-transparent border-2 border-[#06B6D4]/35 backdrop-blur-md flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.2),inset_0_0_25px_rgba(6,182,212,0.1)]">
              <img
                src="https://storage.readdy-site.link/project_files/9c829bf4-c727-45a7-99f8-358e1780c66a/eee9f9ba-b907-488b-a1a8-f6d02534a71b_compressed_Remove-Background-Keep-Foot-Logo.webp"
                alt="DFP"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]"
              />
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
              <span className="text-[10px] font-bold text-[#06B6D4] tracking-widest uppercase">DFP Core</span>
            </div>
          </div>
        </div>

        {outerNodes.map((n, i) => (
          <div key={`node-${i}`} className="absolute z-30 group"
            style={{ left: n.x, top: n.y, transform: 'translate(-50%, -50%)' }}>
            <div className="relative">
              <div className="absolute -inset-8 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle, ${n.color}12 0%, transparent 70%)` }} />

              <div className="relative dfp-node-card rounded-xl px-3 py-2.5 flex items-center gap-2.5 border border-white/50 group-hover:border-white/70 transition-all duration-300 min-w-[120px] cursor-default backdrop-blur-sm bg-white/25 shadow-[0_1px_4px_rgba(0,0,0,0.04)] group-hover:[animation:dfp-node-border-pulse_2s_ease-in-out_infinite]" style={{ ['--node-color' as string]: n.color }}>
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: n.color + '18' }}>
                    <i className={`${n.icon} text-sm w-4 h-4 flex items-center justify-center`} style={{ color: n.color }} />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-[7px] h-[7px] rounded-full border border-white"
                    style={{ backgroundColor: n.color, animation: 'dfp-node-glow 2s ease-in-out infinite', animationDelay: `${i * 0.3}s` }} />
                </div>
                <div className="leading-none">
                  <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap block">{n.label}</span>
                  <span className="text-[9px] font-medium whitespace-nowrap block mt-0.5" style={{ color: n.color }}>{n.status}</span>
                  <span className="text-[8px] text-slate-400 whitespace-nowrap block mt-0.5" style={{ animation: 'dfp-metric-tick 3s ease-in-out infinite', animationDelay: `${i * 0.7}s` }}>{n.metric}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {[
          { t: '18%', l: '22%', s: 'dfp-float-p', d: '0s', c: '#06B6D4' },
          { t: '65%', l: '14%', s: 'dfp-float-p', d: '0.9s', c: '#22D3EE' },
          { t: '26%', l: '78%', s: 'dfp-float-p', d: '1.5s', c: '#A855F7' },
          { t: '72%', l: '74%', s: 'dfp-float-p', d: '0.4s', c: '#22C55E' },
          { t: '55%', l: '88%', s: 'dfp-float-p', d: '2.1s', c: '#F97316' },
          { t: '82%', l: '30%', s: 'dfp-float-p', d: '1.1s', c: '#06B6D4' },
          { t: '38%', l: '8%', s: 'dfp-float-p', d: '1.8s', c: '#EF4444' },
          { t: '12%', l: '55%', s: 'dfp-float-p', d: '0.6s', c: '#EAB308' },
        ].map((p, i) => (
          <div key={`fp-${i}`} className="absolute w-1.5 h-1.5 rounded-full"
            style={{ top: p.t, left: p.l, backgroundColor: p.c, opacity: 0.2, animation: `${p.s} ${3 + (i % 2)}s ease-in-out infinite`, animationDelay: p.d }} />
        ))}

        <div className="absolute top-[6%] right-[4%] glass-card-sm rounded-lg px-3 py-2 flex items-center gap-2 border border-slate-100">
          <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ animation: 'dfp-node-glow 2s ease-in-out infinite' }} />
          <span className="text-[10px] font-medium text-slate-500">Network Online</span>
        </div>
        <div className="absolute bottom-[8%] left-[4%] glass-card-sm rounded-lg px-3 py-2 flex items-center gap-2 border border-slate-100">
          <i className="ri-shield-check-line w-3 h-3 flex items-center justify-center text-[#22C55E]" />
          <span className="text-[10px] font-medium text-slate-500">All Systems Secure</span>
        </div>
      </div>
    </div>
  );
}