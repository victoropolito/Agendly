import { useQuery } from '@tanstack/react-query';

import { useCustomerAuth } from '@/features/customer-auth/customer-auth-context';
import type { BarbershopListing } from '@/lib/types';

export function useBarbershopDirectory() {
  const { api } = useCustomerAuth();
  return useQuery({
    queryKey: ['public', 'barbershops'],
    queryFn: () => api.get<BarbershopListing[]>('/public/barbershops', { skipAuth: true }),
  });
}

export function useMyBarbershops() {
  const { api, isAuthenticated } = useCustomerAuth();
  return useQuery({
    queryKey: ['public', 'auth', 'me', 'barbershops'],
    queryFn: () => api.get<BarbershopListing[]>('/public/auth/me/barbershops'),
    enabled: isAuthenticated,
  });
}
