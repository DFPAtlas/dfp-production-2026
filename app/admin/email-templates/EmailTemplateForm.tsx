'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import { X, Plus, Trash2, Image, Copy, Check, Upload, FileText } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  category: string;
  variables: string[] | null;
}

interface EmailImage {
  id: string;
  template_id: string | null;
  file_name: string;
  public_url: string;
}

interface Props {
  template: EmailTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = ['general', 'welcome', 'invoice', 'project', 'lead', 'notification'];

const DEFAULT_VARIABLES: Record<string, string[]> = {
  general: ['client_name', 'company_name', 'year'],
  welcome: ['client_name', 'company_name', 'portal_url'],
  invoice: ['client_name', 'invoice_number', 'invoice_amount', 'invoice_due_date', 'payment_link'],
  project: ['client_name', 'project_name', 'project_status', 'project_url'],
  lead: ['lead_name', 'lead_company', 'lead_email', 'lead_phone'],
  notification: ['client_name', 'message'],
};

export default function EmailTemplateForm({ template, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [category, setCategory] = useState('general');
  const [variables, setVariables] = useState<string[]>([]);
  const [newVar, setNewVar] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activePreviewVars, setActivePreviewVars] = useState<Record<string, string>>({});
  const [templateImages, setTemplateImages] = useState<EmailImage[]>([]);
  const [allImages, setAllImages] = useState<EmailImage[]>([]);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [uploadingHtml, setUploadingHtml] = useState(false);
  const htmlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject);
      setHtmlContent(template.html_content);
      setCategory(template.category);
      setVariables(template.variables || []);
    } else {
      setName('');
      setSubject('');
      setHtmlContent('<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n  <h2>Hello {{client_name}},</h2>\n  <p>Your message here...</p>\n  <br/>\n  <p>Best regards,<br/>Digital Footprint Team</p>\n</div>');
      setCategory('general');
      setVariables([]);
    }
  }, [template]);

  useEffect(() => {
    const init: Record<string, string> = {};
    variables.forEach((v) => { init[v] = ''; });
    setActivePreviewVars(init);
  }, [variables]);

  useEffect(() => {
    fetchImages();
  }, [template?.id]);

  const fetchImages = async () => {
    const { data } = await supabase.from('email_images').select('id, template_id, file_name, public_url').order('created_at', { ascending: false });
    if (data) {
      setAllImages(data);
      if (template?.id) {
        setTemplateImages(data.filter((img) => img.template_id === template.id));
      }
    }
  };

  const addVariable = () => {
    const v = newVar.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (v && !variables.includes(v)) {
      setVariables([...variables, v]);
      setNewVar('');
    }
  };

  const removeVariable = (v: string) => {
    setVariables(variables.filter((x) => x !== v));
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    if (!template && DEFAULT_VARIABLES[cat]) {
      setVariables([...new Set([...variables, ...DEFAULT_VARIABLES[cat]])]);
    }
  };

  const applyVariableDefaults = () => {
    if (DEFAULT_VARIABLES[category]) {
      setVariables([...new Set([...variables, ...DEFAULT_VARIABLES[category]])]);
    }
  };

  const insertImageUrl = (url: string) => {
    const imgTag = `<img src="${url}" alt="" style="max-width:100%;height:auto;display:block;" />`;
    setHtmlContent((prev) => prev + '\n' + imgTag);
  };

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const renderPreview = () => {
    let html = htmlContent;
    for (const [key, value] of Object.entries(activePreviewVars)) {
      html = html.replaceAll(`{{${key}}}`, value || `{{${key}}}`);
      html = html.replaceAll(`{{ ${key} }}`, value || `{{ ${key} }}`);
    }
    return html;
  };

  const handleSave = async () => {
    if (!name.trim() || !subject.trim() || !htmlContent.trim()) {
      setError('Name, subject, and HTML content are required');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      name: name.trim(),
      subject: subject.trim(),
      html_content: htmlContent,
      category,
      variables,
      updated_at: new Date().toISOString(),
    };

    if (template) {
      const { error: e } = await supabase.from('email_templates').update(payload).eq('id', template.id);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { data: orgData } = await supabase.from('admin_profiles').select('organisation_id').eq('id', (await supabase.auth.getUser()).data.user?.id || '').maybeSingle();
      const { error: e } = await supabase.from('email_templates').insert({ ...payload, created_by: (await supabase.auth.getUser()).data.user?.id, organisation_id: orgData?.organisation_id || null });
      if (e) { setError(e.message); setSaving(false); return; }
    }

    setSaving(false);
    onSaved();
  };

  const handleHtmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      setError('Please upload a valid .html or .htm file');
      setTimeout(() => setError(''), 3000);
      e.target.value = '';
      return;
    }

    setUploadingHtml(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setHtmlContent(content);

      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      if (titleMatch && titleMatch[1] && !template) {
        setName(titleMatch[1].trim());
      }

      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const bodyContent = bodyMatch ? bodyMatch[1] : content;

      const varMatches = bodyContent.match(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g) || [];
      const foundVars = Array.from(new Set(
        varMatches.map((m) => m.replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, ''))
      ));
      if (foundVars.length > 0) {
        setVariables((prev) => Array.from(new Set([...prev, ...foundVars])));
      }

      setUploadingHtml(false);
      e.target.value = '';
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setUploadingHtml(false);
      e.target.value = '';
      setTimeout(() => setError(''), 3000);
    };
    reader.readAsText(file);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-4xl my-4"
        onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.08)]">
          <h2 className="text-lg font-bold text-white">{template ? 'Edit Template' : 'New Template'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Template Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Welcome Email"
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => handleCategoryChange(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer whitespace-nowrap ${
                      category === cat ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30' : 'bg-white/5 text-slate-400 border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Subject Line</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Welcome to Digital Footprint, {{client_name}}!"
                className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Variables</label>
                <button onClick={applyVariableDefaults} className="text-[10px] text-[#06B6D4] hover:underline cursor-pointer">Load defaults for {category}</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {variables.map((v) => (
                  <span key={v} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {`{{${v}}}`}
                    <button onClick={() => removeVariable(v)} className="text-purple-400/60 hover:text-purple-300 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newVar} onChange={(e) => setNewVar(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVariable(); } }}
                  placeholder="Add variable..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                />
                <button onClick={addVariable} className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">HTML Content</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => htmlInputRef.current?.click()}
                    disabled={uploadingHtml}
                    className="flex items-center gap-1.5 text-[10px] text-[#06B6D4] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {uploadingHtml ? (
                      <>
                        <div className="w-3 h-3 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3" />
                        Upload HTML
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImagePanel(!showImagePanel)}
                    className="flex items-center gap-1.5 text-[10px] text-[#06B6D4] hover:underline cursor-pointer"
                  >
                    <Image className="w-3 h-3" />
                    {showImagePanel ? 'Hide images' : 'Insert image'}
                  </button>
                </div>
              </div>
              <input
                ref={htmlInputRef}
                type="file"
                accept=".html,.htm"
                className="hidden"
                onChange={handleHtmlFileUpload}
              />

              {showImagePanel && (
                <div className="mb-3 bg-[#0F172A] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 max-h-48 overflow-y-auto">
                  {template && templateImages.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Template images</p>
                      <div className="flex flex-wrap gap-2">
                        {templateImages.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.public_url}
                              alt={img.file_name}
                              className="w-16 h-16 rounded-lg object-cover border border-[rgba(255,255,255,0.06)] cursor-pointer hover:border-[#06B6D4]/50 transition-colors"
                              onClick={() => insertImageUrl(img.public_url)}
                              title={`Click to insert: ${img.file_name}`}
                            />
                            <button
                              onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); copyImageUrl(img.public_url); }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1E293B] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[8px] text-slate-400 hover:text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copiedUrl === img.public_url ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        {template ? 'All library images' : 'Library images'}
                      </p>
                      <span className="text-[10px] text-slate-600">{allImages.length} images</span>
                    </div>
                    {allImages.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic">No images uploaded yet. Add them in the Image Library.</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {allImages.slice(0, 16).map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.public_url}
                              alt={img.file_name}
                              className="w-full aspect-square rounded-lg object-cover border border-[rgba(255,255,255,0.06)] cursor-pointer hover:border-[#06B6D4]/50 transition-colors"
                              onClick={() => insertImageUrl(img.public_url)}
                              title={`Click to insert: ${img.file_name}`}
                            />
                            <button
                              onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); copyImageUrl(img.public_url); }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1E293B] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[8px] text-slate-400 hover:text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copiedUrl === img.public_url ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <textarea value={htmlContent} onChange={(e) => setHtmlContent(e.target.value)}
                rows={14}
                className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all font-mono resize-y"
              />
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Variable Values (Preview)</label>
              <p className="text-[10px] text-slate-500 mb-3">Fill in values to see how the email renders</p>
              {variables.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No variables defined yet</p>
              ) : (
                <div className="space-y-2">
                  {variables.map((v) => (
                    <div key={v}>
                      <label className="block text-[10px] text-slate-500 mb-0.5 font-mono">{`{{${v}}}`}</label>
                      <input type="text" value={activePreviewVars[v] || ''}
                        onChange={(e) => setActivePreviewVars({ ...activePreviewVars, [v]: e.target.value })}
                        placeholder={`Value for ${v}`}
                        className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Live Preview</label>
              <div className="bg-white rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden h-[460px]">
                <iframe
                  srcDoc={renderPreview()}
                  className="w-full h-full"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-6 pb-2">
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 p-6 border-t border-[rgba(255,255,255,0.08)]">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap"
          >
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {saving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
