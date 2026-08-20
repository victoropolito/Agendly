'use client';

import { Clock, Pencil, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isAdminRole } from '@/features/auth/roles';
import { useStaffAuth } from '@/features/auth/staff-auth-context';
import { ProfessionalFormDialog } from '@/features/professionals/professional-form-dialog';
import { ProfessionalHoursDialog } from '@/features/professionals/professional-hours-dialog';
import { useProfessionals } from '@/features/professionals/use-professionals';
import { useServices } from '@/features/services/use-services';

export default function ProfessionalsPage() {
  const { data: professionals, isLoading } = useProfessionals();
  const { data: services } = useServices();
  const { user } = useStaffAuth();
  const canManage = isAdminRole(user?.roles);

  function serviceNames(serviceIds: string[]): string {
    if (!services) return '';
    return serviceIds
      .map((id) => services.find((service) => service.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profissionais</h1>
          <p className="text-sm text-muted-foreground">Equipe da barbearia e seus horários de atendimento.</p>
        </div>
        {canManage && (
          <ProfessionalFormDialog
            trigger={
              <Button>
                <Plus /> Novo profissional
              </Button>
            }
          />
        )}
      </div>

      {isLoading && <Skeleton className="h-48 w-full" />}

      {professionals && professionals.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum profissional cadastrado ainda.
        </div>
      )}

      {professionals && professionals.length > 0 && (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Serviços</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionals.map((professional) => (
                <TableRow key={professional.id}>
                  <TableCell className="font-medium">{professional.name}</TableCell>
                  <TableCell className="max-w-64 truncate text-sm text-muted-foreground">
                    {serviceNames(professional.services.map((link) => link.serviceId)) || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={professional.isActive ? 'success' : 'secondary'}>
                      {professional.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ProfessionalHoursDialog
                        professionalId={professional.id}
                        professionalName={professional.name}
                        trigger={
                          <Button variant="ghost" size="icon" title="Horários">
                            <Clock className="size-4" />
                          </Button>
                        }
                      />
                      {canManage && (
                        <ProfessionalFormDialog
                          professional={professional}
                          trigger={
                            <Button variant="ghost" size="icon" title="Editar">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
