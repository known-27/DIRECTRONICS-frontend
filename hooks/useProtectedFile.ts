'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

/**
 * Fetches a protected file via the authenticated axios client and returns a
 * blob object URL suitable for use in <img src> or <iframe src>.
 *
 * - Handles the auth cookie that cannot be sent by plain <img src> tags
 *   when the API is on a different port (cross-origin).
 * - Returns null while loading or on error.
 * - Revokes the object URL on cleanup to prevent memory leaks.
 */
export function useProtectedFile(apiRelativeUrl: string | null | undefined): {
  objectUrl: string | null;
  loading:   boolean;
  error:     string | null;
} {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!apiRelativeUrl) {
      setObjectUrl(null);
      return;
    }

    let currentUrl: string | null = null;
    setLoading(true);
    setError(null);

    api
      .get(apiRelativeUrl, { responseType: 'blob' })
      .then((res) => {
        currentUrl = URL.createObjectURL(res.data as Blob);
        setObjectUrl(currentUrl);
      })
      .catch(() => {
        setError('Failed to load file');
        setObjectUrl(null);
      })
      .finally(() => setLoading(false));

    // Cleanup: revoke the blob URL when the component unmounts or URL changes
    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [apiRelativeUrl]);

  return { objectUrl, loading, error };
}
