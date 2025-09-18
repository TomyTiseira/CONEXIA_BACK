import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('memory')
  getMemoryHealth() {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const rssUsedMB = Math.round(usage.rss / 1024 / 1024);
    const memoryHealthy = heapUsedMB < 1200; // 1.2GB límite para health check

    return {
      service: 'communities',
      healthy: memoryHealthy,
      heapUsedMB,
      rssUsedMB,
      maxHeapMB: 1280, // Límite configurado
      timestamp: new Date().toISOString(),
    };
  }

  @Get('gc')
  forceGarbageCollection() {
    if (global.gc) {
      const beforeMem = process.memoryUsage();
      global.gc();
      const afterMem = process.memoryUsage();

      return {
        message: 'Garbage collection ejecutado',
        beforeHeapMB: Math.round(beforeMem.heapUsed / 1024 / 1024),
        afterHeapMB: Math.round(afterMem.heapUsed / 1024 / 1024),
        freedMB: Math.round(
          (beforeMem.heapUsed - afterMem.heapUsed) / 1024 / 1024,
        ),
      };
    } else {
      return {
        message: 'Garbage collection no disponible (usar --expose-gc)',
      };
    }
  }
}
