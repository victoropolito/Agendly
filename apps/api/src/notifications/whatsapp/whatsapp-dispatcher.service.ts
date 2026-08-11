import { Injectable } from '@nestjs/common';
import { WhatsAppProvider as WhatsAppProviderKind } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { DevelopmentWhatsAppProvider } from './development-whatsapp.provider';
import { MetaCloudApiProvider } from './meta-cloud-api.provider';
import type { WhatsAppMessage, WhatsAppSendResult } from './whatsapp-provider.interface';

@Injectable()
export class WhatsAppDispatcherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly developmentProvider: DevelopmentWhatsAppProvider,
    private readonly metaCloudApiProvider: MetaCloudApiProvider,
  ) {}

  async send(tenantId: string, message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    const connection = await this.prisma.whatsAppConnection.findFirst({
      where: { tenantId, provider: WhatsAppProviderKind.META_CLOUD_API },
    });

    const provider = connection ? this.metaCloudApiProvider : this.developmentProvider;
    return provider.send(message);
  }
}
