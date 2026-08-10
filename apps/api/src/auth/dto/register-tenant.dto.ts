import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value.trim())
  adminName!: string;

  @IsString()
  @Matches(/^[0-9+()\-\s]{10,24}$/)
  phone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }: { value: string | undefined }) => value?.trim().toLowerCase())
  email?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value.trim())
  tenantName!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  tenantSlug!: string;
}
