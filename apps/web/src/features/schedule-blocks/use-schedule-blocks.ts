import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { staffApi } from '@/lib/staff-api';
import type { ScheduleBlock } from '@/lib/types';

export interface CreateScheduleBlockInput {
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export function useScheduleBlocks(filters: { date?: string; professionalId?: string }) {
  const query = new URLSearchParams();
  if (filters.date) query.set('date', filters.date);
  if (filters.professionalId) query.set('professionalId', filters.professionalId);

  return useQuery({
    queryKey: ['schedule-blocks', filters],
    queryFn: () => staffApi.get<ScheduleBlock[]>(`/schedule-blocks?${query.toString()}`),
  });
}

export function useCreateScheduleBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateScheduleBlockInput) => staffApi.post<ScheduleBlock>('/schedule-blocks', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['schedule-blocks'] });
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useDeleteScheduleBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.delete<void>(`/schedule-blocks/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['schedule-blocks'] });
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
