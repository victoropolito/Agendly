import type { ReactNode } from 'react';

import { PublicBarbershopShell } from '@/features/public/public-barbershop-shell';

export default async function BarbershopLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicBarbershopShell slug={slug}>{children}</PublicBarbershopShell>;
}
