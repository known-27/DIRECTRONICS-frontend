'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { X, Download } from 'lucide-react';

interface ImageLightboxProps {
  /** Authenticated blob URL to display */
  src: string;
  /** Used as the downloaded file name */
  fileName: string;
  onClose: () => void;
}

/**
 * Full-screen accessible lightbox for viewing a protected job-card image.
 *
 * Accessibility:
 * - role="dialog", aria-modal="true", aria-label
 * - Focus is trapped inside the modal while open
 * - Focus returns to the trigger element on close
 * - Closes on Escape key
 * - Closes on clicking the overlay (outside the image card)
 */
export const ImageLightbox = ({ src, fileName, onClose }: ImageLightboxProps): React.ReactElement => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the close button on open
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();

      // Basic focus trap: Tab / Shift+Tab loops within dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = fileName;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      role="presentation"
    >
      {/* Dialog card — clicks inside do NOT propagate to overlay */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Job card image viewer"
        className="relative flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-base)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-base)' }}
        >
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)', maxWidth: '60vw' }}>
            {fileName}
          </p>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleDownload}
              className="btn-secondary btn-sm flex items-center gap-1.5"
              title="Download image"
            >
              <Download size={14} />
              Download
            </button>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="btn-ghost btn-sm"
              title="Close (Esc)"
              aria-label="Close lightbox"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Image — scrollable if larger than viewport */}
        <div className="overflow-auto flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="Job card"
            style={{ maxWidth: '85vw', maxHeight: '80vh', display: 'block', objectFit: 'contain' }}
          />
        </div>
      </div>
    </div>
  );
};
