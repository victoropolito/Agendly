import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { staffApi } from '@/lib/staff-api';
import type { Appointment, AvailabilityResult } from '@/lib/types';

export interface AppointmentFilters {
  date?: string;
  professionalId?: string;
  status?: string;
}

export interface CreateAppointmentInput {
  customerId: string;
  professionalId: string;
  serviceId: string;
  date: string;
  startTime: string;
  notes?: string;
}

export interface RescheduleAppointmentInput {
  date: string;
  startTime: string;
  professionalId?: string;
}

function buildQuery(filters: AppointmentFilters): string {
  const params = new URLSearchParams();
  if (filters.date) params.set('date', filters.date);
  if (filters.professionalId) params.set('professionalId', filters.professionalId);
  if (filters.status) params.set('status', filters.status);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function useAppointments(filters: AppointmentFilters) {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => staffApi.get<Appointment[]>(`/appointments${buildQuery(filters)}`),
  });
}

export function useAvailability(params: { serviceId?: string; professionalId?: string; date?: string }) {
  const query = new URLSearchParams();
  if (params.serviceId) query.set('serviceId', params.serviceId);
  if (params.professionalId) query.set('professionalId', params.professionalId);
  if (params.date) query.set('date', params.date);

  return useQuery({
    queryKey: ['availability', params],
    queryFn: () => staffApi.get<AvailabilityResult>(`/availability?${query.toString()}`),
    enabled: !!params.serviceId && !!params.date,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppointmentInput) => staffApi.post<Appointment>('/appointments', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.post<Appointment>(`/appointments/${id}/cancel`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RescheduleAppointmentInput }) =>
      staffApi.post<Appointment>(`/appointments/${id}/reschedule`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
