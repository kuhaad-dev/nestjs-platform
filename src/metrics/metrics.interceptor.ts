import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, route } = req;
    const routePath = route?.path ?? req.path;

    // Start timing the request
    const end = this.metricsService.httpRequestDuration.startTimer({
      method,
      route: routePath,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = context
            .switchToHttp()
            .getResponse().statusCode;

          // Record successful request
          end({ status_code: statusCode.toString() });
          this.metricsService.httpRequestCounter.inc({
            method,
            route: routePath,
            status_code: statusCode.toString(),
          });
        },
        error: (err) => {
          const statusCode = err.status ?? 500;

          // Record failed request
          end({ status_code: statusCode.toString() });
          this.metricsService.httpRequestCounter.inc({
            method,
            route: routePath,
            status_code: statusCode.toString(),
          });
        },
      }),
    );
  }
}