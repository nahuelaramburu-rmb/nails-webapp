import { Body, Controller, HttpCode, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create-preference')
  createPreference(@Body() body: any) {
    return this.paymentsService.createPreference(body);
  }

  @Post('process')
  processPayment(@Body() body: any) {
    return this.paymentsService.processPayment(body);
  }

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(@Body() body: any, @Query() query: any) {
    return this.paymentsService.handleWebhook(body, query);
  }
}
