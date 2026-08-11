import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { WhatsAppMessage, WhatsAppProvider, WhatsAppSendResult } from './whatsapp-provider.interface';

@Injectable()
export class DevelopmentWhatsAppProvider implements WhatsAppProvider {
  private readonly logger = new Logger(DevelopmentWhatsAppProvider.name);

  async send(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    this.logger.log(`[WhatsApp:DEV] to=${message.to} body="${message.body}"`);
    return { success: true, providerMessageId: randomUUID() };
  }
}
