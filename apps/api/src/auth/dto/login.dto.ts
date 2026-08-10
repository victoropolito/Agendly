import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^[0-9+()\-\s]{10,24}$/)
  phone!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  tenantSlug!: string;
}
