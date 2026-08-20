import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { staffApi } from '@/lib/staff-api';
import type { BusinessHour, EvolutionConnectionStart, Tenant, WhatsAppConnection } from '@/lib/types';

export interface UpdateTenantInput {
  name?: string;
  phone?: string;
  email?: string;
  description?: string;
  address?: string;
  logoUrl?: string;
  timezone?: string;
}

export interface BusinessHourInput {
  weekday: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export function useTenant(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['tenant', 'me'],
    queryFn: () => staffApi.get<Tenant>('/tenant/me'),
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTenantInput) => staffApi.patch<Tenant>('/tenant/me', data),
    onSuccess: (tenant) => queryClient.setQueryData(['tenant', 'me'], tenant),
  });
}

export function useBusinessHours(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['tenant', 'business-hours'],
    queryFn: () => staffApi.get<BusinessHour[]>('/tenant/me/business-hours'),
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateBusinessHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hours: BusinessHourInput[]) => staffApi.put<BusinessHour[]>('/tenant/me/business-hours', { hours }),
    onSuccess: (hours) => queryClient.setQueryData(['tenant', 'business-hours'], hours),
  });
}

export function useWhatsAppConnection(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['tenant', 'whatsapp-connection'],
    queryFn: () => staffApi.get<WhatsAppConnection>('/tenant/me/whatsapp-connection'),
    enabled: options?.enabled ?? true,
    // While waiting for the admin to scan the Evolution API QR code, poll until it flips to CONNECTED.
    refetchInterval: (query) => (query.state.data?.status === 'CONNECTING' ? 3000 : false),
  });
}

export function useStartEvolutionConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => staffApi.post<EvolutionConnectionStart>('/tenant/me/whatsapp-connection/evolution'),
    onSuccess: (connection) => queryClient.setQueryData(['tenant', 'whatsapp-connection'], connection),
  });
}

export function useDisconnectWhatsApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => staffApi.delete<void>('/tenant/me/whatsapp-connection'),
    onSuccess: () =>
      queryClient.setQueryData(['tenant', 'whatsapp-connection'], {
        provider: null,
        status: 'DISCONNECTED',
        phoneNumberId: null,
        businessAccountId: null,
        updatedAt: null,
      } satisfies WhatsAppConnection),
  });
}
