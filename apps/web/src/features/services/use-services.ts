import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { staffApi } from '@/lib/staff-api';
import type { Service } from '@/lib/types';

export interface ServiceInput {
  name: string;
  description?: string;
  priceCents: number;
  durationMinutes: number;
  isActive?: boolean;
}

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: () => staffApi.get<Service[]>('/services'),
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ServiceInput) => staffApi.post<Service>('/services', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceInput> }) => staffApi.patch<Service>(`/services/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });
}
