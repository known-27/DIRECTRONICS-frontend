/**
 * useFilterState — persists FilterState in URL search params so that
 * filters survive page navigations, refreshes, and action redirects.
 *
 * Usage:
 *   const [filters, setFilters, clearFilters] = useFilterState('projects');
 *
 * Each page passes a unique `namespace` key so multiple pages can have
 * their own independent filter state in the URL.
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { FilterState } from '@/types';

const DEFAULT_STATE: FilterState = { page: '1', limit: '20' };

const FILTER_KEYS: (keyof FilterState)[] = [
  'page', 'limit', 'dateRange', 'startDate', 'endDate',
  'status', 'employeeId', 'serviceId', 'paymentMode',
];

/**
 * @param namespace - a short string unique to the page (e.g. 'projects', 'payments')
 *                   used to prefix URL param keys so pages don't clash.
 */
export function useFilterState(namespace: string): [
  FilterState,
  (f: FilterState) => void,
  () => void,
] {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  // Read current filter values from URL params (prefixed by namespace)
  const filters: FilterState = useMemo(() => {
    const state: FilterState = { ...DEFAULT_STATE };
    FILTER_KEYS.forEach((key) => {
      const val = searchParams.get(`${namespace}_${key}`);
      if (val !== null) {
        (state as Record<string, string>)[key] = val;
      }
    });
    return state;
  }, [searchParams, namespace]);

  // Write filter state back into the URL (replaces history entry so Back works cleanly)
  const setFilters = useCallback(
    (newFilters: FilterState) => {
      const params = new URLSearchParams(searchParams.toString());

      // Remove all old params for this namespace first
      FILTER_KEYS.forEach((key) => params.delete(`${namespace}_${key}`));

      // Write non-default, non-undefined values
      FILTER_KEYS.forEach((key) => {
        const val = (newFilters as Record<string, string | undefined>)[key];
        if (val !== undefined && val !== '') {
          params.set(`${namespace}_${key}`, val);
        }
      });

      // Always preserve page + limit in the URL
      if (!params.has(`${namespace}_page`))  params.set(`${namespace}_page`, '1');
      if (!params.has(`${namespace}_limit`)) params.set(`${namespace}_limit`, '20');

      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, namespace],
  );

  const clearFilters = useCallback(() => {
    setFilters({ page: '1', limit: '20' });
  }, [setFilters]);

  return [filters, setFilters, clearFilters];
}
