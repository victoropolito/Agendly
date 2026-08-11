import { IsIn, IsOptional, IsUUID, Matches } from 'class-validator';

export class ListAppointmentsDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date deve estar no formato YYYY-MM-DD.' })
  date?: string;

  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @IsOptional()
  @IsIn(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'])
  status?: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
}
