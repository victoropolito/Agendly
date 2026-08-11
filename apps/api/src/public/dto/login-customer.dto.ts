import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginCustomerDto {
  @IsString()
  @Matches(/^[0-9+()\-\s]{10,24}$/)
  phone!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;
}
