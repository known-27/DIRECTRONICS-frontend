'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationsApi } from '@/lib/api';

const POLL_INTERVAL_MS = 30_000;

interface UseNotificationCountsResult {
  pendingReviewCount: number;
  refetch: () => void;
}

/**
 * Polls GET /notifications/counts every 30 seconds to keep the admin sidebar
 * badge up-to-date.
 *
 * Rules:
 * - Fetches immediately on mount (no 30s wait).
 * - Re-fetches on browser tab focus (visibilitychange).
 * - On error: silently fails, keeps the last known count.
 * - Clears interval and event listener on unmount.
 * - Updates document.title with pending count prefix when count > 0.
 */
export function useNotificationCounts(): UseNotificationCountsResult {
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await notificationsApi.getCounts();
      const count = res.data.data.pendingReviewCount;
      setPendingReviewCount(count);

      // Update browser tab title
      const baseTitle = 'ServiceFlow ERP';
      document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;
    } catch {
      // Silent fail — keep displaying last known count
    }
  }, []);

  useEffect(() => {
    // Fetch immediately on mount
    void fetchCounts();

    // Set up 30-second polling
    intervalRef.current = setInterval(() => {
      void fetchCounts();
    }, POLL_INTERVAL_MS);

    // Re-fetch when admin returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchCounts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Cleanup: prevent memory leaks
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchCounts]);

  return { pendingReviewCount, refetch: fetchCounts };
}
