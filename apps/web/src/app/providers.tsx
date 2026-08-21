'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

import { Toaster } from '@/components/ui/sonner';
import { StaffAuthProvider } from '@/features/auth/staff-auth-context';
import { CustomerAuthProvider } from '@/features/customer-auth/customer-auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 15_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <StaffAuthProvider>
        <CustomerAuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </CustomerAuthProvider>
      </StaffAuthProvider>
    </QueryClientProvider>
  );
}
