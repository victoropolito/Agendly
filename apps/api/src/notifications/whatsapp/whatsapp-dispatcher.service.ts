import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionStatus, WhatsAppProvider as WhatsAppProviderKind } from '@prisma/client';

import { toWhatsAppE164BR } from '../../common/phone.util';
import { PrismaService } from '../../prisma/prisma.service';
import { DevelopmentWhatsAppProvider } from './development-whatsapp.provider';
import { EvolutionApiProvider } from './evolution-api.provider';
import { MetaCloudApiProvider } from './meta-cloud-api.provider';
import { TwilioWhatsAppProvider } from './twilio-whatsapp.provider';
import { decryptToken } from './token-cipher.util';
import type { WhatsAppMessage, WhatsAppSendResult } from './whatsapp-provider.interface';

@Injectable()
export class WhatsAppDispatcherService {
  private readonly logger = new Logger(WhatsAppDispatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly developmentProvider: DevelopmentWhatsAppProvider,
    private readonly metaCloudApiProvider: MetaCloudApiProvider,
    private readonly twilioProvider: TwilioWhatsAppProvider,
    private readonly evolutionProvider: EvolutionApiProvider,
  ) {}

  async send(tenantId: string, message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    const normalized = { ...message, to: toWhatsAppE164BR(message.to) };

    const connection = await this.prisma.whatsAppConnection.findFirst({
      where: { tenantId, status: ConnectionStatus.CONNECTED },
    });

    if (!connection?.phoneNumberId) {
      return this.developmentProvider.send(normalized);
    }

    if (connection.provider === WhatsAppProviderKind.EVOLUTION_API) {
      return this.evolutionProvider.send(normalized, { instanceName: connection.phoneNumberId });
    }

    if (!connection.businessAccountId || !connection.credentialsReference) {
      return this.developmentProvider.send(normalized);
    }

    const secret = this.config.get<string>('WHATSAPP_TOKEN_ENCRYPTION_KEY');
    if (!secret) {
      this.logger.error('WHATSAPP_TOKEN_ENCRYPTION_KEY não configurada; não é possível decifrar as credenciais do WhatsApp.');
      return { success: false, error: 'Configuração de criptografia do WhatsApp ausente no servidor.' };
    }

    const secretValue = decryptToken(connection.credentialsReference, secret);

    if (connection.provider === WhatsAppProviderKind.TWILIO) {
      return this.twilioProvider.send(normalized, {
        accountSid: connection.businessAccountId,
        authToken: secretValue,
        fromNumber: connection.phoneNumberId,
      });
    }

    return this.metaCloudApiProvider.send(normalized, {
      phoneNumberId: connection.phoneNumberId,
      accessToken: secretValue,
    });
  }
}
