import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateAppointmentDto {
  employeeId: string;
  serviceId: string;
  date: string;
  startTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes?: string;
}

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { date?: string; month?: string; year?: string }) {
    const where: any = { status: { not: 'cancelled' } };
    if (query.date) {
      where.date = new Date(query.date);
    } else if (query.month && query.year) {
      where.date = {
        gte: new Date(Number(query.year), Number(query.month) - 1, 1),
        lte: new Date(Number(query.year), Number(query.month), 0),
      };
    }
    return this.prisma.appointment.findMany({
      where,
      include: { employee: true, service: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async create(dto: CreateAppointmentDto) {
    const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
    if (!service) throw new NotFoundException('Servicio no encontrado');

    const [h, m] = dto.startTime.split(':').map(Number);
    const endMinutes = h * 60 + m + service.durationMinutes;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    const dateObj = new Date(dto.date + 'T12:00:00Z');

    const conflict = await this.prisma.appointment.findFirst({
      where: {
        employeeId: dto.employeeId,
        date: dateObj,
        status: 'confirmed',
        OR: [
          { startTime: { gte: dto.startTime, lt: endTime } },
          { endTime: { gt: dto.startTime, lte: endTime } },
          { AND: [{ startTime: { lte: dto.startTime } }, { endTime: { gte: endTime } }] },
        ],
      },
    });
    if (conflict) throw new BadRequestException('El horario ya está reservado');

    return this.prisma.appointment.create({
      data: {
        employeeId: dto.employeeId,
        serviceId: dto.serviceId,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        clientPhone: dto.clientPhone,
        date: dateObj,
        startTime: dto.startTime,
        endTime,
        notes: dto.notes,
        status: 'pending',
        depositAmount: service.depositAmount,
      },
      include: { employee: true, service: true },
    });
  }

  async confirm(id: string, paymentId: string, paymentStatus: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: { employee: true, service: true },
    });
    if (!appt) throw new NotFoundException('Turno no encontrado');
    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'confirmed',
        mercadoPagoPaymentId: paymentId,
        mercadoPagoStatus: paymentStatus,
      },
      include: { employee: true, service: true },
    });
  }

  async cancel(id: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new NotFoundException('Turno no encontrado');
    return this.prisma.appointment.update({ where: { id }, data: { status: 'cancelled' } });
  }
}
