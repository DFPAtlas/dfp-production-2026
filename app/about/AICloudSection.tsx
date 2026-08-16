'use client';

import { motion } from '@/components/motion';

interface ToolCard {
  name: string;
  category: string;
  desc: string;
  icon: string;
}

const aiTools: ToolCard[] = [
  { name: 'OpenAI / ChatGPT', category: 'AI Reasoning & Assistants', desc: 'Used for intelligent assistants, planning, coding support, customer workflows, and AI-powered business tools.', icon: 'ri-brain-line' },
  { name: 'Anthropic Claude', category: 'Long-form Reasoning & Analysis', desc: 'Used for document analysis, planning, safer assistant workflows, and structured business reasoning.', icon: 'ri-file-search-line' },
  { name: 'Google Gemini', category: 'Multimodal AI', desc: 'Used for AI workflows involving text, image understanding, research support, and business productivity.', icon: 'ri-image-circle-line' },
  { name: 'Amazon Bedrock / Nova', category: 'Enterprise AI Platform', desc: 'Used to access and manage foundation models in secure, scalable AWS environments.', icon: 'ri-cloud-line' },
  { name: 'Meta Llama', category: 'Open Model AI', desc: 'Used where open-model flexibility, local deployment, or custom AI workflows are required.', icon: 'ri-open-source-line' },
  { name: 'Mistral AI', category: 'Efficient AI Models', desc: 'Used for lightweight, fast, and flexible AI-powered workflows.', icon: 'ri-flashlight-line' },
  { name: 'xAI Grok', category: 'Conversational AI', desc: 'Used where real-time-style assistant experiences and conversational workflows are suitable.', icon: 'ri-chat-3-line' },
  { name: 'DeepSeek / Qwen', category: 'Advanced AI Models', desc: 'Used for coding, reasoning, automation experiments, and specialist AI workflows where appropriate.', icon: 'ri-code-box-line' },
  { name: 'Perplexity', category: 'AI Research & Search', desc: 'Used for research-backed AI queries, knowledge retrieval, and data-informed business decisions.', icon: 'ri-search-eye-line' },
  { name: 'GitHub Copilot', category: 'AI-Assisted Development', desc: 'Used to accelerate development with AI-powered code suggestions, reviews, and automation.', icon: 'ri-github-line' },
  { name: 'n8n AI Agents', category: 'Automation & Workflow AI', desc: 'Used for building AI agents that connect emails, databases, websites, CRMs, phone systems, and business processes.', icon: 'ri-settings-3-line' },
  { name: 'Ollama / Local AI', category: 'Private Local AI', desc: 'Used for running models locally where privacy, cost control, or offline infrastructure is important.', icon: 'ri-computer-line' },
];

const cloudTools: ToolCard[] = [
  { name: 'AWS', category: 'Cloud Infrastructure', desc: 'Used for hosting, scaling, storage, cloud services, security, and production deployments.', icon: 'ri-cloud-windy-line' },
  { name: 'Supabase', category: 'Database & Auth', desc: 'Used for databases, authentication, APIs, storage, realtime systems, and app backends.', icon: 'ri-database-2-line' },
  { name: 'Vercel', category: 'Frontend & Edge Hosting', desc: 'Used for deploying frontend applications, edge functions, and high-performance web experiences.', icon: 'ri-global-line' },
  { name: 'Cloudflare', category: 'DNS, CDN & Security', desc: 'Used for DNS management, CDN acceleration, DDoS protection, and edge computing.', icon: 'ri-shield-flash-line' },
  { name: 'Stripe', category: 'Payments', desc: 'Used for subscriptions, client payments, marketplace payments, invoices, and billing workflows.', icon: 'ri-money-dollar-circle-line' },
  { name: 'Twilio', category: 'Voice & Messaging', desc: 'Used for phone systems, SMS, WhatsApp, call flows, and communication automation.', icon: 'ri-phone-line' },
  { name: 'Docker', category: 'Containerisation', desc: 'Used for packaging applications into portable containers for consistent deployment across environments.', icon: 'ri-stack-line' },
  { name: 'Proxmox / Local Servers', category: 'Local Infrastructure', desc: 'Used for private servers, client-side deployments, local dashboards, hybrid cloud systems, and controlled hosting.', icon: 'ri-server-line' },
  { name: 'n8n', category: 'Workflow Automation', desc: 'Used for automating business processes, connecting APIs, scheduling tasks, and building no-code workflows.', icon: 'ri-node-tree' },
];

function ToolCardItem({ tool, index }: { tool: ToolCard; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className="glass-card rounded-2xl p-5 group flex flex-col"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/8 flex items-center justify-center shrink-0 group-hover:bg-[#06B6D4] transition-colors duration-300">
          <i className={`${tool.icon} text-lg text-[#06B6D4] group-hover:text-white transition-colors duration-300 w-5 h-5 flex items-center justify-center`} />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-slate-800 text-sm leading-tight">{tool.name}</h4>
          <p className="text-[10px] font-medium text-[#06B6D4]/70 mt-0.5 uppercase tracking-wider">{tool.category}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed flex-1">{tool.desc}</p>
    </motion.div>
  );
}

export default function AICloudSection() {
  return (
    <section className="py-24 px-6 section-dark-alt relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#06B6D4]/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(6,182,212,0.03),transparent_70%)]" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06B6D4]/8 border border-[#06B6D4]/20 text-[#06B6D4] text-sm font-medium mb-4">
            <i className="ri-cpu-line w-4 h-4 flex items-center justify-center" />
            Our Toolkit
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Powered by Modern AI & Cloud Infrastructure
          </h2>
          <p className="text-slate-500 max-w-3xl mx-auto text-base leading-relaxed">
            We build client projects using the best tools available for the job. Depending on the project,
            we work with leading AI platforms and cloud providers for reasoning, coding support, automation,
            content, customer support agents, business workflows, voice systems, document processing,
            dashboards, and data analysis. We choose the right stack for each client — not the other way around.
          </p>
        </motion.div>

        <div className="mb-14">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/12 flex items-center justify-center">
              <i className="ri-brain-line text-sm text-[#A78BFA] w-4 h-4 flex items-center justify-center" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">AI Models & Platforms</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiTools.map((tool, idx) => (
              <ToolCardItem key={tool.name} tool={tool} index={idx} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/12 flex items-center justify-center">
              <i className="ri-cloud-line text-sm text-[#34D399] w-4 h-4 flex items-center justify-center" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Cloud & Infrastructure</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cloudTools.map((tool, idx) => (
              <ToolCardItem key={tool.name} tool={tool} index={idx} />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 glass-card rounded-2xl p-8 border border-slate-200"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/8 flex items-center justify-center shrink-0">
              <i className="ri-stack-line text-xl text-[#06B6D4] w-6 h-6 flex items-center justify-center" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">We Choose the Right Stack for Your Project</h4>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                Every client project is different. Depending on your needs, we design systems around the right
                AI model, the right cloud setup, and the right infrastructure — whether that means:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  'Fully cloud hosted',
                  'Local server hosted',
                  'Hybrid local + cloud',
                  'AI-assisted workflows',
                  'Secure dashboards',
                  'Automation agents',
                  'Client portals',
                  'Admin systems',
                  'Monitoring & support',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                    <i className="ri-checkbox-circle-fill text-[#10B981] w-4 h-4 flex items-center justify-center shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}