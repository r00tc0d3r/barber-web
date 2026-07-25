/**
 * Prisma Appointment Repository Implementation
 * 
 * Implements the AppointmentRepository interface using Prisma.
 * This is the only place that knows about Prisma.
 */

import { prisma } from '@/lib/prisma';
import { ok, err, type Result } from '@/domain/shared/result';
import { NotFoundError, ConflictError } from '@/domain/shared/error';
import { Appointment } from '@/domain/appointment/appointment';
import type {
  AppointmentRepository,
  FindAppointmentsQuery,
} from '@/domain/appointment/appointment.repository';
import type {
  AppointmentId,
  BarberId,
  AppointmentStatus,
  CancelToken,
} from '@/domain/appointment/value-objects';
import { generateCancelToken } from '@/domain/appointment/value-objects';

export class PrismaAppointmentRepository implements AppointmentRepository {
  async findById(id: AppointmentId): Promise<Result<Appointment | null, NotFoundError>> {
    const record = await prisma.appointment.findUnique({
      where: { id },
      include: { barber: true, service: true },
    });

    if (!record) {
      return ok(null);
    }

    const appointment = this.toDomain(record);
    return ok(appointment);
  }

  async findByCancelToken(token: string): Promise<Result<Appointment | null, NotFoundError>> {
    const record = await prisma.appointment.findUnique({
      where: { cancelToken: token },
      include: { barber: true, service: true },
    });

    if (!record) {
      return ok(null);
    }

    const appointment = this.toDomain(record);
    return ok(appointment);
  }

  async findMany(query: FindAppointmentsQuery): Promise<Appointment[]> {
    const where: Record<string, unknown> = {};

    if (query.barberId) {
      where.barberId = query.barberId;
    }

    if (query.status && query.status.length > 0) {
      where.status = { in: query.status };
    }

        if (query.dateFrom || query.dateTo) {
          where.date = {
            ...(query.dateFrom ? { gte: query.dateFrom } : {}),
            ...(query.dateTo ? { lte: query.dateTo } : {}),
          };
        }

    if (query.userId) {
      where.userId = query.userId;
    }

    const records = await prisma.appointment.findMany({
      where,
      include: { barber: true, service: true },
      orderBy: { date: 'asc' },
      take: query.limit,
      skip: query.offset,
    });

    return records.map((record) => this.toDomain(record));
  }

  async findByBarberAndDate(barberId: BarberId, date: string): Promise<Appointment[]> {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const records = await prisma.appointment.findMany({
      where: {
        barberId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      include: { barber: true, service: true },
      orderBy: { date: 'asc' },
    });

    return records.map((record) => this.toDomain(record));
  }

  async isSlotAvailable(
    barberId: BarberId,
    serviceId: string,
    date: string,
    time: string
  ): Promise<boolean> {
    const slots = await this.getAvailableSlots(barberId, serviceId, date);
    const slot = slots.find((s) => s.time === time);
    return slot?.available ?? false;
  }

  async create(
    data: {
      barberId: BarberId;
      serviceId: string;
      userId: string | null;
      contact: {
        clientName: string;
        clientPhone: string;
        clientEmail?: string;
      };
      dateTime: {
        start: Date;
        end: Date;
      };
    },
    _durationMinutes: number
  ): Promise<Result<Appointment, ConflictError>> {
    // Check for slot conflict
    const isAvailable = await this.isSlotAvailable(
      data.barberId,
      data.serviceId,
      data.dateTime.start.toISOString().split('T')[0],
      `${data.dateTime.start.getHours().toString().padStart(2, '0')}:${data.dateTime.start.getMinutes().toString().padStart(2, '0')}`
    );

    if (!isAvailable) {
      return err(new ConflictError('Slot is no longer available'));
    }

    const cancelToken = generateCancelToken();

    const record = await prisma.appointment.create({
      data: {
        barberId: data.barberId,
        serviceId: data.serviceId,
        userId: data.userId,
        clientName: data.contact.clientName,
        clientPhone: data.contact.clientPhone,
        clientEmail: data.contact.clientEmail,
        date: data.dateTime.start,
        endTime: data.dateTime.end,
        status: 'PENDING',
        cancelToken,
      },
      include: { barber: true, service: true },
    });

    const appointment = this.toDomain(record);
    return ok(appointment);
  }

  async updateStatus(
    id: AppointmentId,
    status: AppointmentStatus
  ): Promise<Result<Appointment, NotFoundError | ConflictError>> {
    const existing = await prisma.appointment.findUnique({ where: { id } });

    if (!existing) {
      return err(new NotFoundError('Appointment', id));
    }

    const record = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: { barber: true, service: true },
    });

    const appointment = this.toDomain(record);
    return ok(appointment);
  }

  async setGoogleCalendarEventId(
    id: AppointmentId,
    eventId: string
  ): Promise<Result<void, NotFoundError>> {
    const existing = await prisma.appointment.findUnique({ where: { id } });

    if (!existing) {
      return err(new NotFoundError('Appointment', id));
    }

    await prisma.appointment.update({
      where: { id },
      data: { googleCalendarEventId: eventId },
    });

    return ok(undefined);
  }

  async count(query?: FindAppointmentsQuery): Promise<number> {
    const where: Record<string, unknown> = {};

    if (query?.barberId) {
      where.barberId = query.barberId;
    }

    if (query?.status && query.status.length > 0) {
      where.status = { in: query.status };
    }

        if (query?.dateFrom || query?.dateTo) {
          where.date = {
            ...(query.dateFrom ? { gte: query.dateFrom } : {}),
            ...(query.dateTo ? { lte: query.dateTo } : {}),
          };
        }

    return prisma.appointment.count({ where });
  }

  // ── Private Helpers ──────────────────────────────────────────

  private async getAvailableSlots(
    barberId: BarberId,
    serviceId: string,
    dateStr: string
  ): Promise<Array<{ time: string; available: boolean }>> {
    const date = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = date.getDay();

    const availability = await prisma.availability.findUnique({
      where: { barberId_dayOfWeek: { barberId, dayOfWeek } },
    });

    if (!availability?.isActive) return [];

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) return [];

    const duration = service.duration;

    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

    const appointments = await prisma.appointment.findMany({
      where: {
        barberId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });

    const [startH, startM] = availability.startTime.split(':').map(Number);
    const [endH, endM] = availability.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const slots: Array<{ time: string; available: boolean }> = [];

    for (let minutes = startMinutes; minutes + duration <= endMinutes; minutes += 30) {
      const slotStart = new Date(
        `${dateStr}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00`
      );
      const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

      const hasOverlap = appointments.some((apt) => {
        const aptStart = new Date(apt.date);
        const aptEnd = new Date(apt.endTime);
        return slotStart < aptEnd && slotEnd > aptStart;
      });

      slots.push({
        time: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
        available: !hasOverlap,
      });
    }

    return slots;
  }

  private toDomain(record: {
    id: string;
    barberId: string;
    serviceId: string;
    userId: string | null;
    clientName: string;
    clientPhone: string;
    clientEmail: string | null;
    date: Date;
    endTime: Date;
    status: string;
    notes: string | null;
    cancelToken: string;
    googleCalendarEventId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Appointment {
    const result = Appointment.create({
      id: record.id as AppointmentId,
      barberId: record.barberId as BarberId,
      serviceId: record.serviceId as any,
      userId: record.userId as any,
      clientName: record.clientName,
      clientPhone: record.clientPhone,
      clientEmail: record.clientEmail,
      date: record.date,
      endTime: record.endTime,
      status: record.status as AppointmentStatus,
      notes: record.notes,
      cancelToken: record.cancelToken as CancelToken,
      googleCalendarEventId: record.googleCalendarEventId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    if (result.ok) return result.value;
    throw result.error;
  }
}
