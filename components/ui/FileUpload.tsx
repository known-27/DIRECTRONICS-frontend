'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  accept:       string;
  maxSizeMB:    number;
  label:        string;
  /**
   * The relative URL path stored in the DB (e.g. /uploads/project-images/…).
   * Pass the raw relative path — this component fetches it via the authenticated
   * axios client so it works even with SameSite=Strict cookies cross-port.
   */
  currentUrl?:  string | null;
  previewType?: 'image' | 'document';
  onUpload:     (file: File) => Promise<string>; // Returns URL after upload
  disabled?:    boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  maxSizeMB,
  label,
  currentUrl,
  previewType = 'image',
  onUpload,
  disabled = false,
}) => {
  const inputRef              = useRef<HTMLInputElement>(null);
  /** Local data-URL created by FileReader right after the user picks a file */
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading,    setUploading]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [uploaded,     setUploaded]     = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    setError(null);
    setUploading(true);

    // Immediate local preview (data URL — no auth needed, works cross-origin)
    if (previewType === 'image' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setLocalPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setLocalPreview(null);
    }

    try {
      await onUpload(file);
      setUploaded(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      setLocalPreview(null);
    } finally {
      setUploading(false);
    }
  };

  // Determine what to show in the preview area:
  // 1. If user just picked a file → show local data-URL (freshest)
  // 2. Else if server has an existing file → use ProtectedPreview (fetched with auth)
  // 3. Else → show the upload prompt
  const hasServerFile = !localPreview && currentUrl;

  return (
    <div className="space-y-2">
      <label className="label">{label}</label>

      <div
        className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500/50'}
          ${error ? 'border-red-500/50' : 'border-transparent'}`}
        style={{ background: 'var(--bg-elevated)' }}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Uploading...</span>
          </div>

        ) : localPreview && previewType === 'image' ? (
          // Fresh local preview after file pick (no auth needed)
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={localPreview} alt="Preview" className="h-24 w-24 rounded-full object-cover mx-auto" />
            {uploaded && (
              <CheckCircle size={18} className="absolute bottom-0 right-0 text-emerald-400 bg-white rounded-full" />
            )}
          </div>

        ) : hasServerFile && previewType === 'image' ? (
          // Existing server image — public Cloudinary URL
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentUrl!} alt="Current" className="h-24 w-24 rounded-full object-cover mx-auto" />
            {uploaded && (
              <CheckCircle size={18} className="absolute bottom-0 right-0 text-emerald-400 bg-white rounded-full" />
            )}
          </div>

        ) : hasServerFile && previewType === 'document' ? (
          // Document: just show a "Document uploaded" badge
          <div className="flex items-center justify-center gap-2 py-2">
            <CheckCircle size={18} className="text-emerald-400" />
            <span className="text-xs text-emerald-400">Document uploaded</span>
            <button
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="text-xs underline ml-2"
              style={{ color: 'var(--accent-primary)' }}
            >
              Replace
            </button>
          </div>

        ) : (
          // No file yet
          <div className="flex flex-col items-center gap-2 py-2">
            <Upload size={24} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Click to upload or drag &amp; drop
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Max {maxSizeMB}MB • {accept}
            </span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || uploading}
        />
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <X size={12} />
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
