import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TenantStatus, UserStatus, type User } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';

import { normalizePhone } from '../common/phone.util';
import { PrismaService } from '../prisma/prisma.service';
import type { CustomerAccessTokenPayload, CustomerAuthTokens } from './customer-auth.types';
import { LoginCustomerDto } from './dto/login-customer.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';

const ACCESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = '90d';
const REFRESH_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** Creates the customer's one global identity — not tied to any single barbershop. */
  async register(dto: RegisterCustomerDto): Promise<CustomerAuthTokens> {
    if (!dto.phone && !dto.email) {
      throw new BadRequestException('Informe e-mail ou WhatsApp para criar a conta.');
    }

    const phoneNormalized = dto.phone ? normalizePhone(dto.phone) : undefined;

    const existing = phoneNormalized
      ? await this.prisma.user.findUnique({ where: { phoneNormalized } })
      : dto.email
        ? await this.prisma.user.findUnique({ where: { email: dto.email } })
        : null;
    if (existing) {
      throw new ConflictException('Já existe uma conta com esse e-mail ou WhatsApp. Faça login.');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.prisma.user.create({
      data: { name: dto.name, phoneNormalized, email: dto.email, passwordHash },
    });

    return this.issueSession(user.id);
  }

  async login(dto: LoginCustomerDto): Promise<CustomerAuthTokens> {
    const user = await this.findUserByIdentifier(dto.identifier.trim());

    if (!user || user.status !== UserStatus.ACTIVE || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.issueSession(user.id);
  }

  async getProfile(userId: string): Promise<{ id: string; name: string; phone: string | null; email: string | null }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return { id: user.id, name: user.name, phone: user.phoneNormalized, email: user.email };
  }

  /** Barbershops this customer has an account at — the "suas barbearias" list. */
  async listMyBarbershops(userId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { userId, tenant: { status: TenantStatus.ACTIVE } },
      select: { updatedAt: true, tenant: { select: { id: true, slug: true, name: true, logoUrl: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return customers.map((c) => c.tenant);
  }

  async refresh(refreshToken: string): Promise<CustomerAuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({ where: { id: payload.sid } });

    if (
      !session ||
      session.userId !== payload.sub ||
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

    // A refresh token issued before this session became global may still carry a `tenantId`
    // claim (harmless — JWT verification ignores unused fields) — this mints a fresh, tenant-less
    // session either way, so every customer is fully migrated within one access-token lifetime.
    return this.issueSession(payload.sub);
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken);
    await this.prisma.authSession.updateMany({
      where: { id: payload.sid, userId: payload.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async findUserByIdentifier(identifier: string): Promise<User | null> {
    if (identifier.includes('@')) {
      return this.prisma.user.findUnique({ where: { email: identifier.toLowerCase() } });
    }
    try {
      const phoneNormalized = normalizePhone(identifier);
      return await this.prisma.user.findUnique({ where: { phoneNormalized } });
    } catch {
      return null;
    }
  }

  private async issueSession(userId: string): Promise<CustomerAuthTokens> {
    const sessionId = randomUUID();
    const payload: CustomerAccessTokenPayload = { sub: userId, sid: sessionId };

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_CUSTOMER_REFRESH_SECRET'),
      expiresIn: REFRESH_TOKEN_TTL,
    });
    const refreshTokenHash = await argon2.hash(refreshToken, { type: argon2.argon2id });

    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId,
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
