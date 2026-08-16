'use client';

import React, { useRef, useEffect, useState, useCallback, createContext, useContext } from 'react';
import type { JSX } from 'react';

interface TransitionDef {
  duration?: number;
  delay?: number;
  ease?: string | number[];
  type?: string;
  x?: number | string | TransitionDef;
  scale?: number | TransitionDef;
  opacity?: number | TransitionDef;
  [key: string]: unknown;
}

interface AnimationProps {
  initial?: Record<string, unknown> | string | boolean;
  animate?: Record<string, unknown> | string | boolean;
  whileInView?: Record<string, unknown> | string | boolean;
  viewport?: { once?: boolean; amount?: number; margin?: string };
  transition?: TransitionDef;
  exit?: Record<string, unknown> | string | boolean;
  whileHover?: Record<string, unknown> | string | boolean;
  variants?: Record<string, Record<string, unknown> | string>;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  [key: string]: unknown;
}

function resolveStyleValue(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === 'string' || typeof value === 'boolean') return undefined;
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  return undefined;
}

function buildTransitionStyle(transition?: TransitionDef, initial?: Record<string, unknown>): React.CSSProperties {
  const duration = transition?.duration ?? 0.4;
  const delay = transition?.delay ?? 0;
  const ease = typeof transition?.ease === 'string' ? transition.ease : 'ease-out';
  return {
    transition: `opacity ${duration}s ${ease} ${delay}s, transform ${duration}s ${ease} ${delay}s`,
  };
}

function buildInitialStyle(initial?: Record<string, unknown>): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (!initial) return style;
  if (initial.opacity !== undefined) style.opacity = initial.opacity as number;
  if (initial.y !== undefined) style.transform = `translateY(${initial.y}px)`;
  if (initial.x !== undefined) style.transform = `translateX(${initial.x}px)`;
  if (initial.scale !== undefined) style.transform = `scale(${initial.scale})`;
  return style;
}

function buildTargetStyle(animate?: Record<string, unknown>): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (!animate) return style;
  if (animate.opacity !== undefined) style.opacity = animate.opacity as number;
  const transforms: string[] = [];
  if (animate.y !== undefined) transforms.push(`translateY(${animate.y}px)`);
  if (animate.x !== undefined) transforms.push(`translateX(${animate.x}px)`);
  if (animate.scale !== undefined) transforms.push(`scale(${animate.scale})`);
  if (transforms.length > 0) style.transform = transforms.join(' ');
  return style;
}

interface PresenceContextValue {
  isExiting: boolean;
  registerExit: (key: string, el: HTMLElement) => void;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

function stripMotionProps(props: Record<string, unknown>) {
  const stripped: Record<string, unknown> = {};
  const motionKeys = new Set([
    'initial','animate','whileInView','viewport','transition','exit','whileHover','whileFocus','whileTap','whileDrag',
    'variants','layoutId','layout','layoutDependency','layoutScroll','layoutRoot',
    'onLayoutAnimationStart','onLayoutAnimationComplete','onAnimationStart','onAnimationComplete',
    'drag','dragConstraints','dragElastic','dragMomentum','dragPropagation','dragDirectionLock',
    'onDragStart','onDragEnd','onDrag',
  ]);
  for (const k of Object.keys(props)) {
    if (!motionKeys.has(k)) stripped[k] = props[k];
  }
  return stripped;
}

function MotionFactory(tag: keyof JSX.IntrinsicElements | 'i') {
  return function MotionComponent(props: AnimationProps) {
    const {
      initial: initialRaw,
      animate: animateRaw,
      whileInView: whileInViewRaw,
      viewport,
      transition,
      exit: exitRaw,
      variants,
      className,
      style: propStyle,
      children,
      whileHover: _whileHover,
      ...rest
    } = props;

    const initial = resolveStyleValue(initialRaw);
    const animate = resolveStyleValue(animateRaw);
    const whileInView = resolveStyleValue(whileInViewRaw);
    const exit = resolveStyleValue(exitRaw);

    const innerRef = useRef<HTMLElement>(null);
    const [inView, setInView] = useState(false);
    const [mounted, setMounted] = useState(false);
    const mountedRef = useRef(false);
    const rafRef = useRef<number | null>(null);
    const presence = useContext(PresenceContext);

    useEffect(() => {
      mountedRef.current = true;
      rafRef.current = requestAnimationFrame(() => {
        if (mountedRef.current) {
          setMounted(true);
        }
      });
      return () => {
        mountedRef.current = false;
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }, []);

    useEffect(() => {
      if (!whileInView) return;
      const el = innerRef.current;
      if (!el) return;
      let observerDisconnected = false;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!mountedRef.current || observerDisconnected) return;
          if (entry.isIntersecting) {
            setInView(true);
            if (viewport?.once) observer.unobserve(el);
          } else if (!viewport?.once) {
            setInView(false);
          }
        },
        { threshold: viewport?.amount ?? 0.1 }
      );
      observer.observe(el);
      return () => {
        observerDisconnected = true;
        observer.disconnect();
      };
    }, [whileInView, viewport]);

    const shouldAnimate = animate !== undefined && mounted;
    const shouldViewAnimate = whileInView !== undefined && inView;

    const combinedStyle: React.CSSProperties = {
      ...propStyle,
      ...buildTransitionStyle(transition, initial),
    };

    if (shouldViewAnimate && whileInView) {
      Object.assign(combinedStyle, buildTargetStyle(whileInView));
    } else if (shouldAnimate && animate) {
      Object.assign(combinedStyle, buildTargetStyle(animate));
    } else {
      Object.assign(combinedStyle, buildInitialStyle(initial));
    }

    if (presence?.isExiting && exit) {
      Object.assign(combinedStyle, buildTargetStyle(exit));
    }

    const Tag = tag as React.ElementType;
    const domProps = stripMotionProps(rest);
    return React.createElement(Tag, {
      ref: innerRef,
      className,
      style: combinedStyle,
      ...domProps,
    }, children);
  };
}

export const motion = {
  div: MotionFactory('div'),
  span: MotionFactory('span'),
  i: MotionFactory('i'),
  section: MotionFactory('section'),
  h1: MotionFactory('h1'),
  h2: MotionFactory('h2'),
  h3: MotionFactory('h3'),
  h4: MotionFactory('h4'),
  p: MotionFactory('p'),
  li: MotionFactory('li'),
  ul: MotionFactory('ul'),
  nav: MotionFactory('nav'),
  header: MotionFactory('header'),
  footer: MotionFactory('footer'),
  button: MotionFactory('button'),
  a: MotionFactory('a'),
  img: MotionFactory('img'),
  main: MotionFactory('main'),
  article: MotionFactory('article'),
  aside: MotionFactory('aside'),
  form: MotionFactory('form'),
  input: MotionFactory('input'),
  label: MotionFactory('label'),
  tr: MotionFactory('tr'),
  td: MotionFactory('td'),
};

export function AnimatePresence({ children }: { children: React.ReactNode; mode?: string }) {
  return <>{children}</>;
}

export function useAnimation() {
  const start = useCallback(() => {}, []);
  return { start };
}

export function useInView(ref: React.RefObject<Element | null>, options?: { once?: boolean; amount?: number; margin?: string }) {
  const [inView, setInView] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const el = ref.current;
    if (!el) return;
    let observerDisconnected = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!mountedRef.current || observerDisconnected) return;
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: options?.amount ?? 0.1 }
    );
    observer.observe(el);
    return () => {
      observerDisconnected = true;
      mountedRef.current = false;
      observer.disconnect();
    };
  }, [ref, options]);

  return inView;
}

export type Variants = Record<string, Record<string, unknown>>;

export default motion;
