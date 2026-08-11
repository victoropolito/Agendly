import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { normalizePhone } from '../common/phone.util';
import { PrismaService } from '../prisma/prisma.service';
import type { TenantContext } from '../tenants/tenant-context';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(context: TenantContext, search?: string) {
    return this.prisma.customer.findMany({
      where: {
        tenantId: context.tenantId,
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(context: TenantContext, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId: context.tenantId },
    });
    if (!customer) {
      throw new NotFoundException();
    }
    return customer;
  }

  async create(context: TenantContext, dto: CreateCustomerDto) {
    const phoneNormalized = normalizePhone(dto.phone);
    try {
      return await this.prisma.customer.create({
        data: {
          tenantId: context.tenantId,
          name: dto.name,
          phoneNormalized,
          email: dto.email,
        },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Já existe um cliente com este telefone.');
      }
      throw error;
    }
  }

  async update(context: TenantContext, id: string, dto: UpdateCustomerDto) {
    await this.findOne(context, id);
    try {
      return await this.prisma.customer.update({
        where: { id },
        data: {
          name: dto.name,
          email: dto.email,
          phoneNormalized: dto.phone ? normalizePhone(dto.phone) : undefined,
        },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Já existe um cliente com este telefone.');
      }
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
