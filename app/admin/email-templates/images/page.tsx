'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import { ArrowLeft, Upload, Image, Copy, Trash2, X, Search, Check, Link2, FileImage, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface EmailImage {
  id: string;
  template_id: string | null;
  file_name: string;
  storage_path: string;
  public_url: string;
  file_size: number | null;
  content_type: string | null;
  created_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function EmailImagesPage() {
  const [images, setImages] = useState<EmailImage[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTemplate, setFilterTemplate] = useState<string>('all');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [assigningTemplate, setAssigningTemplate] = useState<{ imageId: string; templateId: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [imgRes, tplRes] = await Promise.all([
      supabase.from('email_images').select('*').order('created_at', { ascending: false }),
      supabase.from('email_templates').select('id, name, category').order('name'),
    ]);
    if (!imgRes.error && imgRes.data) setImages(imgRes.data);
    if (!tplRes.error && tplRes.data) setTemplates(tplRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true); };
    const onDragLeave = () => setDragging(false);
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer?.files?.length) handleUpload(e.dataTransfer.files);
    };
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('dragleave', onDragLeave);
    el.addEventListener('drop', onDrop);
    return () => {
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('dragleave', onDragLeave);
      el.removeEventListener('drop', onDrop);
    };
  }, []);

  const handleUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        setStatusMsg({ type: 'error', text: `${file.name} is too large (max 5MB)` });
        continue;
      }
      if (!file.type.startsWith('image/')) {
        setStatusMsg({ type: 'error', text: `${file.name} is not an image` });
        continue;
      }
    }

    setUploading(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE || !file.type.startsWith('image/')) continue;

      const ext = file.name.split('.').pop() || 'png';
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const storagePath = `email-assets/${uniqueName}`;

      const { error: uploadErr } = await supabase.storage
        .from('email-images')
        .upload(storagePath, file, { contentType: file.type, upsert: true });

      if (uploadErr) {
        errors.push(`${file.name}: ${uploadErr.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from('email-images').getPublicUrl(storagePath);

      const { error: dbErr } = await supabase.from('email_images').insert({
        file_name: file.name,
        storage_path: storagePath,
        public_url: urlData.publicUrl,
        file_size: file.size,
        content_type: file.type,
      });

      if (dbErr) {
        errors.push(`${file.name}: ${dbErr.message}`);
        continue;
      }

      successCount++;
    }

    setUploading(false);
    if (successCount > 0) {
      setStatusMsg({ type: 'success', text: `${successCount} image${successCount > 1 ? 's' : ''} uploaded` });
      fetchData();
    }
    if (errors.length > 0) {
      setStatusMsg({ type: 'error', text: errors[0] });
    }
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleDelete = async (id: string) => {
    const img = images.find((i) => i.id === id);
    if (!img) return;

    const { error: storageErr } = await supabase.storage.from('email-images').remove([img.storage_path]);
    const { error: dbErr } = await supabase.from('email_images').delete().eq('id', id);

    if (!dbErr) {
      setImages((prev) => prev.filter((i) => i.id !== id));
      setStatusMsg({ type: 'success', text: 'Image deleted' });
    } else {
      setStatusMsg({ type: 'error', text: 'Failed to delete' });
    }
    setDeleteConfirm(null);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleBulkDelete = async () => {
    const toDelete = images.filter((i) => selectedImages.has(i.id));
    const paths = toDelete.map((i) => i.storage_path);
    const ids = toDelete.map((i) => i.id);

    if (paths.length > 0) {
      await supabase.storage.from('email-images').remove(paths);
    }
    await supabase.from('email_images').delete().in('id', ids);

    setImages((prev) => prev.filter((i) => !selectedImages.has(i.id)));
    setSelectedImages(new Set());
    setStatusMsg({ type: 'success', text: `${ids.length} image${ids.length > 1 ? 's' : ''} deleted` });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleAssignTemplate = async (imageId: string, templateId: string) => {
    const finalTemplateId = templateId === 'none' ? null : templateId;
    const { error } = await supabase.from('email_images').update({ template_id: finalTemplateId }).eq('id', imageId);
    if (!error) {
      setImages((prev) => prev.map((i) => i.id === imageId ? { ...i, template_id: finalTemplateId } : i));
      setStatusMsg({ type: 'success', text: finalTemplateId ? 'Template assigned' : 'Template removed' });
    } else {
      setStatusMsg({ type: 'error', text: 'Failed to assign template' });
    }
    setAssigningTemplate(null);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSelect = (id: string) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filtered = images.filter((img) => {
    const matchTemplate = filterTemplate === 'all' || (filterTemplate === 'none' ? !img.template_id : img.template_id === filterTemplate);
    const matchSearch = !search || img.file_name.toLowerCase().includes(search.toLowerCase());
    return matchTemplate && matchSearch;
  });

  const getTemplateName = (id: string | null) => {
    if (!id) return null;
    return templates.find((t) => t.id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/email-templates" className="w-9 h-9 flex items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Email Image Library</h1>
          <p className="text-sm text-slate-400 mt-1">Upload and manage images for your email templates</p>
        </div>
      </div>

      <AnimatePresence>
        {statusMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`px-4 py-3 rounded-xl text-sm font-medium ${
              statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {statusMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={dropRef}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
          dragging
            ? 'border-[#06B6D4] bg-[#06B6D4]/5'
            : 'border-[rgba(255,255,255,0.1)] bg-[#1E293B] hover:border-[rgba(255,255,255,0.2)]'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files); e.target.value = ''; }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Uploading...</p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[#06B6D4]/10 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-[#06B6D4]" />
            </div>
            <p className="text-sm font-medium text-white mb-1">Drop images here or click to browse</p>
            <p className="text-xs text-slate-500">PNG, JPG, GIF, WebP up to 5MB each</p>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search images..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 w-64 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
            />
          </div>
          <select
            value={filterTemplate}
            onChange={(e) => setFilterTemplate(e.target.value)}
            className="px-3 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all cursor-pointer pr-8"
          >
            <option value="all">All templates</option>
            <option value="none">Unassigned</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {selectedImages.size > 0 && (
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            Delete {selectedImages.size} selected
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-white/5" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-white/5 rounded w-3/4" />
                <div className="h-2 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileImage className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-medium">No images found</p>
          <p className="text-slate-500 text-sm mt-1">
            {images.length === 0 ? 'Upload your first email image to get started' : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((img) => (
            <motion.div
              key={img.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-[#1E293B] border rounded-2xl overflow-hidden group transition-all ${
                selectedImages.has(img.id) ? 'border-[#06B6D4] ring-1 ring-[#06B6D4]/30' : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'
              }`}
            >
              <div className="relative aspect-square bg-[#0F172A] overflow-hidden">
                <img
                  src={img.public_url}
                  alt={img.file_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <button
                  onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); toggleSelect(img.id); }}
                  className={`absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    selectedImages.has(img.id)
                      ? 'bg-[#06B6D4] text-white'
                      : 'bg-black/40 text-white/0 group-hover:text-white/70'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </button>

                <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); copyUrl(img.public_url, img.id); }}
                    className="flex-1 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-[10px] font-medium text-white flex items-center justify-center gap-1 cursor-pointer hover:bg-black/80 transition-colors whitespace-nowrap"
                  >
                    {copiedId === img.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedId === img.id ? 'Copied' : 'Copy URL'}
                  </button>
                  <button
                    onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setDeleteConfirm(img.id); }}
                    className="py-1.5 px-2 bg-red-500/60 backdrop-blur-sm rounded-lg text-white flex items-center justify-center cursor-pointer hover:bg-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-2">
                <p className="text-xs font-medium text-white truncate" title={img.file_name}>{img.file_name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">{formatSize(img.file_size)}</span>
                  <span className="text-[10px] text-slate-600">
                    {new Date(img.created_at).toLocaleDateString('en-GB')}
                  </span>
                </div>

                <div className="relative">
                  <button
                    onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setAssigningTemplate({ imageId: img.id, templateId: img.template_id || '' }); }}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer"
                  >
                    <Link2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{img.template_id ? getTemplateName(img.template_id) : 'Assign template...'}</span>
                  </button>

                  <AnimatePresence>
                    {assigningTemplate?.imageId === img.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute bottom-full left-0 right-0 mb-1 bg-[#0F172A] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-xl p-2 z-10"
                        onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
                      >
                        <div className="flex gap-1.5">
                          <select
                            value={assigningTemplate.templateId}
                            onChange={(e) => setAssigningTemplate({ ...assigningTemplate, templateId: e.target.value })}
                            className="flex-1 px-2 py-1.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-[10px] text-white focus:outline-none cursor-pointer pr-6"
                          >
                            <option value="none">None</option>
                            {templates.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignTemplate(img.id, assigningTemplate.templateId)}
                            className="px-2 py-1.5 bg-[#06B6D4] text-white rounded-lg text-[10px] font-medium cursor-pointer hover:bg-[#0891B2] whitespace-nowrap"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setAssigningTemplate(null)}
                            className="px-2 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-sm w-full p-6"
              onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Image?</h3>
                  <p className="text-sm text-slate-400">This cannot be undone. Any emails using this image will break.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
