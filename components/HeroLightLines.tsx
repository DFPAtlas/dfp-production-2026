'use client';

import { useEffect, useRef } from 'react';

interface Line {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
  width: number;
  color: string;
}

const COLORS = ['#06B6D4', '#22D3EE', '#0891B2', '#67E8F9', '#A5F3FC'];
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const MAX_DPR = 1.5;

const LINE_COUNTS = {
  mobile: 28,
  tablet: 44,
  desktop: 60,
};

function getLineCount(width: number): number {
  if (width < 640) return LINE_COUNTS.mobile;
  if (width < 1024) return LINE_COUNTS.tablet;
  return LINE_COUNTS.desktop;
}

function spawnLine(w: number, h: number): Line {
  return {
    x: Math.random() * w,
    y: h + Math.random() * 150,
    speed: 0.7 + Math.random() * 1.8,
    length: 40 + Math.random() * 100,
    opacity: 0.05 + Math.random() * 0.18,
    width: 0.3 + Math.random() * 1.1,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

export default function HeroLightLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const linesRef = useRef<Line[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const wRef = useRef(0);
  const hRef = useRef(0);
  const visibleRef = useRef(false);
  const tabVisibleRef = useRef(true);
  const prefersReducedRef = useRef(false);
  const resizeScheduledRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const activeCanvas = canvas;
    const activeCtx = ctx;
    ctxRef.current = ctx;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedRef.current = motionQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedRef.current = e.matches;
      if (!e.matches && visibleRef.current && tabVisibleRef.current) {
        lastFrameTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(drawLoop);
      }
    };

    function resize() {
      const parent = activeCanvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w === 0 || h === 0 || (wRef.current === w && hRef.current === h)) return;
      wRef.current = w;
      hRef.current = h;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      activeCanvas.width = w * dpr;
      activeCanvas.height = h * dpr;
      activeCanvas.style.width = w + 'px';
      activeCanvas.style.height = h + 'px';
      activeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initLines();
    }

    function initLines() {
      const w = wRef.current;
      const h = hRef.current;
      if (w === 0 || h === 0) return;
      const count = getLineCount(w);
      linesRef.current = [];
      for (let i = 0; i < count; i++) {
        linesRef.current.push(spawnLine(w, h));
      }
    }

    function drawFrame() {
      const w = wRef.current;
      const h = hRef.current;
      const ctx = ctxRef.current;
      if (!ctx || w === 0 || h === 0) return;

      ctx.clearRect(0, 0, w, h);

      const lines = linesRef.current;
      const targetX = Math.min(w * 0.12, 160);
      const targetY = -80;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        line.y -= line.speed;

        const progress = 1 - Math.max(0, Math.min(1, line.y / h));
        const pull = progress * progress * 0.015;
        line.x += (targetX - line.x) * pull;

        if (line.y + line.length < targetY) {
          lines[i] = spawnLine(w, h);
          continue;
        }

        const headY = line.y;
        const tailY = line.y + line.length;
        const midY = (headY + tailY) / 2;
        const cpX = line.x + (targetX - line.x) * 0.2;

        ctx.beginPath();
        ctx.moveTo(line.x, tailY);
        ctx.quadraticCurveTo(cpX, midY, line.x + (targetX - line.x) * 0.02, headY);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;
        ctx.globalAlpha = line.opacity;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    function drawReducedMotion() {
      const w = wRef.current;
      const h = hRef.current;
      const ctx = ctxRef.current;
      if (!ctx || w === 0 || h === 0) return;

      ctx.clearRect(0, 0, w, h);

      const lines = linesRef.current;
      const targetX = Math.min(w * 0.12, 160);
      const targetY = -80;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const headY = line.y;
        const tailY = line.y + line.length;
        const midY = (headY + tailY) / 2;
        const cpX = line.x + (targetX - line.x) * 0.2;

        ctx.beginPath();
        ctx.moveTo(line.x, tailY);
        ctx.quadraticCurveTo(cpX, midY, line.x + (targetX - line.x) * 0.02, headY);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;
        ctx.globalAlpha = line.opacity * 0.5;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    function drawLoop(timestamp: number) {
      if (!visibleRef.current || !tabVisibleRef.current) {
        return;
      }

      if (prefersReducedRef.current) {
        drawReducedMotion();
        return;
      }

      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed < FRAME_INTERVAL) {
        rafRef.current = requestAnimationFrame(drawLoop);
        return;
      }

      lastFrameTimeRef.current = timestamp - (elapsed % FRAME_INTERVAL);

      drawFrame();
      rafRef.current = requestAnimationFrame(drawLoop);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = visibleRef.current;
        visibleRef.current = entry.isIntersecting;
        if (visibleRef.current && !wasVisible && tabVisibleRef.current) {
          lastFrameTimeRef.current = 0;
          rafRef.current = requestAnimationFrame(drawLoop);
        }
      },
      { threshold: 0.01 }
    );
    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    const handleVisibility = () => {
      const wasVisible = tabVisibleRef.current;
      tabVisibleRef.current = !document.hidden;
      if (tabVisibleRef.current && !wasVisible && visibleRef.current) {
        lastFrameTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(drawLoop);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeScheduledRef.current) return;
      resizeScheduledRef.current = true;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeScheduledRef.current = false;
        resize();
      }, 150);
    };

    const ro = new ResizeObserver(() => {
      handleResize();
    });
    if (canvas.parentElement) {
      ro.observe(canvas.parentElement);
    }

    resize();
    visibleRef.current = true;

    motionQuery.addEventListener('change', handleMotionChange);

    lastFrameTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(drawLoop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      observer.disconnect();
      ro.disconnect();
      motionQuery.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[1] pointer-events-none"
      aria-hidden="true"
    />
  );
}
