'use client';

import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, Upload, X, Loader2, CheckCircle, AlertCircle, Image } from 'lucide-react';
import { formatFileSize } from './evidence-types';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'text/plain', 'text/csv'];
const MAX_IMAGE_SIZE = 10485760;
const MAX_DOC_SIZE = 15728640;

interface ScreenshotPreview {
  dataUrl: string;
  filename: string;
  mime_type: string;
  file_size_bytes: number;
  blob: Blob;
}

interface UATScreenshotCaptureProps {
  assignmentId: string;
  assignmentTestCaseId: string | null;
  sessionId: string | null;
  onUploadComplete: () => void;
  onClose: () => void;
}

export default function UATScreenshotCapture({
  assignmentId, assignmentTestCaseId, sessionId, onUploadComplete, onClose,
}: UATScreenshotCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<ScreenshotPreview | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [caption, setCaption] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [captureMode, setCaptureMode] = useState<'screen' | 'upload'>('screen');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startScreenCapture = useCallback(async () => {
    setError('');
    setCapturing(true);
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as MediaTrackConstraints,
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      mediaStream.getVideoTracks()[0].onended = () => {
        setStream(null);
        setCapturing(false);
      };
    } catch (err: any) {
      setCapturing(false);
      if (err.name === 'NotAllowedError') {
        setError('Permission denied. Please allow screen capture and try again.');
      } else {
        setError('Screen capture is not supported in this browser. Please upload a file instead.');
      }
    }
  }, []);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const timestamp = Date.now();
      const filename = `screenshot-${timestamp}.png`;
      const reader = new FileReader();
      reader.onload = () => {
        setPreview({
          dataUrl: reader.result as string,
          filename,
          mime_type: 'image/png',
          file_size_bytes: blob.size,
          blob,
        });
      };
      reader.readAsDataURL(blob);
    }, 'image/png');

    stopStream();
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      setCapturing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      setError('File too large. Maximum: 10 MB.');
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Invalid file type. Accepted: PNG, JPEG, WebP.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreview({
        dataUrl: reader.result as string,
        filename: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        blob: file,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;
    setUploading(true);
    setError('');

    try {
      const { data: prep, error: prepErr } = await supabase.rpc('prepare_uat_evidence_upload', {
        p_assignment_id: assignmentId,
        p_original_filename: preview.filename,
        p_mime_type: preview.mime_type,
        p_file_size_bytes: preview.file_size_bytes,
        p_evidence_type: 'screenshot',
        p_assignment_test_case_id: assignmentTestCaseId,
        p_session_id: sessionId,
        p_caption: caption || null,
      });

      if (prepErr) { setError(prepErr.message); setUploading(false); return; }
      const prepData = prep as any;
      if (!prepData?.success) { setError(prepData?.message || 'Failed to prepare upload.'); setUploading(false); return; }

      const { error: uploadErr } = await supabase.storage
        .from('uat-evidence')
        .upload(prepData.storage_path, preview.blob, {
          contentType: preview.mime_type,
          upsert: false,
        });

      if (uploadErr) {
        await supabase.rpc('soft_delete_uat_evidence', { p_evidence_id: prepData.evidence_id });
        setError(uploadErr.message || 'Upload failed.');
        setUploading(false);
        return;
      }

      setUploaded(true);
      onUploadComplete();
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    }
    setUploading(false);
  };

  const retake = () => {
    setPreview(null);
    setConfirmed(false);
    setError('');
    setStartCaptureMode();
  };

  const setStartCaptureMode = () => {
    setCaptureMode('screen');
    startScreenCapture();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-[#17325c]">Capture Screenshot</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {uploaded ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="text-lg font-bold text-[#17325c] mb-2">Evidence Uploaded</h4>
            <p className="text-sm text-slate-500 mb-6">Your screenshot has been securely saved.</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-[#2878d0] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">Done</button>
          </div>
        ) : preview ? (
          <div className="p-4 space-y-4">
            <div className="bg-slate-100 rounded-xl overflow-hidden">
              <img src={preview.dataUrl} alt="Screenshot preview" className="w-full h-auto max-h-[300px] object-contain" />
            </div>

            <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">File</span><span className="text-slate-600 font-medium truncate ml-4">{preview.filename}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Size</span><span className="text-slate-600 font-medium">{formatFileSize(preview.file_size_bytes)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="text-slate-600 font-medium">{preview.mime_type}</span></div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Caption (optional)</label>
              <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe this evidence..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2878d0]/20 focus:border-[#2878d0]/40 transition-all" />
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-800 font-medium">Privacy Reminder</p>
                <p className="text-[11px] text-amber-600 mt-0.5">Select only the assigned test website. Do not capture personal tabs, messages or unrelated information.</p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#2878d0] focus:ring-[#2878d0]" />
              <span className="text-xs text-slate-600">I have checked that this evidence does not contain unrelated personal or confidential information.</span>
            </label>

            <div className="flex gap-2">
              <button onClick={retake} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-pointer whitespace-nowrap transition-colors">Retake</button>
              <button onClick={handleUpload} disabled={!confirmed || uploading}
                className="flex-1 py-2.5 bg-[#2878d0] hover:bg-[#1e68b9] disabled:opacity-40 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap transition-colors flex items-center justify-center gap-2">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload Evidence
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-500">Select only the assigned test website. Do not capture personal tabs, messages or unrelated information.</p>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setCaptureMode('screen'); startScreenCapture(); }}
                disabled={capturing}
                className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-slate-200 hover:border-[#2878d0]/50 hover:bg-[#edf5ff] rounded-2xl cursor-pointer transition-all">
                <div className="w-12 h-12 rounded-2xl bg-[#edf5ff] flex items-center justify-center">
                  <Camera className="w-6 h-6 text-[#2878d0]" />
                </div>
                <span className="text-sm font-semibold text-[#17325c]">Screen Capture</span>
                <span className="text-[11px] text-slate-400 text-center">Capture a browser tab<br />using Screen Capture API</span>
              </button>

              <button onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-slate-200 hover:border-[#2878d0]/50 hover:bg-[#edf5ff] rounded-2xl cursor-pointer transition-all">
                <div className="w-12 h-12 rounded-2xl bg-[#edf5ff] flex items-center justify-center">
                  <Upload className="w-6 h-6 text-[#2878d0]" />
                </div>
                <span className="text-sm font-semibold text-[#17325c]">Upload File</span>
                <span className="text-[11px] text-slate-400 text-center">Upload screenshot<br />from your device</span>
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileSelect} className="hidden" />

            {capturing && stream && (
              <div className="space-y-3">
                <video ref={videoRef} autoPlay className="w-full rounded-xl bg-black max-h-[300px]" />
                <button onClick={captureFrame}
                  className="w-full py-2.5 bg-[#2878d0] hover:bg-[#1e68b9] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap transition-colors flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" /> Capture Frame
                </button>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </div>
    </div>
  );
}