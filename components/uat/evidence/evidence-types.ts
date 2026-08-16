'use client';

export type EvidenceType = 'screenshot' | 'image' | 'document';
export type EvidenceStatus = 'uploaded' | 'attached' | 'quarantined' | 'rejected' | 'deleted';

export interface UATEvidence {
  id: string;
  project_id: string;
  job_id: string | null;
  assignment_id: string;
  assignment_test_case_id: string | null;
  test_case_id: string | null;
  session_id: string | null;
  feedback_id: string | null;
  tester_id: string;
  evidence_type: EvidenceType;
  storage_bucket: string;
  storage_path: string;
  original_filename: string;
  safe_filename: string;
  mime_type: string;
  file_size_bytes: number;
  width: number | null;
  height: number | null;
  capture_source: string;
  caption: string | null;
  tester_notes: string | null;
  browser_name: string | null;
  browser_version: string | null;
  operating_system: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  status: EvidenceStatus;
  created_at: string;
  updated_at: string;
  signedUrl?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export function getEvidenceTypeIcon(type: EvidenceType): string {
  if (type === 'screenshot') return 'ri-camera-line';
  if (type === 'image') return 'ri-image-line';
  return 'ri-file-text-line';
}

export function isImageEvidence(evidence: UATEvidence): boolean {
  return evidence.evidence_type === 'screenshot' || evidence.evidence_type === 'image';
}