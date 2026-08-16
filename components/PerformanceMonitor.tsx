"use client";

import { useEffect, useRef } from "react";

type MetricName = "LCP" | "FID" | "CLS" | "FCP" | "TTFB" | "INP";

function getRating(name: MetricName, value: number): "good" | "needs-improvement" | "poor" {
  switch (name) {
    case "LCP": return value <= 2500 ? "good" : value <= 4000 ? "needs-improvement" : "poor";
    case "FID": return value <= 100 ? "good" : value <= 300 ? "needs-improvement" : "poor";
    case "CLS": return value <= 0.1 ? "good" : value <= 0.25 ? "needs-improvement" : "poor";
    case "FCP": return value <= 1800 ? "good" : value <= 3000 ? "needs-improvement" : "poor";
    case "TTFB": return value <= 800 ? "good" : value <= 1800 ? "needs-improvement" : "poor";
    case "INP": return value <= 200 ? "good" : value <= 500 ? "needs-improvement" : "poor";
    default: return "good";
  }
}

function sendToAnalytics(metric: { name: MetricName; value: number; rating: string }) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "web_vitals", {
      event_category: "Web Vitals",
      event_label: metric.name,
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
}

export default function PerformanceMonitor() {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const lcpObserver = typeof PerformanceObserver !== "undefined" ? new PerformanceObserver((list) => {
      if (!mountedRef.current) return;
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      if (lastEntry) {
        sendToAnalytics({
          name: "LCP",
          value: lastEntry.startTime,
          rating: getRating("LCP", lastEntry.startTime),
        });
      }
    }) : null;

    const fidObserver = typeof PerformanceObserver !== "undefined" ? new PerformanceObserver((list) => {
      if (!mountedRef.current) return;
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number };
        const value = fidEntry.processingStart - fidEntry.startTime;
        sendToAnalytics({
          name: "FID",
          value,
          rating: getRating("FID", value),
        });
      });
    }) : null;

    let clsValue = 0;
    const clsObserver = typeof PerformanceObserver !== "undefined" ? new PerformanceObserver((list) => {
      if (!mountedRef.current) return;
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number; startTime: number };
        if (!layoutShiftEntry.hadRecentInput) {
          if (layoutShiftEntry.value > clsValue) {
            clsValue = layoutShiftEntry.value;
          }
        }
      });
    }) : null;

    try { lcpObserver?.observe({ type: "largest-contentful-paint", buffered: true }); } catch (e) {}
    try { fidObserver?.observe({ type: "first-input", buffered: true }); } catch (e) {}
    try { clsObserver?.observe({ type: "layout-shift", buffered: true }); } catch (e) {}

    const reportCLS = () => {
      if (!mountedRef.current) return;
      if (clsValue > 0) {
        sendToAnalytics({ name: "CLS", value: clsValue, rating: getRating("CLS", clsValue) });
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        reportCLS();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    if (typeof PerformanceObserver !== "undefined") {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          if (!mountedRef.current) return;
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === "first-contentful-paint") {
              sendToAnalytics({ name: "FCP", value: entry.startTime, rating: getRating("FCP", entry.startTime) });
            }
          });
        });
        fcpObserver.observe({ type: "paint", buffered: true });
      } catch (e) {}
    }

    if (typeof PerformanceObserver !== "undefined") {
      try {
        const inpObserver = new PerformanceObserver((list) => {
          if (!mountedRef.current) return;
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const eventEntry = entry as PerformanceEntry & { duration: number };
          });
        });
        inpObserver.observe({ type: "event", buffered: true });
      } catch (e) {}
    }

    if (typeof performance !== "undefined") {
      const timer = setTimeout(() => {
        if (!mountedRef.current) return;
        const navigationEntries = performance.getEntriesByType("navigation");
        if (navigationEntries.length > 0) {
          const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
          const value = navEntry.responseStart - navEntry.requestStart;
          sendToAnalytics({ name: "TTFB", value, rating: getRating("TTFB", value) });
        }
      }, 0);
      return () => {
        mountedRef.current = false;
        document.removeEventListener("visibilitychange", onVisibilityChange);
        lcpObserver?.disconnect();
        fidObserver?.disconnect();
        clsObserver?.disconnect();
        clearTimeout(timer);
      };
    }

    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      lcpObserver?.disconnect();
      fidObserver?.disconnect();
      clsObserver?.disconnect();
    };
  }, []);

  return null;
}