import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class SetAvailabilityDto {
  employeeId: string;
  date: string; // "2024-12-15"
  startTime: string; // "09:00"
  endTime: string; // "18:00"
}

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getByMonth(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return this.prisma.availability.findMany({
      where: { date: { gte: start, lte: end } },
      include: { employee: true },
      orderBy: { date: 'asc' },
    });
  }

  async getSlots(date: string, employeeId: string, serviceDurationMinutes: number) {
    const availability = await this.prisma.availability.findUnique({
      where: { employeeId_date: { employeeId, date: new Date(date) } },
    });
    if (!availability) return [];

    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        employeeId,
        date: new Date(date),
        status: 'confirmed',
      },
    });

    const slots: string[] = [];
    const [startH, startM] = availability.startTime.split(':').map(Number);
    const [endH, endM] = availability.endTime.split(':').map(Number);

    let current = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (current + serviceDurationMinutes <= endMinutes) {
      const slotStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
      const slotEnd = `${String(Math.floor((current + serviceDurationMinutes) / 60)).padStart(2, '0')}:${String((current + serviceDurationMinutes) % 60).padStart(2, '0')}`;

      const isBooked = bookedAppointments.some((appt) => {
        const [aStartH, aStartM] = appt.startTime.split(':').map(Number);
        const [aEndH, aEndM] = appt.endTime.split(':').map(Number);
        const aStart = aStartH * 60 + aStartM;
        const aEnd = aEndH * 60 + aEndM;
        return current < aEnd && current + serviceDurationMinutes > aStart;
      });

      if (!isBooked) slots.push(slotStart);
      current += serviceDurationMinutes;
    }

    return slots;
  }

  async upsert(dto: SetAvailabilityDto) {
    const dateObj = new Date(dto.date + 'T12:00:00Z');
    return this.prisma.availability.upsert({
      where: { employeeId_date: { employeeId: dto.employeeId, date: dateObj } },
      create: {
        employeeId: dto.employeeId,
        date: dateObj,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
      update: { startTime: dto.startTime, endTime: dto.endTime },
      include: { employee: true },
    });
  }

  async remove(id: string) {
    const avail = await this.prisma.availability.findUnique({ where: { id } });
    if (!avail) throw new NotFoundException('Disponibilidad no encontrada');
    return this.prisma.availability.delete({ where: { id } });
  }
}
