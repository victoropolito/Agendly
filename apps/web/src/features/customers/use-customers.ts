import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { staffApi } from '@/lib/staff-api';
import type { Customer } from '@/lib/types';

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string;
}

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ['customers', search ?? ''],
    queryFn: () => staffApi.get<Customer[]>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerInput) => staffApi.post<Customer>('/customers', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
}
