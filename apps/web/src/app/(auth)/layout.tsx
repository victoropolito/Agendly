import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-secondary/40 px-4 py-12">
      <Link href="/" className="text-xl font-semibold tracking-tight">
        Agendly
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
