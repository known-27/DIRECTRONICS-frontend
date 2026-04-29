'use client';

import React from 'react';
import { X, FileText, ExternalLink } from 'lucide-react';
import { Modal } from './Modal';

interface DocumentViewerProps {
  /** The relative URL path stored in the DB, e.g. /uploads/identity-docs/userId/filename.jpg */
  apiPath: string | null | undefined;
  label:   string;
  isOpen:  boolean;
  onClose: () => void;
}

function isImagePath(url: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
}

function isPdfPath(url: string): boolean {
  return /\.pdf$/i.test(url);
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ apiPath, label, isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={label}
      footer={
        <div className="flex gap-2">
          {apiPath && (
            <a
              href={apiPath}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2"
            >
              <ExternalLink size={14} /> Open in New Tab
            </a>
          )}
          <button className="btn-primary" onClick={onClose}>
            <X size={14} /> Close
          </button>
        </div>
      }
    >
      <div className="w-full" style={{ minHeight: '60vh' }}>
        {apiPath && (
          <>
            {isImagePath(apiPath) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={apiPath}
                alt={label}
                className="w-full h-auto rounded-lg object-contain max-h-[70vh]"
              />
            ) : isPdfPath(apiPath) ? (
              <iframe
                src={apiPath}
                title={label}
                className="w-full rounded-lg"
                style={{ height: '70vh', border: 'none' }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <FileText size={48} style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Preview not available for this file type.
                </p>
                <a href={apiPath} download className="btn-primary">
                  Download File
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default DocumentViewer;
