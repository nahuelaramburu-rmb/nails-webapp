import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WhatsappConfirmationData {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  servicePrice: number;
  depositAmount: number;
  remainingAmount: number;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  paymentId: string;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private config: ConfigService) {}

  private formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('54')) return `${digits}@c.us`;
    if (digits.startsWith('0')) return `54${digits.slice(1)}@c.us`;
    return `54${digits}@c.us`;
  }

  private formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00Z');
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${days[d.getUTCDay()]} ${d.getUTCDate()} de ${months[d.getUTCMonth()]}`;
  }

  private buildMessage(data: WhatsappConfirmationData): string {
    const dateStr = this.formatDate(data.date);
    return [
      `¡Hola ${data.clientName}! 🌸`,
      ``,
      `✅ *Tu turno fue confirmado*`,
      ``,
      `📅 *Fecha:* ${dateStr}`,
      `🕐 *Horario:* ${data.startTime} - ${data.endTime} hs`,
      `💅 *Servicio:* ${data.serviceName}`,
      `👩‍💼 *Profesional:* ${data.employeeName}`,
      ``,
      `💰 *Seña abonada:* $${data.depositAmount.toLocaleString('es-AR')}`,
      `💳 *Saldo el día del turno:* $${data.remainingAmount.toLocaleString('es-AR')}`,
      ``,
      `¡Te esperamos! ✨`,
    ].join('\n');
  }

  async sendAppointmentConfirmation(data: WhatsappConfirmationData): Promise<void> {
    const baseUrl = this.config.get<string>('OPENWA_URL', 'http://openwa:2785');
    const apiKey = this.config.get<string>('OPENWA_API_KEY', '');
    const sessionId = this.config.get<string>('OPENWA_SESSION_ID', 'nails');

    if (!apiKey) {
      this.logger.warn('OPENWA_API_KEY no configurado, omitiendo WhatsApp');
      return;
    }

    const chatId = this.formatPhone(data.clientPhone);
    const text = this.buildMessage(data);

    try {
      const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/messages/send-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify({ chatId, text }),
      });

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`OpenWA error ${res.status}: ${body}`);
        return;
      }

      this.logger.log(`WhatsApp enviado a ${chatId}`);
    } catch (err) {
      this.logger.error(`Error enviando WhatsApp a ${chatId}: ${err.message}`);
    }
  }
}
