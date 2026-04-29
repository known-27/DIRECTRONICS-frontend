'use client';

/**
 * ProfileAvatar
 * ─────────────────────────────────────────────────────────────────
 * Reusable avatar component. Renders a protected profile picture
 * via blob URL (authenticated request) or falls back to an initials
 * circle with a deterministic HSL color derived from the name.
 *
 * Props:
 *   profilePictureUrl  – relative API path (e.g. /uploads/profile-pictures/…)
 *   fullName           – used for initials + accessible alt text
 *   size               – xs | sm | md | lg | xl (maps to px dimensions)
 *   className          – optional extra CSS classes on the wrapper
 */

import React from 'react';
import { useProtectedFile } from '@/hooks/useProtectedFile';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ProfileAvatarProps {
  profilePictureUrl?: string | null;
  fullName:           string;
  size?:              AvatarSize;
  className?:         string;
}

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
};

const FONT_PX: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 20,
  xl: 28,
};

/** Deterministic pastel HSL from a string */
function nameToHsl(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 40%)`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === '') return 'U';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export const ProfileAvatar = ({
  profilePictureUrl,
  fullName,
  size = 'md',
  className = '',
}: ProfileAvatarProps): React.ReactElement => {
  const px       = SIZE_PX[size];
  const fontSize = FONT_PX[size];
  const initials = getInitials(fullName || 'User');
  const bgColor  = nameToHsl(fullName || 'User');

  const { objectUrl, loading } = useProtectedFile(
    profilePictureUrl ?? null,
  );

  const baseStyle: React.CSSProperties = {
    width:          px,
    height:         px,
    borderRadius:   '50%',
    flexShrink:     0,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
    fontSize,
    fontWeight:     600,
    color:          '#fff',
    backgroundColor: bgColor,
    userSelect:     'none',
  };

  if (loading) {
    return (
      <div
        className={`animate-pulse ${className}`}
        style={{ ...baseStyle, backgroundColor: 'var(--bg-elevated, #1e293b)' }}
        aria-hidden="true"
      />
    );
  }

  if (objectUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={objectUrl}
        alt={fullName}
        className={className}
        style={{ ...baseStyle }}
        onError={(e) => {
          // Fall back to initials on render error
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={baseStyle}
      aria-label={`Avatar for ${fullName}`}
      role="img"
    >
      {initials}
    </div>
  );
};
