export type TenantRole = 'ADMIN' | 'PROFESSIONAL';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED';
export type AppointmentStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type AppointmentSource = 'PUBLIC' | 'ADMIN' | 'PROFESSIONAL';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Me {
  id: string;
  name: string;
  phone: string;
  roles: TenantRole[];
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  phone: string | null;
  email: string | null;
  description: string | null;
  address: string | null;
  logoUrl: string | null;
  status: TenantStatus;
}

export interface BusinessHour {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Professional {
  id: string;
  tenantId: string;
  userId: string | null;
  name: string;
  phone: string | null;
  photoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  services: { serviceId: string }[];
}

export interface ProfessionalHour {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  tenantId: string;
  userId: string | null;
  name: string;
  phoneNormalized: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentSummary {
  id: string;
  name: string;
}

export interface Appointment {
  id: string;
  tenantId: string;
  customerId: string;
  professionalId: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  priceCentsSnapshot: number;
  durationMinutesSnapshot: number;
  status: AppointmentStatus;
  source: AppointmentSource;
  notes: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; phoneNormalized: string | null };
  professional?: AppointmentSummary;
  service?: AppointmentSummary;
}

export interface ScheduleBlock {
  id: string;
  tenantId: string;
  professionalId: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  professional?: AppointmentSummary;
}

export interface ProfessionalAvailability {
  professionalId: string;
  name: string;
  slots: string[];
}

export interface AvailabilityResult {
  date: string;
  serviceId: string;
  durationMinutes: number;
  professionals: ProfessionalAvailability[];
  alternatives?: ProfessionalAvailability[];
}

export interface DashboardSummary {
  todayAppointmentsCount: number;
  upcomingAppointments: Appointment[];
  customersCount: number;
  professionalsCount: number;
  servicesCount: number;
  estimatedRevenue: {
    periodStart: string;
    periodEnd: string;
    totalCents: number;
  };
}

export interface PublicTenant {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  phone: string | null;
  description: string | null;
  address: string | null;
  logoUrl: string | null;
}

/** One card in the public barbershop directory, or in a customer's "suas barbearias" list. */
export interface BarbershopListing {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  logoUrl: string | null;
}

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
}

export interface PublicProfessional {
  id: string;
  name: string;
  photoUrl: string | null;
  services: { serviceId: string }[];
}

export interface UploadSignature {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

export type WhatsAppConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
export type WhatsAppConnectionProvider = 'EVOLUTION_API';

export interface WhatsAppConnection {
  provider: WhatsAppConnectionProvider | null;
  status: WhatsAppConnectionStatus;
  phoneNumberId: string | null;
  businessAccountId: string | null;
  updatedAt: string | null;
}

export interface EvolutionConnectionStart extends WhatsAppConnection {
  qrCodeBase64?: string;
  pairingCode?: string | null;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] as const;
export const WEEKDAY_LABELS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
