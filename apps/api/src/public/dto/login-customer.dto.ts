import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginCustomerDto {
  /** The customer's e-mail or WhatsApp number — whichever they registered with. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  identifier!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;
}
