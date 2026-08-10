import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import type { AccessTokenPayload } from './auth.types';

export type AuthenticatedRequest = Request & { user?: AccessTokenPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

    if (!token) {
      throw new UnauthorizedException('Token de acesso ausente.');
    }

    try {
      request.user = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      return true;
    } catch {
      throw new UnauthorizedException('Token de acesso inválido ou expirado.');
    }
  }
}
