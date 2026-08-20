'use client';

import { Pencil, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isAdminRole } from '@/features/auth/roles';
import { useStaffAuth } from '@/features/auth/staff-auth-context';
import { ServiceFormDialog } from '@/features/services/service-form-dialog';
import { useServices } from '@/features/services/use-services';
import { formatCents, formatDurationMinutes } from '@/lib/format';

export default function ServicesPage() {
  const { data: services, isLoading } = useServices();
  const { user } = useStaffAuth();
  const canManage = isAdminRole(user?.roles);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Serviços</h1>
          <p className="text-sm text-muted-foreground">Serviços oferecidos pela barbearia.</p>
        </div>
        {canManage && (
          <ServiceFormDialog
            trigger={
              <Button>
                <Plus /> Novo serviço
              </Button>
            }
          />
        )}
      </div>

      {isLoading && <Skeleton className="h-48 w-full" />}

      {services && services.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum serviço cadastrado ainda.
        </div>
      )}

      {services && services.length > 0 && (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{formatCents(service.priceCents)}</TableCell>
                  <TableCell>{formatDurationMinutes(service.durationMinutes)}</TableCell>
                  <TableCell>
                    <Badge variant={service.isActive ? 'success' : 'secondary'}>
                      {service.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <ServiceFormDialog
                        service={service}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
