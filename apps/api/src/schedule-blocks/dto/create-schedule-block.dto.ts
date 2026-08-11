import { IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateScheduleBlockDto {
  @IsUUID()
  professionalId!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date deve estar no formato YYYY-MM-DD.' })
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime deve estar no formato HH:mm.' })
  startTime!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime deve estar no formato HH:mm.' })
  endTime!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
