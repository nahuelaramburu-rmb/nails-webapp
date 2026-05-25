import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateServiceDto {
  name: string;
  durationMinutes: number;
  price: number;
  depositAmount: number;
  description?: string;
}

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.service.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const svc = await this.prisma.service.findUnique({ where: { id } });
    if (!svc) throw new NotFoundException('Servicio no encontrado');
    return svc;
  }

  create(dto: CreateServiceDto) {
    return this.prisma.service.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateServiceDto>) {
    await this.findOne(id);
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.service.delete({ where: { id } });
  }
}
