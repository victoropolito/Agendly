import { Type } from 'class-transformer';
import { ArrayMaxSize, IsBoolean, IsInt, IsOptional, Matches, Max, Min, ValidateNested } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class BusinessHourEntryDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @Matches(TIME_PATTERN, { message: 'startTime deve estar no formato HH:mm.' })
  startTime!: string;

  @Matches(TIME_PATTERN, { message: 'endTime deve estar no formato HH:mm.' })
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpsertBusinessHoursDto {
  @ValidateNested({ each: true })
  @Type(() => BusinessHourEntryDto)
  @ArrayMaxSize(7)
  hours!: BusinessHourEntryDto[];
}
