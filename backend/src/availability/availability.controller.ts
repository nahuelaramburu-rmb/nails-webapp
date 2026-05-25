import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AvailabilityService, SetAvailabilityDto } from './availability.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('availability')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Get()
  getByMonth(@Query('year') year: string, @Query('month') month: string) {
    return this.availabilityService.getByMonth(Number(year), Number(month));
  }

  @Get('slots')
  getSlots(
    @Query('date') date: string,
    @Query('employeeId') employeeId: string,
    @Query('duration') duration: string,
  ) {
    return this.availabilityService.getSlots(date, employeeId, Number(duration));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  upsert(@Body() dto: SetAvailabilityDto) {
    return this.availabilityService.upsert(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.availabilityService.remove(id);
  }
}
