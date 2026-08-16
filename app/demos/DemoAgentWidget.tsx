'use client';

import { useEffect } from 'react';

export default function DemoAgentWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://readdy.ai/api/public/assistant/widget?projectId=9c829bf4-c727-45a7-99f8-358e1780c66a';
    script.async = true;
    script.setAttribute('mode', 'hybrid');
    script.setAttribute('voice-show-transcript', 'true');
    script.setAttribute('theme', 'light');
    script.setAttribute('size', 'compact');
    script.setAttribute('accent-color', '#14B8A6');
    script.setAttribute('button-base-color', '#000000');
    script.setAttribute('button-accent-color', '#FFFFFF');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}