import { CalendarCheck, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const FEATURES = [
  {
    icon: CalendarCheck,
    title: 'Agenda sem conflitos',
    description: 'A confirmação do horário é garantida no banco de dados — nunca dois clientes ocupam o mesmo horário.',
  },
  {
    icon: Clock,
    title: 'Agendamento em poucos passos',
    description: 'Seu cliente escolhe o serviço, o profissional e o horário direto pela página da sua barbearia.',
  },
  {
    icon: ShieldCheck,
    title: 'Cada barbearia isolada',
    description: 'Seus dados, sua agenda e seus clientes nunca se misturam com os de outra barbearia na plataforma.',
  },
  {
    icon: Sparkles,
    title: 'Simples de operar',
    description: 'Configure horários, serviços e profissionais em minutos. Sem complexidade desnecessária.',
  },
];

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">Agendly</span>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Cadastrar barbearia</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-20 text-center">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Feito para barbearias
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Agendamento online simples, rápido e confiável para sua barbearia
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Sua barbearia com página pública própria, agenda organizada por profissional e confirmação automática por
          WhatsApp — sem planilhas, sem conflitos de horário.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/register">Cadastrar minha barbearia</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Já tenho conta</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <Card key={feature.title}>
            <CardContent className="flex flex-col gap-3 pt-6">
              <feature.icon className="size-6 text-primary" />
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <footer className="mt-auto border-t border-border py-6 text-center text-sm text-muted-foreground">
        Agendly — plataforma de agendamento para barbearias.
      </footer>
    </main>
  );
}
