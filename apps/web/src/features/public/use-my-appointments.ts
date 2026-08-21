import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCustomerAuth } from '@/features/customer-auth/customer-auth-context';
import { useBarbershopSlug } from '@/features/public/use-barbershop-slug';
import type { Appointment } from '@/lib/types';

export interface BookAppointmentInput {
  serviceId: string;
  professionalId?: string;
  date: string;
  startTime: string;
  notes?: string;
}

export interface CustomerRescheduleInput {
  date: string;
  startTime: string;
  professionalId?: string;
}

export function useMyAppointments() {
  const { api, isAuthenticated } = useCustomerAuth();
  const slug = useBarbershopSlug();
  return useQuery({
    queryKey: ['public', slug, 'me', 'appointments'],
    queryFn: () => api.get<Appointment[]>(`/public/barbershops/${slug}/me/appointments`),
    enabled: isAuthenticated,
  });
}

export function useBookAppointment() {
  const { api } = useCustomerAuth();
  const slug = useBarbershopSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BookAppointmentInput) => api.post<Appointment>(`/public/barbershops/${slug}/me/appointments`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['public', slug, 'me', 'appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['public', slug, 'availability'] });
    },
  });
}

export function useCancelMyAppointment() {
  const { api } = useCustomerAuth();
  const slug = useBarbershopSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Appointment>(`/public/barbershops/${slug}/me/appointments/${id}/cancel`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['public', slug, 'me', 'appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['public', slug, 'availability'] });
    },
  });
}

export function useRescheduleMyAppointment() {
  const { api } = useCustomerAuth();
  const slug = useBarbershopSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerRescheduleInput }) =>
      api.post<Appointment>(`/public/barbershops/${slug}/me/appointments/${id}/reschedule`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['public', slug, 'me', 'appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['public', slug, 'availability'] });
    },
  });
}
