import { WhatsAppProvider } from '@prisma/client';
import { IsEnum, IsIn, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

const CONNECTABLE_PROVIDERS = [WhatsAppProvider.META_CLOUD_API, WhatsAppProvider.TWILIO] as const;

export class ConnectWhatsAppDto {
  @IsEnum(WhatsAppProvider)
  @IsIn(CONNECTABLE_PROVIDERS)
  provider!: (typeof CONNECTABLE_PROVIDERS)[number];

  // Meta Cloud API
  @ValidateIf((dto: ConnectWhatsAppDto) => dto.provider === WhatsAppProvider.META_CLOUD_API)
  @IsString()
  @IsNotEmpty()
  phoneNumberId?: string;

  @ValidateIf((dto: ConnectWhatsAppDto) => dto.provider === WhatsAppProvider.META_CLOUD_API)
  @IsString()
  @IsNotEmpty()
  businessAccountId?: string;

  @ValidateIf((dto: ConnectWhatsAppDto) => dto.provider === WhatsAppProvider.META_CLOUD_API)
  @IsString()
  @IsNotEmpty()
  accessToken?: string;

  // Twilio
  @ValidateIf((dto: ConnectWhatsAppDto) => dto.provider === WhatsAppProvider.TWILIO)
  @IsString()
  @IsNotEmpty()
  accountSid?: string;

  @ValidateIf((dto: ConnectWhatsAppDto) => dto.provider === WhatsAppProvider.TWILIO)
  @IsString()
  @IsNotEmpty()
  authToken?: string;

  @ValidateIf((dto: ConnectWhatsAppDto) => dto.provider === WhatsAppProvider.TWILIO)
  @IsString()
  @IsNotEmpty()
  fromNumber?: string;
}
