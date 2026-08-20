import { Injectable } from '@nestjs/common';
import { ConnectionStatus } from '@prisma/client';

import { toWhatsAppE164BR } from '../../common/phone.util';
import { PrismaService } from '../../prisma/prisma.service';
import { DevelopmentWhatsAppProvider } from './development-whatsapp.provider';
import { EvolutionApiProvider } from './evolution-api.provider';
import type { WhatsAppMessage, WhatsAppSendResult } from './whatsapp-provider.interface';

@Injectable()
export class WhatsAppDispatcherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly developmentProvider: DevelopmentWhatsAppProvider,
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

    return this.evolutionProvider.send(normalized, { instanceName: connection.phoneNumberId });
  }
}
