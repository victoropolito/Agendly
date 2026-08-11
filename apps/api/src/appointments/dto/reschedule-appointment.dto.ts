import { IsOptional, IsUUID, Matches } from 'class-validator';

export class RescheduleAppointmentDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date deve estar no formato YYYY-MM-DD.' })
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime deve estar no formato HH:mm.' })
  startTime!: string;

  @IsOptional()
  @IsUUID()
  professionalId?: string;
}
