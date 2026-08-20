'use client';

import { Check, Copy, ExternalLink } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function PublicLinkCard({ slug }: { slug: string }) {
  const [origin, setOrigin] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    // Reads the current origin once mounted in the browser — a genuine sync with a platform
    // API unavailable during SSR, not state derived from props/other state. Avoids an
    // SSR/client mismatch and automatically matches wherever this is actually running
    // (localhost, Vercel, a future custom domain) without a hardcoded or env-configured URL.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const link = origin ? `${origin}/barbearia/${slug}` : '';

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar. Copie manualmente.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link da barbearia</CardTitle>
        <CardDescription>Compartilhe este link com seus clientes para eles agendarem online.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={link} placeholder="Carregando…" className="font-mono text-sm" onFocus={(event) => event.target.select()} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => void handleCopy()} disabled={!link} className="shrink-0">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
            {link ? (
              <Button type="button" variant="outline" size="icon" className="shrink-0" asChild>
                <a href={link} target="_blank" rel="noopener noreferrer" title="Abrir">
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            ) : (
              <Button type="button" variant="outline" size="icon" disabled className="shrink-0">
                <ExternalLink className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
