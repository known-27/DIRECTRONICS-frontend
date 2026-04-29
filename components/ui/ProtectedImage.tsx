'use client';

import React from 'react';

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
 * Renders an image using its public URL (e.g. from Cloudinary).
 * Kept the name `ProtectedImage` to avoid refactoring hundreds of imports,
 * but it no longer requires authenticated fetching.
 */
export const ProtectedImage: React.FC<ProtectedImageProps> = ({
  src,
  alt,
  className,
  style,
  fallback,
}) => {
  if (!src) return fallback ? <>{fallback}</> : null;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} style={style} />;
};

export default ProtectedImage;
