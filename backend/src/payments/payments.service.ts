import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MercadoPagoConfig, { Preference, Payment } from 'mercadopago';
import { AppointmentsService, CreateAppointmentDto } from '../appointments/appointments.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private mpClient: MercadoPagoConfig;

  constructor(
    private appointmentsService: AppointmentsService,
    private mailService: MailService,
    private config: ConfigService,
  ) {
    this.mpClient = new MercadoPagoConfig({
      accessToken: this.config.get<string>('MP_ACCESS_TOKEN', ''),
    });
  }

  async createPreference(dto: CreateAppointmentDto) {
    const appointment = await this.appointmentsService.create(dto);
    const service = appointment.service;
    const baseUrl = this.config.get<string>('FRONTEND_URL', 'https://nails.rmbcorp.com');
    const backendUrl = this.config.get<string>('BACKEND_URL', 'https://nails.rmbcorp.com');

    const parts = dto.clientName.trim().split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || parts[0];

    const preferenceClient = new Preference(this.mpClient);
    const result = await preferenceClient.create({
      body: {
        items: [
          {
            id: service.id,
            title: `Seña - ${service.name}`,
            description: `Turno el ${dto.date} a las ${dto.startTime}hs con ${appointment.employee.name}`,
            quantity: 1,
            unit_price: appointment.depositAmount || service.price,
            currency_id: 'ARS',
            category_id: 'services',
          },
        ],
        payer: {
          name: firstName,
          surname: lastName,
          email: dto.clientEmail,
          phone: {
            area_code: '',
            number: dto.clientPhone,
          },
        },
        back_urls: {
          success: `${baseUrl}/booking/success`,
          failure: `${baseUrl}/booking/failure`,
          pending: `${baseUrl}/booking/pending`,
        },
        auto_return: 'approved',
        external_reference: appointment.id,
        notification_url: `${backendUrl}/api/payments/webhook`,
        statement_descriptor: 'Nails Studio',
        payment_methods: {
          installments: 1,
        },
      },
    });

    this.logger.log(`Preferencia creada — id: ${result.id} | appointmentId: ${appointment.id}`);

    return {
      init_point: result.init_point,
      appointmentId: appointment.id,
      depositAmount: appointment.depositAmount,
    };
  }

  async processPayment(body: { formData: any; appointmentId: string }) {
    const appointment = await this.appointmentsService.findById(body.appointmentId);
    const paymentClient = new Payment(this.mpClient);

    const payment = await paymentClient.create({
      body: {
        ...body.formData,
        transaction_amount: appointment.depositAmount,
        external_reference: body.appointmentId,
        description: `Seña - ${appointment.service.name}`,
      },
    });

    this.logger.log(`Pago procesado — id: ${payment.id} | status: ${payment.status}`);

    return { status: payment.status, paymentId: String(payment.id) };
  }

  async handleWebhook(body: any, query: any) {
    const type = body?.type || body?.action || query?.type;
    const rawId = body?.data?.id || query?.['data.id'];

    if (!rawId || (type && !String(type).includes('payment'))) return { ok: true };

    const paymentId = String(rawId);
    this.logger.log(`Webhook recibido — paymentId: ${paymentId}`);

    try {
      const paymentClient = new Payment(this.mpClient);
      const payment = await paymentClient.get({ id: paymentId });

      if (!payment.external_reference) return { ok: true };

      if (payment.status === 'approved') {
        const appointment = await this.appointmentsService.confirm(
          payment.external_reference,
          paymentId,
          payment.status,
        );

        const remaining = appointment.service.price - appointment.depositAmount;

        await this.mailService.sendAppointmentConfirmation({
          clientName: appointment.clientName,
          clientEmail: appointment.clientEmail,
          serviceName: appointment.service.name,
          servicePrice: appointment.service.price,
          depositAmount: appointment.depositAmount,
          remainingAmount: remaining,
          employeeName: appointment.employee.name,
          date: appointment.date.toISOString().slice(0, 10),
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          paymentId,
        });
      }
    } catch (err) {
      this.logger.error(`Error procesando webhook: ${err.message}`);
    }

    return { ok: true };
  }
}
