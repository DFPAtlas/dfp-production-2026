'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

interface ProjectNode {
  id: string;
  name: string;
  sector: string;
  status: string;
  description: string;
  capabilities: string[];
  icon: string;
  color: string;
  angle: number;
  distance: number;
  href?: string;
}

const projectNodes: ProjectNode[] = [
  { id: 'quickguard', name: 'QuickGuard', sector: 'Security Marketplace', status: 'In Development', description: 'Temporary security staffing marketplace with guard accounts, client accounts, job posting, matching, subscriptions, compliance and payment workflows.', capabilities: ['Marketplace', 'Payments', 'Compliance', 'Matching', 'Staff Portals', 'Client Portals'], icon: 'ri-shield-check-line', color: '#F97316', angle: -80, distance: 165, href: '/products/quickguard' },
  { id: 'guardianhub', name: 'GuardianHub', sector: 'Security Operations', status: 'In Development', description: 'Security company operations platform covering rotas, patrols, incidents, compliance, client portals and guard operations.', capabilities: ['Operations', 'Rotas', 'Compliance', 'Portals', 'Incidents', 'Patrols'], icon: 'ri-building-line', color: '#10B981', angle: -40, distance: 150, href: '/products/guardianhub' },
  { id: 'lethub', name: 'LetHub', sector: 'Property Tech', status: 'In Development', description: 'Property and lettings operations platform with landlord, tenant and staff workflows, maintenance, documents, compliance and inspections.', capabilities: ['Property', 'Documents', 'Workflows', 'Portals', 'Compliance', 'Inspections'], icon: 'ri-home-4-line', color: '#2563EB', angle: 0, distance: 170, href: '/products/lethub' },
  { id: 'fisheryhub', name: 'FisheryHub', sector: 'Leisure Tech', status: 'In Development', description: 'Fishing-lake management and booking platform with owner tools, maps, swims, memberships, QR check-in and catch reporting.', capabilities: ['Bookings', 'Maps', 'Memberships', 'QR', 'Check-In', 'Reporting'], icon: 'ri-anchor-line', color: '#06B6D4', angle: 40, distance: 155 },
  { id: 'homaura', name: 'HomAura', sector: 'Smart Home', status: 'Concept Development', description: 'Smart-home platform and business ecosystem for monitoring, device support, third-party installation guidance and connected-home management.', capabilities: ['Smart Home', 'Monitoring', 'Support', 'Devices', 'Installation', 'Ecosystem'], icon: 'ri-home-wifi-line', color: '#7C3AED', angle: 80, distance: 160 },
  { id: 'corevia', name: 'Corevia AI', sector: 'AI Platform', status: 'In Development', description: 'Private company AI workforce platform built from company documents, systems, workflows and internal knowledge.', capabilities: ['AI', 'Documents', 'Workflows', 'Private', 'Knowledge Base', 'Company AI'], icon: 'ri-robot-line', color: '#EC4899', angle: 120, distance: 145 },
  { id: 'dataharbour', name: 'DataHarbour', sector: 'Data Intelligence', status: 'Prototype', description: 'Data intelligence and packaged insight platform with controlled data operations and administrative systems.', capabilities: ['Data', 'Analytics', 'Admin', 'Insights', 'Packaged Data', 'Operations'], icon: 'ri-database-2-line', color: '#0891B2', angle: 160, distance: 150 },
  { id: 'homvia', name: 'Homvia', sector: 'Home Improvement', status: 'Prototype', description: 'AI-assisted home-improvement planning, tradesperson matching, project management, staged payments and homeowner support.', capabilities: ['AI', 'Matching', 'Payments', 'Planning', 'Project Mgmt', 'Staged Payments'], icon: 'ri-tools-line', color: '#D97706', angle: 200, distance: 165 },
];

const statusStyles: Record<string, string> = {
  'Operational': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Preparing for Launch': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'Testing': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'In Development': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Platform Build': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Prototype': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Internal System': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Concept Development': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

interface Props {
  cursorPos?: { x: number; y: number };
  isTouch?: boolean;
  reducedMotion?: boolean;
}

export default function EcosystemVisual({ cursorPos, isTouch, reducedMotion }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [entrancePhase, setEntrancePhase] = useState(0);
  const nodeCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const phases = reducedMotion ? [100, 300] : [180, 500, 900, 1200, 1600];
    const timers = phases.map((delay, i) =>
      setTimeout(() => setEntrancePhase(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [mounted, reducedMotion]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNode) {
        setSelectedNode(null);
        setActiveNode(null);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [selectedNode]);

  const cx = 260;
  const cy = 240;

  const handleNodeInteraction = useCallback((id: string | null) => {
    if (nodeCloseTimeout.current) clearTimeout(nodeCloseTimeout.current);
    setActiveNode(id);
  }, []);

  const handleNodeSelect = useCallback((id: string) => {
    if (nodeCloseTimeout.current) clearTimeout(nodeCloseTimeout.current);
    setSelectedNode(prev => prev === id ? null : id);
    setActiveNode(prev => prev === id ? null : id);
  }, []);

  const handleNodeLeave = useCallback(() => {
    nodeCloseTimeout.current = setTimeout(() => {
      if (!selectedNode) setActiveNode(null);
    }, 150);
  }, [selectedNode]);

  const selectedProject = selectedNode ? projectNodes.find(n => n.id === selectedNode) : null;
  const activeProject = activeNode ? projectNodes.find(n => n.id === activeNode) : null;
  const displayNode = selectedProject || activeProject;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[480px] lg:min-h-[560px] flex items-center justify-center select-none"
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 520 480"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="ecoBgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(6,182,212,0.12)" />
            <stop offset="40%" stopColor="rgba(6,182,212,0.02)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="ecoBgGlow2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(148,163,184,0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="ecoGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="ecoGlowStrong">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="520" height="480" fill="url(#ecoBgGlow2)" opacity={entrancePhase >= 1 ? 1 : 0} style={{ transition: 'opacity 0.8s ease' }} />

        <circle cx={cx} cy={cy} r="190" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.8" opacity={entrancePhase >= 1 ? 1 : 0} />
        <circle cx={cx} cy={cy} r="115" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="2 10" opacity={entrancePhase >= 1 ? 1 : 0} />

        <circle cx={cx} cy={cy} r="50" fill="url(#ecoBgGlow)" opacity={entrancePhase >= 1 ? 1 : 0} style={{ transition: 'opacity 0.8s ease' }} />

        {entrancePhase >= 2 && projectNodes.map((node, i) => {
          const angle = node.angle * Math.PI / 180;
          const nx = cx + node.distance * Math.cos(angle);
          const ny = cy + node.distance * Math.sin(angle);
          const isActive = activeNode === node.id || selectedNode === node.id;
          const isDimmed = (activeNode || selectedNode) && activeNode !== node.id && selectedNode !== node.id;

          return (
            <g key={node.id}>
              <line
                x1={cx} y1={cy} x2={nx} y2={ny}
                stroke={isActive ? node.color : isDimmed ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)'}
                strokeWidth={isActive ? 1 : 0.4}
                strokeDasharray={isActive ? 'none' : '3 8'}
                style={{ transition: 'all 0.5s ease' }}
              />

              {isActive && !reducedMotion && (
                <line
                  x1={cx} y1={cy} x2={nx} y2={ny}
                  stroke={node.color}
                  strokeWidth="1.5"
                  strokeDasharray="2 10"
                  opacity="0.4"
                >
                  <animate attributeName="strokeDashoffset" from="0" to="-24" dur="1.8s" repeatCount="indefinite" />
                </line>
              )}

              <circle
                cx={nx} cy={ny} r={isActive ? 4 : 2.5}
                fill={isActive ? node.color : isDimmed ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)'}
                opacity={isActive ? 1 : isDimmed ? 0.3 : 0.6}
                filter={isActive ? 'url(#ecoGlowStrong)' : 'url(#ecoGlow)'}
                style={{ transition: 'all 0.5s ease' }}
              />

              {isActive && !reducedMotion && (
                <circle cx={nx} cy={ny} r="8" fill="none" stroke={node.color} strokeWidth="0.5" opacity="0.5">
                  <animate attributeName="r" from="8" to="18" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="2.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      <div
        className="absolute z-20"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%)${!isTouch && !reducedMotion && cursorPos ? ` translate(${(cursorPos.x - 50) * 0.02}px, ${(cursorPos.y - 50) * 0.02}px)` : ''}`,
          opacity: entrancePhase >= 2 ? 1 : 0,
          transition: 'opacity 0.8s ease 0.3s, transform 0.3s ease-out',
        }}
      >
        <div className="relative w-[80px] h-[80px]">
          {!reducedMotion && <div className="absolute inset-0 rounded-full bg-[#06B6D4]/15 animate-ping-slow-eco" />}
          <div className="absolute inset-0 rounded-full border border-[#06B6D4]/20" />
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#0F1D32] to-[#0A1628] border-2 border-[#06B6D4]/25 flex items-center justify-center" style={{ boxShadow: '0 0 40px rgba(6,182,212,0.12)' }}>
            <img
              src="https://storage.readdy-site.link/project_files/9c829bf4-c727-45a7-99f8-358e1780c66a/eee9f9ba-b907-488b-a1a8-f6d02534a71b_compressed_Remove-Background-Keep-Foot-Logo.webp"
              alt="Digital Footprint"
              className="w-12 h-12 object-contain"
            />
          </div>
        </div>
      </div>

      <div
        className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm"
        style={{ opacity: entrancePhase >= 3 ? 1 : 0, transition: 'opacity 0.5s ease' }}
      >
        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
          {!reducedMotion && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          {reducedMotion && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          Active Builds
        </span>
      </div>

      <div
        className="absolute bottom-3 left-3 z-20 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm"
        style={{ opacity: entrancePhase >= 3 ? 1 : 0, transition: 'opacity 0.5s ease 0.15s' }}
      >
        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
          <i className="ri-flow-chart w-3 h-3 flex items-center justify-center text-[#06B6D4]" />
          SaaS · AI · Cloud · Local
        </span>
      </div>

      {projectNodes.map((node, i) => {
        const angle = node.angle * Math.PI / 180;
        const nx = 50 + (Math.cos(angle) * node.distance / 520) * 100;
        const ny = 50 + (Math.sin(angle) * node.distance / 480) * 100;
        const isActive = activeNode === node.id || selectedNode === node.id;
        const isDimmed = (activeNode || selectedNode) && activeNode !== node.id && selectedNode !== node.id;

        return (
          <button
            key={`label-${node.id}`}
            className="absolute z-20 cursor-pointer focus:outline-none"
            style={{
              left: `${nx}%`,
              top: `${ny}%`,
              transform: 'translate(-50%, -50%)',
              opacity: isDimmed ? 0.4 : entrancePhase >= 4 ? 1 : 0,
              transition: `opacity 0.5s ease ${0.7 + i * 0.06}s`,
            }}
            onMouseEnter={() => handleNodeInteraction(node.id)}
            onMouseLeave={handleNodeLeave}
            onClick={() => handleNodeSelect(node.id)}
            onFocus={() => handleNodeInteraction(node.id)}
            onBlur={handleNodeLeave}
            aria-label={`${node.name} — ${node.status}. ${node.sector}. Click for details.`}
          >
            <div
              className="px-2.5 py-1.5 rounded-lg border transition-all duration-400 backdrop-blur-sm"
              style={{
                backgroundColor: isActive ? `${node.color}18` : 'rgba(255,255,255,0.02)',
                borderColor: isActive ? `${node.color}50` : 'rgba(255,255,255,0.05)',
                boxShadow: isActive ? `0 0 18px ${node.color}12` : 'none',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-white/90 whitespace-nowrap">{node.name}</span>
                <span className={`text-[8px] font-medium whitespace-nowrap px-1.5 py-0.5 rounded-full border ${statusStyles[node.status] || statusStyles['Concept Development']}`}>
                  {node.status}
                </span>
              </div>
            </div>
          </button>
        );
      })}

      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[280px] sm:w-[320px] transition-all duration-300 ${displayNode ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
      >
        <div
          className="rounded-2xl border p-5 backdrop-blur-xl"
          style={{
            backgroundColor: 'rgba(10,22,40,0.95)',
            borderColor: displayNode ? `${displayNode.color}25` : 'transparent',
            boxShadow: displayNode ? `0 0 30px ${displayNode.color}10` : 'none',
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: displayNode ? `${displayNode.color}18` : 'transparent' }}>
                <i className={`${displayNode?.icon || ''} text-base w-5 h-5 flex items-center justify-center`} style={{ color: displayNode?.color }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{displayNode?.name || ''}</p>
                <p className="text-[10px] text-slate-400">{displayNode?.sector || ''}</p>
              </div>
            </div>
            <button
              onClick={() => { setSelectedNode(null); setActiveNode(null); }}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30 rounded"
              aria-label="Close project details"
            >
              <i className="ri-close-line w-4 h-4 flex items-center justify-center" />
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-3">{displayNode?.description || ''}</p>

          <div className="flex flex-wrap gap-1 mb-3">
            {(displayNode?.capabilities || []).slice(0, 3).map((cap) => (
              <span key={cap} className="px-2 py-0.5 rounded-md text-[9px] font-medium text-slate-300 bg-white/[0.04] border border-white/[0.05]">
                {cap}
              </span>
            ))}
          </div>

          {displayNode?.href ? (
            <Link
              href={displayNode.href}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white/30 rounded px-1 py-0.5"
              style={{ color: displayNode.color }}
            >
              View Project Details
              <i className="ri-arrow-right-line w-3 h-3 flex items-center justify-center" />
            </Link>
          ) : (
            <p className="text-[10px] text-slate-600 italic">Case study in production</p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes ping-slow-eco {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 0.08; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        .animate-ping-slow-eco {
          animation: ping-slow-eco 3.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-ping-slow-eco { animation: none; }
        }
      `}</style>
    </div>
  );
}