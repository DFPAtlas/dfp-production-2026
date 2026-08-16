import type { MonitorEvent } from './types';
import { sanitizePath } from './sanitise';

export function createNavigationTracker(
  enqueue: (e: MonitorEvent) => void,
  getSettings: () => { capture_navigation: boolean }
) {
  let lastPath = '';
  const originalPush = history.pushState.bind(history);
  const originalReplace = history.replaceState.bind(history);

  function sendPageView() {
    if (!getSettings().capture_navigation) return;
    const path = sanitizePath(window.location.href);
    if (!path || path === lastPath) return;
    lastPath = path;

    enqueue({
      event_type: 'page_view',
      page_url: window.location.href,
      page_path: path,
      page_title: document.title.substring(0, 500),
    });
  }

  function start() {
    sendPageView();

    history.pushState = function (...args) {
      originalPush(...args);
      const newPath = sanitizePath(window.location.href);
      if (newPath && newPath !== lastPath) {
        lastPath = newPath;
        enqueue({
          event_type: 'route_change',
          page_url: window.location.href,
          page_path: newPath,
          page_title: document.title.substring(0, 500),
        });
      }
    };

    history.replaceState = function (...args) {
      originalReplace(...args);
      const newPath = sanitizePath(window.location.href);
      if (newPath && newPath !== lastPath) {
        lastPath = newPath;
        enqueue({
          event_type: 'route_change',
          page_url: window.location.href,
          page_path: newPath,
          page_title: document.title.substring(0, 500),
        });
      }
    };

    window.addEventListener('popstate', onPopState);
  }

  function onPopState() {
    if (!getSettings().capture_navigation) return;
    const path = sanitizePath(window.location.href);
    if (path && path !== lastPath) {
      lastPath = path;
      enqueue({
        event_type: 'route_change',
        page_url: window.location.href,
        page_path: path,
        page_title: document.title.substring(0, 500),
      });
    }
  }

  function stop() {
    history.pushState = originalPush;
    history.replaceState = originalReplace;
    window.removeEventListener('popstate', onPopState);
  }

  return { start, stop };
}