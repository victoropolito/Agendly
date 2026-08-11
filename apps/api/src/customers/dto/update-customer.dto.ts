import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: string | undefined }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+()\-\s]{10,24}$/)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }: { value: string | undefined }) => value?.trim().toLowerCase())
  email?: string;
}
