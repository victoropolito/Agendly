import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionStatus, WhatsAppProvider as WhatsAppProviderKind } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type { TenantContext } from '../../tenants/tenant-context';
import { ConnectWhatsAppDto } from './dto/connect-whatsapp.dto';
import { EvolutionApiProvider } from './evolution-api.provider';
import { MetaCloudApiProvider } from './meta-cloud-api.provider';
import { TwilioWhatsAppProvider } from './twilio-whatsapp.provider';
import { encryptToken } from './token-cipher.util';

@Injectable()
export class WhatsAppConnectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly metaCloudApiProvider: MetaCloudApiProvider,
    private readonly twilioProvider: TwilioWhatsAppProvider,
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
    if (connection.provider === WhatsAppProviderKind.EVOLUTION_API && connection.status !== ConnectionStatus.CONNECTED) {
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

  async connect(context: TenantContext, dto: ConnectWhatsAppDto) {
    if (dto.provider === WhatsAppProviderKind.META_CLOUD_API) {
      return this.connectMeta(context, dto);
    }
    return this.connectTwilio(context, dto);
  }

  /** Starts (or resumes) an Evolution API connection: creates the instance if needed and returns a QR code to scan. */
  async startEvolutionConnection(context: TenantContext) {
    const instanceName = this.evolutionInstanceName(context.tenantId);
    const result = await this.evolutionProvider.ensureInstanceWithQrCode(instanceName);
    if (!result.ok) {
      throw new BadRequestException(result.error ?? 'Não foi possível iniciar a conexão com a Evolution API.');
    }

    const alreadyConnected = !result.qrCodeBase64;
    const connection = await this.replaceConnection(context.tenantId, {
      provider: WhatsAppProviderKind.EVOLUTION_API,
      status: alreadyConnected ? ConnectionStatus.CONNECTED : ConnectionStatus.CONNECTING,
      phoneNumberId: instanceName,
      businessAccountId: null,
      credentialsReference: null,
    });

    return { ...connection, qrCodeBase64: result.qrCodeBase64, pairingCode: result.pairingCode };
  }

  async disconnect(context: TenantContext): Promise<void> {
    const connection = await this.prisma.whatsAppConnection.findFirst({ where: { tenantId: context.tenantId } });
    if (connection?.provider === WhatsAppProviderKind.EVOLUTION_API && connection.phoneNumberId) {
      await this.evolutionProvider.disconnect(connection.phoneNumberId);
    }
    await this.prisma.whatsAppConnection.deleteMany({ where: { tenantId: context.tenantId } });
  }

  private async connectMeta(context: TenantContext, dto: ConnectWhatsAppDto) {
    const phoneNumberId = dto.phoneNumberId!;
    const businessAccountId = dto.businessAccountId!;
    const accessToken = dto.accessToken!;

    const verification = await this.metaCloudApiProvider.verify(phoneNumberId, accessToken);
    if (!verification.ok) {
      throw new BadRequestException(
        verification.error ?? 'Não foi possível validar as credenciais junto à WhatsApp Cloud API.',
      );
    }

    const connection = await this.replaceConnection(context.tenantId, {
      provider: WhatsAppProviderKind.META_CLOUD_API,
      status: ConnectionStatus.CONNECTED,
      phoneNumberId,
      businessAccountId,
      credentialsReference: encryptToken(accessToken, this.tokenSecret()),
    });

    return { ...connection, displayPhoneNumber: verification.displayPhoneNumber, verifiedName: verification.verifiedName };
  }

  private async connectTwilio(context: TenantContext, dto: ConnectWhatsAppDto) {
    const accountSid = dto.accountSid!;
    const authToken = dto.authToken!;
    const fromNumber = dto.fromNumber!;

    const verification = await this.twilioProvider.verify(accountSid, authToken);
    if (!verification.ok) {
      throw new BadRequestException(verification.error ?? 'Não foi possível validar as credenciais junto ao Twilio.');
    }

    const connection = await this.replaceConnection(context.tenantId, {
      provider: WhatsAppProviderKind.TWILIO,
      status: ConnectionStatus.CONNECTED,
      phoneNumberId: fromNumber,
      businessAccountId: accountSid,
      credentialsReference: encryptToken(authToken, this.tokenSecret()),
    });

    return { ...connection, accountName: verification.accountName };
  }

  /** A tenant has at most one active WhatsApp connection; switching providers replaces it. */
  private async replaceConnection(
    tenantId: string,
    data: {
      provider: WhatsAppProviderKind;
      status: ConnectionStatus;
      phoneNumberId: string;
      businessAccountId: string | null;
      credentialsReference: string | null;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.whatsAppConnection.deleteMany({ where: { tenantId, provider: { not: data.provider } } });
      return tx.whatsAppConnection.upsert({
        where: { tenantId_provider: { tenantId, provider: data.provider } },
        create: { tenantId, ...data },
        update: data,
        select: { provider: true, status: true, phoneNumberId: true, businessAccountId: true, updatedAt: true },
      });
    });
  }

  private evolutionInstanceName(tenantId: string): string {
    return `agendly-${tenantId}`;
  }

  private tokenSecret(): string {
    return this.config.getOrThrow<string>('WHATSAPP_TOKEN_ENCRYPTION_KEY');
  }
}
