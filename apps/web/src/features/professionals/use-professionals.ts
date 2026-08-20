import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { staffApi } from '@/lib/staff-api';
import type { Professional, ProfessionalHour } from '@/lib/types';

export interface ProfessionalInput {
  name: string;
  phone?: string;
  isActive?: boolean;
  serviceIds?: string[];
}

export interface ProfessionalHourInput {
  weekday: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export function useProfessionals() {
  return useQuery({
    queryKey: ['professionals'],
    queryFn: () => staffApi.get<Professional[]>('/professionals'),
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfessionalInput) => staffApi.post<Professional>('/professionals', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['professionals'] }),
  });
}

export function useUpdateProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProfessionalInput> }) =>
      staffApi.patch<Professional>(`/professionals/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['professionals'] }),
  });
}

export function useProfessionalHours(professionalId: string | undefined) {
  return useQuery({
    queryKey: ['professionals', professionalId, 'hours'],
    queryFn: () => staffApi.get<ProfessionalHour[]>(`/professionals/${professionalId}/hours`),
    enabled: !!professionalId,
  });
}

export function useUpdateProfessionalHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hours }: { id: string; hours: ProfessionalHourInput[] }) =>
      staffApi.put<ProfessionalHour[]>(`/professionals/${id}/hours`, { hours }),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ['professionals', variables.id, 'hours'] }),
  });
}
