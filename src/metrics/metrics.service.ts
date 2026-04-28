import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;

  // Counts total HTTP requests, labelled by method, route, status code
  readonly httpRequestCounter: Counter<string>;

  // Measures how long each request takes
  readonly httpRequestDuration: Histogram<string>;

  constructor() {
    this.registry = new Registry();

    // Collect default Node.js metrics:
    // event loop lag, garbage collection, memory heap, active handles
    collectDefaultMetrics({ register: this.registry });

    this.httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      // Buckets define the histogram boundaries
      // These cover: 10ms, 50ms, 100ms, 200ms, 500ms, 1s, 2s, 5s
      buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
      registers: [this.registry],
    });
  }

  onModuleInit() {
    // Nothing needed here — metrics registered in constructor
  }

  // Returns all metrics in Prometheus text format
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}