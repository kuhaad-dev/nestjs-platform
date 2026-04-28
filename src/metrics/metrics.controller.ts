import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Public()
  @Get()
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', this.metricsService.getContentType());
    res.send(await this.metricsService.getMetrics());
  }
}