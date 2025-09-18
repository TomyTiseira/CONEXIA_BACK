import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class MemoryMonitorService implements OnModuleDestroy {
  private readonly logger = new Logger(MemoryMonitorService.name);
  private readonly MEMORY_WARNING_THRESHOLD = 800 * 1024 * 1024; // 800MB
  private readonly MEMORY_CRITICAL_THRESHOLD = 1000 * 1024 * 1024; // 1GB
  private readonly GC_INTERVAL = 30000; // 30 segundos
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.startMemoryMonitoring();
  }

  onModuleDestroy() {
    // Limpiar el interval cuando el módulo se destruye
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.debug('Memory monitor interval cleared');
    }
  }

  /**
   * Inicia el monitoreo de memoria - DISABLED for memory thrashing prevention
   */
  private startMemoryMonitoring(): void {
    // DISABLED: Aggressive memory monitoring was causing cascading memory issues
    // Only log memory usage without automatic GC intervention
    this.logMemoryUsage();

    // Optional: Monitor only every 5 minutes instead of 30 seconds
    // this.intervalId = setInterval(() => {
    //   this.logMemoryUsage();
    // }, 300000); // 5 minutes
  }

  /**
   * Verifica el uso de memoria y toma acciones si es necesario
   */
  private checkMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    const heapUsed = memUsage.heapUsed;

    if (heapUsed > this.MEMORY_CRITICAL_THRESHOLD) {
      this.logger.error(
        `🚨 MEMORIA CRÍTICA: ${this.formatBytes(heapUsed)} - Ejecutando GC agresivo`,
      );
      this.forceGarbageCollection();
    } else if (heapUsed > this.MEMORY_WARNING_THRESHOLD) {
      this.logger.warn(
        `⚠️ ADVERTENCIA DE MEMORIA: ${this.formatBytes(heapUsed)} - Monitoreando`,
      );
    }

    // Log periódico cada minuto
    if (Math.random() < 0.1) {
      // 10% de probabilidad
      this.logMemoryUsage();
    }
  }

  /**
   * Fuerza la ejecución del garbage collector
   */
  private forceGarbageCollection(): void {
    try {
      const beforeGC = process.memoryUsage();

      if (global.gc) {
        global.gc();

        const afterGC = process.memoryUsage();
        this.logger.debug(
          `GC executed - Before: ${this.formatBytes(beforeGC.heapUsed)}, After: ${this.formatBytes(afterGC.heapUsed)}`,
        );
      } else {
        this.logger.warn(
          'GC no está disponible. Agregue --expose-gc a NODE_OPTIONS',
        );
      }
    } catch (error) {
      this.logger.error('Error ejecutando GC:', error);
    }
  }

  /**
   * Log del uso actual de memoria
   */
  private logMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    this.logger.debug(
      `📊 Memoria - Heap: ${this.formatBytes(memUsage.heapUsed)}/${this.formatBytes(memUsage.heapTotal)}, RSS: ${this.formatBytes(memUsage.rss)}`,
    );
  }

  /**
   * Formatea bytes a formato legible
   */
  private formatBytes(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)}MB`;
  }

  /**
   * Obtiene estadísticas actuales de memoria
   */
  public getMemoryStats(): {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  } {
    return process.memoryUsage();
  }

  /**
   * Verifica si la memoria está en estado crítico
   */
  public isMemoryCritical(): boolean {
    return process.memoryUsage().heapUsed > this.MEMORY_CRITICAL_THRESHOLD;
  }

  /**
   * Fuerza limpieza de memoria (para uso manual)
   */
  public forceCleanup(): void {
    this.logger.log('🧹 Forzando limpieza de memoria...');
    this.forceGarbageCollection();
  }
}
