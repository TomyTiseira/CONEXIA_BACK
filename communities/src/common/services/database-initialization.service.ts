import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseInitializationService implements OnModuleInit {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async onModuleInit() {
    console.log('🚀 Iniciando optimizaciones de base de datos...');

    try {
      await this.applyOptimizations();
      console.log('✅ Optimizaciones de base de datos aplicadas exitosamente');
    } catch (error) {
      console.error(
        '❌ Error aplicando optimizaciones de base de datos:',
        error,
      );
      // No fallar la aplicación, solo logear el error
    }
  }

  private async applyOptimizations() {
    const scriptPath = join(process.cwd(), 'scripts', 'init-optimizations.sql');

    try {
      const script = readFileSync(scriptPath, 'utf8');

      // Dividir en comandos individuales y ejecutar uno por uno
      const commands = script
        .split(';')
        .map((cmd) => cmd.trim())
        .filter((cmd) => cmd.length > 0 && !cmd.startsWith('--'));

      for (const command of commands) {
        if (command.trim()) {
          try {
            await this.dataSource.query(command);
          } catch (error) {
            // Algunos comandos pueden fallar si ya existen (como CREATE INDEX IF NOT EXISTS)
            // Solo logear warnings para estos casos
            if (!error.message.includes('already exists')) {
              console.warn(
                `Warning ejecutando comando: ${command.substring(0, 50)}...`,
                error.message,
              );
            }
          }
        }
      }

      // Verificar que los índices estén creados
      const indexCheck: Array<{ indexname: string }> = await this.dataSource
        .query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'connections' 
        AND indexname LIKE '%optimized%'
      `);

      console.log(`📊 Índices optimizados encontrados: ${indexCheck.length}`);
      indexCheck.forEach((idx) => console.log(`  - ${idx.indexname}`));
    } catch (error) {
      console.error('Error leyendo script de optimización:', error);
      throw error;
    }
  }
}
