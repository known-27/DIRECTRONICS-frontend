'use client';

import React from 'react';
import { useProtectedFile } from '@/hooks/useProtectedFile';

interface ProtectedImageProps {
  /** The relative URL path stored in the DB, e.g. /uploads/profile-pictures/userId/filename.jpg */
  src:        string | null | undefined;
  alt:        string;
  className?: string;
  style?:     React.CSSProperties;
  /** Rendered when the image is loading or unavailable */
  fallback?:  React.ReactNode;
}

/**
 * Renders a protected image that is fetched via the authenticated axios client.
 * This works around the browser's SameSite=Strict cookie restriction that prevents
 * plain <img src> tags from including auth cookies on cross-port requests.
 */
export const ProtectedImage: React.FC<ProtectedImageProps> = ({
  src,
  alt,
  className,
  style,
  fallback,
}) => {
  const { objectUrl, loading } = useProtectedFile(src || null);

  if (loading) {
    return (
      <div
        className={className}
        style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading...</span>
      </div>
    );
  }

  if (!objectUrl) return fallback ? <>{fallback}</> : null;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={objectUrl} alt={alt} className={className} style={style} />;
};

export default ProtectedImage;
