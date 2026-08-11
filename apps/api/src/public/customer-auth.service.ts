import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';

import { normalizePhone } from '../common/phone.util';
import { PrismaService } from '../prisma/prisma.service';
import type { CustomerAccessTokenPayload, CustomerAuthTokens } from './customer-auth.types';
import { LoginCustomerDto } from './dto/login-customer.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { TenantLookupService } from './tenant-lookup.service';

const ACCESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = '90d';
const REFRESH_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tenantLookup: TenantLookupService,
  ) {}

  async register(slug: string, dto: RegisterCustomerDto): Promise<CustomerAuthTokens> {
    const tenant = await this.tenantLookup.resolveActiveBySlug(slug);
    const phoneNormalized = normalizePhone(dto.phone);

    let user = await this.prisma.user.findUnique({ where: { phoneNormalized } });
    if (user) {
      if (!(await argon2.verify(user.passwordHash, dto.password))) {
        throw new ConflictException('Este telefone já possui uma conta. Faça login.');
      }
    } else {
      const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
      user = await this.prisma.user.create({
        data: { name: dto.name, phoneNormalized, email: dto.email, passwordHash },
      });
    }

    await this.prisma.customer.upsert({
      where: { tenantId_phoneNormalized: { tenantId: tenant.id, phoneNormalized } },
      create: { tenantId: tenant.id, userId: user.id, name: dto.name, phoneNormalized, email: dto.email },
      update: { userId: user.id, name: dto.name },
    });

    return this.issueSession(user.id, tenant.id);
  }

  async login(slug: string, dto: LoginCustomerDto): Promise<CustomerAuthTokens> {
    const tenant = await this.tenantLookup.resolveActiveBySlug(slug);
    const phoneNormalized = normalizePhone(dto.phone);

    const user = await this.prisma.user.findUnique({ where: { phoneNormalized } });
    if (!user || user.status !== UserStatus.ACTIVE || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const customer = await this.prisma.customer.findFirst({ where: { tenantId: tenant.id, userId: user.id } });
    if (!customer) {
      throw new UnauthorizedException('Você ainda não possui cadastro nesta barbearia.');
    }

    return this.issueSession(user.id, tenant.id);
  }

  async refresh(refreshToken: string): Promise<CustomerAuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({ where: { id: payload.sid } });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.tenantId !== payload.tenantId ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !(await argon2.verify(session.refreshTokenHash, refreshToken))
    ) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }

    const revoked = await this.prisma.authSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (revoked.count !== 1) {
      throw new UnauthorizedException('Sessão já foi renovada.');
    }

    return this.issueSession(payload.sub, payload.tenantId);
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken);
    await this.prisma.authSession.updateMany({
      where: { id: payload.sid, userId: payload.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueSession(userId: string, tenantId: string): Promise<CustomerAuthTokens> {
    const sessionId = randomUUID();
    const payload: CustomerAccessTokenPayload = { sub: userId, sid: sessionId, tenantId };

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_CUSTOMER_REFRESH_SECRET'),
      expiresIn: REFRESH_TOKEN_TTL,
    });
    const refreshTokenHash = await argon2.hash(refreshToken, { type: argon2.argon2id });

    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId,
        tenantId,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_CUSTOMER_ACCESS_SECRET'),
      expiresIn: ACCESS_TOKEN_TTL,
    });
    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(token: string): Promise<CustomerAccessTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<CustomerAccessTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_CUSTOMER_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }
  }
}
