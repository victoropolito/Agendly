import { BadRequestException, Injectable } from '@nestjs/common';
import { ConnectionStatus, WhatsAppProvider as WhatsAppProviderKind } from '@prisma/client';

import { normalizePhone, toWhatsAppE164BR } from '../../common/phone.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { TenantContext } from '../../tenants/tenant-context';
import { EvolutionApiProvider } from './evolution-api.provider';

@Injectable()
export class WhatsAppConnectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evolutionProvider: EvolutionApiProvider,
  ) {}

  async getStatus(context: TenantContext) {
    const connection = await this.prisma.whatsAppConnection.findFirst({
      where: { tenantId: context.tenantId },
      orderBy: { updatedAt: 'desc' },
      select: {
        provider: true,
        status: true,
        phoneNumberId: true,
        businessAccountId: true,
        updatedAt: true,
      },
    });

    if (!connection) {
      return { provider: null, status: ConnectionStatus.DISCONNECTED, phoneNumberId: null, businessAccountId: null, updatedAt: null };
    }

    // Evolution connections start as CONNECTING while the admin scans the QR code; poll live state until it flips.
    if (connection.status !== ConnectionStatus.CONNECTED) {
      const state = await this.evolutionProvider.getConnectionState(connection.phoneNumberId!);
      if (state === 'open') {
        return this.prisma.whatsAppConnection.update({
          where: { tenantId_provider: { tenantId: context.tenantId, provider: WhatsAppProviderKind.EVOLUTION_API } },
          data: { status: ConnectionStatus.CONNECTED },
          select: { provider: true, status: true, phoneNumberId: true, businessAccountId: true, updatedAt: true },
        });
      }
    }

    return connection;
  }

  /**
   * Starts (or resumes) an Evolution API connection: creates the instance if needed and returns
   * a QR code to scan — or, when `phone` is given, a pairing code to type into WhatsApp instead.
   */
  async startEvolutionConnection(context: TenantContext, phone?: string) {
    const instanceName = this.evolutionInstanceName(context.tenantId);
    const phoneNumber = phone ? toWhatsAppE164BR(normalizePhone(phone)).replace(/^\+/, '') : undefined;
    const result = await this.evolutionProvider.ensureInstanceWithQrCode(instanceName, phoneNumber);
    if (!result.ok) {
      throw new BadRequestException(result.error ?? 'Não foi possível iniciar a conexão com a Evolution API.');
    }

    const alreadyConnected = !result.qrCodeBase64;
    const connection = await this.prisma.$transaction(async (tx) => {
      await tx.whatsAppConnection.deleteMany({
        where: { tenantId: context.tenantId, provider: { not: WhatsAppProviderKind.EVOLUTION_API } },
      });
      return tx.whatsAppConnection.upsert({
        where: { tenantId_provider: { tenantId: context.tenantId, provider: WhatsAppProviderKind.EVOLUTION_API } },
        create: {
          tenantId: context.tenantId,
          provider: WhatsAppProviderKind.EVOLUTION_API,
          status: alreadyConnected ? ConnectionStatus.CONNECTED : ConnectionStatus.CONNECTING,
          phoneNumberId: instanceName,
        },
        update: { status: alreadyConnected ? ConnectionStatus.CONNECTED : ConnectionStatus.CONNECTING, phoneNumberId: instanceName },
        select: { provider: true, status: true, phoneNumberId: true, businessAccountId: true, updatedAt: true },
      });
    });

    return { ...connection, qrCodeBase64: result.qrCodeBase64, pairingCode: result.pairingCode };
  }

  async disconnect(context: TenantContext): Promise<void> {
    const connection = await this.prisma.whatsAppConnection.findFirst({ where: { tenantId: context.tenantId } });
    if (connection?.phoneNumberId) {
      await this.evolutionProvider.disconnect(connection.phoneNumberId);
    }
    await this.prisma.whatsAppConnection.deleteMany({ where: { tenantId: context.tenantId } });
  }

  private evolutionInstanceName(tenantId: string): string {
    return `agendly-${tenantId}`;
  }
}
