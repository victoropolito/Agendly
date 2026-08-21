'use client';

import { useParams } from 'next/navigation';

/** The `[slug]` segment of the current `/barbearia/[slug]/...` route — decoupled from customer auth, which is now a global session, not scoped to any one barbershop. */
export function useBarbershopSlug(): string {
  const params = useParams<{ slug: string }>();
  return params.slug;
}
