import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface AppointmentMailData {
  clientName: string;
  clientEmail: string;
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
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: Number(this.config.get('SMTP_PORT', '465')),
      secure: true,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  async sendAppointmentConfirmation(data: AppointmentMailData) {
    const dateFormatted = new Date(data.date + 'T12:00:00Z').toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ec4899,#a855f7);padding:36px 40px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">💅</div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Nails Studio</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Confirmación de turno</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;color:#374151;font-size:16px;">Hola, <strong>${data.clientName}</strong> 👋</p>
              <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
                Tu turno fue confirmado y tu seña fue recibida exitosamente. Te esperamos!
              </p>

              <!-- Appointment card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf4ff;border:1.5px solid #f3e8ff;border-radius:12px;overflow:hidden;margin-bottom:20px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 16px;color:#7c3aed;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Detalle del turno</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;">
                          <span style="color:#9333ea;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Servicio</span><br/>
                          <span style="color:#1f2937;font-size:16px;font-weight:600;margin-top:2px;display:block;">${data.serviceName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;">
                          <span style="color:#9333ea;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Profesional</span><br/>
                          <span style="color:#1f2937;font-size:15px;margin-top:2px;display:block;">${data.employeeName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #f3e8ff;">
                          <span style="color:#9333ea;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Fecha</span><br/>
                          <span style="color:#1f2937;font-size:15px;margin-top:2px;display:block;text-transform:capitalize;">${dateFormatted}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#9333ea;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Horario</span><br/>
                          <span style="color:#1f2937;font-size:15px;margin-top:2px;display:block;">${data.startTime} – ${data.endTime} hs</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Payment card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;overflow:hidden;margin-bottom:20px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 16px;color:#166534;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Comprobante de pago</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #d1fae5;">
                          <span style="color:#16a34a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">N° de transacción</span><br/>
                          <span style="color:#1f2937;font-size:14px;font-family:monospace;margin-top:2px;display:block;">${data.paymentId}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #d1fae5;">
                          <span style="color:#16a34a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Seña abonada ✓</span><br/>
                          <span style="color:#16a34a;font-size:20px;font-weight:700;margin-top:2px;display:block;">$${data.depositAmount.toLocaleString('es-AR')}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #d1fae5;">
                          <span style="color:#16a34a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Precio total del servicio</span><br/>
                          <span style="color:#374151;font-size:16px;font-weight:600;margin-top:2px;display:block;">$${data.servicePrice.toLocaleString('es-AR')}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#16a34a;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Saldo restante a abonar el día del turno</span><br/>
                          <span style="color:#ec4899;font-size:20px;font-weight:700;margin-top:2px;display:block;">$${data.remainingAmount.toLocaleString('es-AR')}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;color:#6b7280;font-size:13px;line-height:1.6;">
                ¿Necesitás cancelar o reprogramar? Comunicáte con nosotras con anticipación.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">Nails Studio · nails@rmbcorp.com</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: `"Nails Studio" <${this.config.get('SMTP_USER')}>`,
        to: data.clientEmail,
        subject: `✅ Turno confirmado — ${data.serviceName} el ${dateFormatted}`,
        html,
      });
      this.logger.log(`Email enviado a ${data.clientEmail}`);
    } catch (err) {
      this.logger.error(`Error enviando email a ${data.clientEmail}: ${err.message}`);
    }
  }
}
