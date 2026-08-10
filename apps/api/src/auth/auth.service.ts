import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TenantRole, TenantStatus, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import type { AccessTokenPayload, AuthTokens } from './auth.types';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerTenant(dto: RegisterTenantDto): Promise<AuthTokens> {
    const phoneNormalized = this.normalizePhone(dto.phone);
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: dto.adminName,
            phoneNormalized,
            email: dto.email,
            passwordHash,
          },
        });
        const tenant = await tx.tenant.create({
          data: { name: dto.tenantName, slug: dto.tenantSlug },
        });
        await tx.tenantMember.create({
          data: { tenantId: tenant.id, userId: user.id, role: TenantRole.ADMIN },
        });
        return { userId: user.id, tenantId: tenant.id, roles: [TenantRole.ADMIN] };
      });

      return this.issueSession(result);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Telefone, e-mail ou endereço público já está em uso.');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const phoneNormalized = this.normalizePhone(dto.phone);
    const user = await this.prisma.user.findUnique({
      where: { phoneNormalized },
      include: {
        tenantMembers: {
          where: { tenant: { slug: dto.tenantSlug, status: TenantStatus.ACTIVE } },
          select: { tenantId: true, role: true },
        },
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (user.tenantMembers.length === 0) {
      throw new UnauthorizedException('Usuário sem acesso a esta barbearia.');
    }

    return this.issueSession({
      userId: user.id,
      tenantId: user.tenantMembers[0].tenantId,
      roles: user.tenantMembers.map((member) => member.role),
    });
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
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

    return this.issueSession({ userId: payload.sub, tenantId: payload.tenantId, roles: payload.roles });
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken);
    await this.prisma.authSession.updateMany({
      where: { id: payload.sid, userId: payload.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getMe(userId: string, tenantId: string): Promise<{ id: string; name: string; phone: string; roles: TenantRole[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phoneNormalized: true,
        tenantMembers: { where: { tenantId }, select: { role: true } },
      },
    });

    if (!user || user.tenantMembers.length === 0) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      name: user.name,
      phone: user.phoneNormalized,
      roles: user.tenantMembers.map((membership) => membership.role),
    };
  }

  private async issueSession(input: {
    userId: string;
    tenantId: string;
    roles: TenantRole[];
  }): Promise<AuthTokens> {
    const sessionId = randomUUID();
    const payload: AccessTokenPayload = {
      sub: input.userId,
      sid: sessionId,
      tenantId: input.tenantId,
      roles: input.roles,
    };
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: REFRESH_TOKEN_TTL,
    });
    const refreshTokenHash = await argon2.hash(refreshToken, { type: argon2.argon2id });

    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: input.userId,
        tenantId: input.tenantId,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: ACCESS_TOKEN_TTL,
    });
    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(token: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }
  }

  private normalizePhone(value: string): string {
    const normalized = value.replace(/\D/g, '');
    if (normalized.length < 10 || normalized.length > 15) {
      throw new UnauthorizedException('Telefone inválido.');
    }
    return normalized;
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
