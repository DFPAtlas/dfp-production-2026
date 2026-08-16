export const FILE_SOURCES = [
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
  { value: 'client', label: 'Client' },
  { value: 'system', label: 'System' },
] as const;

export const FILE_STATUSES = [
  { value: 'uploaded', label: 'Uploaded', color: '#6B7280' },
  { value: 'processing', label: 'Processing', color: '#F59E0B' },
  { value: 'ready', label: 'Ready', color: '#10B981' },
  { value: 'awaiting_review', label: 'Awaiting Review', color: '#8B5CF6' },
  { value: 'approved', label: 'Approved', color: '#4ADE80' },
  { value: 'rejected', label: 'Rejected', color: '#EF4444' },
  { value: 'replaced', label: 'Replaced', color: '#6B7280' },
  { value: 'archived', label: 'Archived', color: '#6B7280' },
  { value: 'blocked', label: 'Blocked', color: '#EF4444' },
] as const;

export const FILE_CATEGORIES = [
  { value: 'branding', label: 'Branding' },
  { value: 'logo', label: 'Logo' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'copy', label: 'Copy' },
  { value: 'document', label: 'Document' },
  { value: 'contract', label: 'Contract' },
  { value: 'design', label: 'Design' },
  { value: 'technical', label: 'Technical' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'report', label: 'Report' },
  { value: 'approval', label: 'Approval' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Other' },
] as const;

export const CONTENT_REQUEST_STATUSES = [
  { value: 'draft', label: 'Draft', color: '#6B7280' },
  { value: 'requested', label: 'Requested', color: '#3B82F6' },
  { value: 'viewed', label: 'Viewed', color: '#8B5CF6' },
  { value: 'partially_submitted', label: 'Partially Submitted', color: '#F59E0B' },
  { value: 'submitted', label: 'Submitted', color: '#10B981' },
  { value: 'accepted', label: 'Accepted', color: '#4ADE80' },
  { value: 'changes_required', label: 'Changes Required', color: '#EF4444' },
  { value: 'completed', label: 'Completed', color: '#4ADE80' },
  { value: 'cancelled', label: 'Cancelled', color: '#6B7280' },
] as const;

export const CONTENT_REQUEST_PRIORITIES = [
  { value: 'normal', label: 'Normal', color: '#6B7280' },
  { value: 'high', label: 'High', color: '#F59E0B' },
  { value: 'urgent', label: 'Urgent', color: '#EF4444' },
] as const;

export const ALLOWED_EXTENSIONS = [
  'pdf', 'docx', 'xlsx', 'csv', 'txt',
  'jpg', 'jpeg', 'png', 'webp', 'svg',
  'mp4', 'zip',
] as const;

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'text/plain',
  'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
  'video/mp4',
  'application/zip',
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function getFileStatusDef(value: string) {
  return FILE_STATUSES.find(s => s.value === value) || FILE_STATUSES[2];
}

export function getFileCategoryDef(value: string) {
  return FILE_CATEGORIES.find(c => c.value === value) || FILE_CATEGORIES[13];
}

export function getContentRequestStatusDef(value: string) {
  return CONTENT_REQUEST_STATUSES.find(s => s.value === value) || CONTENT_REQUEST_STATUSES[0];
}

export function getContentRequestPriorityDef(value: string) {
  return CONTENT_REQUEST_PRIORITIES.find(p => p.value === value) || CONTENT_REQUEST_PRIORITIES[0];
}

export function getFileTypeIcon(fileType: string): string {
  if (!fileType) return 'file';
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('video/')) return 'video';
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.includes('word') || fileType.includes('document')) return 'doc';
  if (fileType.includes('sheet') || fileType.includes('csv')) return 'spreadsheet';
  if (fileType.includes('zip')) return 'archive';
  return 'file';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function validateFile(file: File): string | null {
  if (file.size === 0) return 'File is empty';
  if (file.size > MAX_FILE_SIZE) return `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext) return 'File has no extension';

  const doubleExtMatch = file.name.match(/\.[a-z]{2,4}\.[a-z]{2,4}$/i);
  if (doubleExtMatch && !['tar.gz'].includes(doubleExtMatch[0].toLowerCase())) {
    // Allow double extensions only for known safe combos
  }

  if (!ALLOWED_EXTENSIONS.includes(ext as any)) return `File type .${ext} is not allowed`;

  if (ALLOWED_MIME_TYPES.includes(file.type as any)) return null;
  if (ext === 'csv' && file.type === 'text/csv') return null;
  if (ext && ['pdf', 'txt', 'xlsx', 'docx', 'zip'].includes(ext)) return null;

  return `File type ${file.type} is not allowed`;
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^\.+/, '')
    .toLowerCase();
}

export function generateStoragePath(prefix: string, fileName: string, scope?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = sanitizeFileName(fileName);
  const uniqueName = `${timestamp}-${random}-${safeName}`;
  return scope ? `${prefix}/${scope}/${uniqueName}` : `${prefix}/${uniqueName}`;
}