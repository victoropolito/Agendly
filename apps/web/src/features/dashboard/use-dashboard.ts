import { useQuery } from '@tanstack/react-query';

import { staffApi } from '@/lib/staff-api';
import type { DashboardSummary } from '@/lib/types';

export function useDashboardSummary(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => staffApi.get<DashboardSummary>('/dashboard/summary'),
    enabled: options?.enabled ?? true,
  });
}
