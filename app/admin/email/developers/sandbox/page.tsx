'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FlaskConical, Play, FileText, Key, Webhook, CheckCircle2, XCircle, Copy, Terminal, AlertTriangle, Globe, RefreshCw, Shield } from 'lucide-react';

interface SandboxTool { name: string; description: string; icon: React.ElementType; href: string; }

const TOOLS: SandboxTool[] = [
  { name: 'API Explorer', description: 'Test API endpoints with sandbox credentials', icon: Terminal, href: '#' },
  { name: 'Event Builder', description: 'Build and validate event payloads', icon: FileText, href: '#' },
  { name: 'Schema Validator', description: 'Validate payloads against published schemas', icon: CheckCircle2, href: '#' },
  { name: 'Webhook Tester', description: 'Send test webhook events to your endpoint', icon: Webhook, href: '#' },
  { name: 'Idempotency Tester', description: 'Test idempotency key behaviour', icon: RefreshCw, href: '#' },
  { name: 'Rate Limit Tester', description: 'Simulate rate-limit scenarios', icon: Shield, href: '#' },
];

const CODE_EXAMPLES = [
  { language: 'cURL', code: `curl -X POST https://api.digitalfootprint.uk/api/email-studio/v1/transactional/send \\\n  -H "Authorization: Bearer dfp_sk_your_key_here" \\\n  -H "Content-Type: application/json" \\\n  -H "Idempotency-Key: unique-key-123" \\\n  -d '{\n    "event_key": "order.confirmed",\n    "recipient": "customer@example.com",\n    "locale": "en-GB",\n    "merge_data": {"order_id": "ORD-1234"}\n  }'` },
  { language: 'JavaScript', code: `const response = await fetch('https://api.digitalfootprint.uk/api/email-studio/v1/transactional/send', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer dfp_sk_your_key_here',\n    'Content-Type': 'application/json',\n    'Idempotency-Key': 'unique-key-123'\n  },\n  body: JSON.stringify({\n    event_key: 'order.confirmed',\n    recipient: 'customer@example.com',\n    locale: 'en-GB',\n    merge_data: { order_id: 'ORD-1234' }\n  })\n});\nconsole.log(await response.json());` },
  { language: 'Python', code: `import requests\n\nresponse = requests.post(\n    'https://api.digitalfootprint.uk/api/email-studio/v1/transactional/send',\n    headers={\n        'Authorization': 'Bearer dfp_sk_your_key_here',\n        'Content-Type': 'application/json',\n        'Idempotency-Key': 'unique-key-123'\n    },\n    json={\n        'event_key': 'order.confirmed',\n        'recipient': 'customer@example.com',\n        'locale': 'en-GB',\n        'merge_data': {'order_id': 'ORD-1234'}\n    }\n)\nprint(response.json())` },
  { language: 'n8n HTTP Request', code: `// HTTP Request Node\nMethod: POST\nURL: https://api.digitalfootprint.uk/api/email-studio/v1/transactional/send\nAuthentication: Header Auth\n  Header Name: Authorization\n  Value: Bearer dfp_sk_your_key_here\n\nHeaders:\n  Content-Type: application/json\n  Idempotency-Key: {{ $json.idempotencyKey }}\n\nBody (JSON):\n{\n  "event_key": "order.confirmed",\n  "recipient": "{{ $json.email }}",\n  "locale": "en-GB",\n  "merge_data": {{ $json.mergeData }}\n}` },
];

const SANDBOX_CONFIG = [
  { label: 'Environment', value: 'Isolated sandbox', status: 'active' },
  { label: 'Test Apps', value: '3 registered', status: 'active' },
  { label: 'Test Contacts', value: '12 available', status: 'active' },
  { label: 'Test Templates', value: '6 available', status: 'active' },
  { label: 'Queue Mode', value: 'Test (no delivery)', status: 'active' },
  { label: 'Production Sending', value: 'Disabled', status: 'blocked' },
  { label: 'Data Isolation', value: 'Segregated from production', status: 'active' },
];

export default function DeveloperSandbox() {
  const [activeCodeTab, setActiveCodeTab] = useState('cURL');
  const [copiedCode, setCopiedCode] = useState(false);

  const copyCode = () => {
    const example = CODE_EXAMPLES.find((e) => e.language === activeCodeTab);
    if (example) {
      navigator.clipboard?.writeText(example.code).then(() => { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Sandbox</h1>
              <p className="text-sm text-slate-400 mt-0.5">Isolated testing environment — no production data or sending by default.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/email/developers" className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back
          </Link>
        </div>
      </div>

      <div className="bg-amber-400/5 border border-amber-400/15 rounded-2xl p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-amber-300 mb-1">Sandbox Environment</h3>
          <p className="text-xs text-amber-400/80">Sandbox data, apps, keys, and webhooks are fully isolated from production. No emails are sent to real recipients. Use sandbox keys and test contact data only.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {SANDBOX_CONFIG.map((item) => (
          <div key={item.label} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">{item.label}</p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${item.status === 'active' ? 'bg-emerald-400' : item.status === 'blocked' ? 'bg-red-400' : 'bg-slate-500'}`} />
              <span className="text-xs font-medium text-white">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-sm font-bold text-white">Sandbox Tools</h2>
            </div>
            <div className="p-4 space-y-2">
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button key={tool.name} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] hover:bg-white/[0.04] hover:border-[rgba(255,255,255,0.08)] transition-all cursor-pointer text-left">
                    <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{tool.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{tool.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 ml-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-sm font-bold text-white">Sandbox Credentials</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] mb-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <code className="text-xs text-slate-300 font-mono">dfp_gapi_sand_••••••••••••</code>
                </div>
                <button className="text-slate-500 hover:text-white cursor-pointer"><Copy className="w-3.5 h-3.5" /></button>
              </div>
              <p className="text-[10px] text-slate-500">Use sandbox keys only. Scopes: templates.read, sandbox.*</p>
            </div>
          </div>
        </div>

        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <h2 className="text-sm font-bold text-white">Code Examples</h2>
            <button onClick={copyCode} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs text-slate-400 hover:text-white transition-all cursor-pointer whitespace-nowrap">
              <Copy className="w-3 h-3" /> {copiedCode ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex px-2 pt-2 gap-1">
              {CODE_EXAMPLES.map((ex) => (
                <button key={ex.language} onClick={() => setActiveCodeTab(ex.language)} className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${activeCodeTab === ex.language ? 'bg-white/[0.06] text-[#06B6D4]' : 'text-slate-500 hover:text-slate-300'}`}>
                  {ex.language}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4">
            <pre className="bg-black/40 border border-[rgba(255,255,255,0.06)] rounded-xl p-4 overflow-x-auto">
              <code className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre">
                {CODE_EXAMPLES.find((e) => e.language === activeCodeTab)?.code}
              </code>
            </pre>
            <p className="text-[10px] text-slate-600 mt-3">Replace placeholders with your sandbox credentials. All examples use the sandbox environment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}