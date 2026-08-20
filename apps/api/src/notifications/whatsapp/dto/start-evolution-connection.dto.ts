import { IsOptional, IsString, Matches } from 'class-validator';

export class StartEvolutionConnectionDto {
  /** When given, requests a pairing code for this number instead of a plain QR code. */
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+()\-\s]{10,24}$/)
  phone?: string;
}
