import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsIn(['COMPLETED', 'NO_SHOW'])
  status?: 'COMPLETED' | 'NO_SHOW';
}
