import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class MemoryMonitorService implements OnModuleDestroy {
  private readonly logger = new Logger(MemoryMonitorService.name);
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    // Forzar garbage collection cada 30 segundos en desarrollo - CON LIMPIEZA
    if (process.env.NODE_ENV !== 'production') {
      this.intervalId = setInterval(() => {
        this.forceGarbageCollection();
      }, 30000);
    }
  }

  onModuleDestroy() {
    // Limpiar el interval cuando el módulo se destruye
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.debug('Memory monitor interval cleared');
    }
  }

  forceGarbageCollection() {
    if (global.gc) {
      try {
        const memBefore = process.memoryUsage();
        global.gc();
        const memAfter = process.memoryUsage();

        this.logger.debug(
          `GC executed - Before: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)}MB, After: ${(memAfter.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        );
      } catch (error) {
        this.logger.error('Error during garbage collection:', error);
      }
    }
  }

  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
    };
  }

  logMemoryUsage() {
    const memory = this.getMemoryUsage();
    this.logger.log(
      `Memory usage - RSS: ${memory.rss}MB, Heap: ${memory.heapUsed}/${memory.heapTotal}MB, External: ${memory.external}MB`,
    );
  }
}
