import { IsOptional, IsUUID, Matches } from 'class-validator';

export class GetAvailabilityDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date deve estar no formato YYYY-MM-DD.' })
  date!: string;

  @IsUUID()
  serviceId!: string;

  @IsOptional()
  @IsUUID()
  professionalId?: string;
}
