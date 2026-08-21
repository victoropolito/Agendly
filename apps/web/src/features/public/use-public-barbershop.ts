import { useQuery } from '@tanstack/react-query';

import { useCustomerAuth } from '@/features/customer-auth/customer-auth-context';
import { useBarbershopSlug } from '@/features/public/use-barbershop-slug';
import type { AvailabilityResult, PublicProfessional, PublicService, PublicTenant } from '@/lib/types';

export function usePublicTenant() {
  const { api } = useCustomerAuth();
  const slug = useBarbershopSlug();
  return useQuery({
    queryKey: ['public', slug, 'tenant'],
    queryFn: () => api.get<PublicTenant>(`/public/barbershops/${slug}`, { skipAuth: true }),
  });
}

export function usePublicServices() {
  const { api } = useCustomerAuth();
  const slug = useBarbershopSlug();
  return useQuery({
    queryKey: ['public', slug, 'services'],
    queryFn: () => api.get<PublicService[]>(`/public/barbershops/${slug}/services`, { skipAuth: true }),
  });
}

export function usePublicProfessionals() {
  const { api } = useCustomerAuth();
  const slug = useBarbershopSlug();
  return useQuery({
    queryKey: ['public', slug, 'professionals'],
    queryFn: () => api.get<PublicProfessional[]>(`/public/barbershops/${slug}/professionals`, { skipAuth: true }),
  });
}

export function usePublicAvailability(params: { serviceId?: string; professionalId?: string; date?: string }) {
  const { api } = useCustomerAuth();
  const slug = useBarbershopSlug();
  const query = new URLSearchParams();
  if (params.serviceId) query.set('serviceId', params.serviceId);
  if (params.professionalId) query.set('professionalId', params.professionalId);
  if (params.date) query.set('date', params.date);

  return useQuery({
    queryKey: ['public', slug, 'availability', params],
    queryFn: () => api.get<AvailabilityResult>(`/public/barbershops/${slug}/availability?${query.toString()}`, { skipAuth: true }),
    enabled: !!params.serviceId && !!params.date,
  });
}
