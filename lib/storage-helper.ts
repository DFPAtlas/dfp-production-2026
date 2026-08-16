'use client';

import { supabase } from '@/lib/supabase';
import { safeErrorFormat } from '@/lib/query-helpers';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'text/plain', 'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'txt', 'csv', 'xlsx'];

export interface UploadResult {
  success: boolean;
  error: string | null;
  publicUrl: string | null;
  storagePath: string | null;
  fileName: string | null;
  fileSize: number | null;
  content_type: string | null;
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^\.+/, '')
    .toLowerCase();
}

function generateStoragePath(prefix: string, fileName: string, scope?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeName = sanitizeFileName(fileName);
  const uniqueName = `${timestamp}-${random}-${safeName}`;
  if (scope) {
    return `${prefix}/${scope}/${uniqueName}`;
  }
  return `${prefix}/${uniqueName}`;
}

function validateFile(file: File): string | null {
  if (file.size === 0) return 'File is empty';
  if (file.size > MAX_FILE_SIZE) return `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) return `File type .${ext} is not allowed`;
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    if (ext === 'csv' && file.type === 'text/csv') return null;
    if (ext && ['pdf', 'txt', 'xlsx'].includes(ext)) return null;
    return `File type ${file.type} is not allowed`;
  }
  return null;
}

export async function uploadFileToStorage(
  file: File,
  bucketName: string,
  prefix: string,
  scope?: string
): Promise<UploadResult> {
  const validationError = validateFile(file);
  if (validationError) {
    return { success: false, error: validationError, publicUrl: null, storagePath: null, fileName: null, fileSize: null, content_type: null };
  }

  const storagePath = generateStoragePath(prefix, file.name, scope);

  try {
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: safeErrorFormat(uploadError), publicUrl: null, storagePath: null, fileName: null, fileSize: null, content_type: null };
    }

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);

    return {
      success: true,
      error: null,
      publicUrl: urlData.publicUrl,
      storagePath,
      fileName: file.name,
      fileSize: file.size,
      content_type: file.type,
    };
  } catch (err) {
    return { success: false, error: safeErrorFormat(err), publicUrl: null, storagePath: null, fileName: null, fileSize: null, content_type: null };
  }
}

export async function getSignedUrl(
  bucketName: string,
  storagePath: string,
  expiresInSeconds = 3600
): Promise<{ url: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) return { url: null, error: safeErrorFormat(error) };
    return { url: data.signedUrl, error: null };
  } catch (err) {
    return { url: null, error: safeErrorFormat(err) };
  }
}

export async function deleteFromStorage(
  bucketName: string,
  storagePaths: string[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.storage.from(bucketName).remove(storagePaths);
    if (error) return { success: false, error: safeErrorFormat(error) };
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: safeErrorFormat(err) };
  }
}

export function getPublicUrl(bucketName: string, storagePath: string): string {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
  return data.publicUrl;
}