import { DataSource } from 'typeorm';

export async function addComplianceTrackingFields(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    console.log(
      '[Migration] Iniciando migración: agregar campos de tracking a claim_compliances',
    );

    // Verificar si la columna 'current_attempt' ya existe
    const currentAttemptExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'claim_compliances' 
      AND column_name = 'current_attempt'
    `);

    if (currentAttemptExists.length === 0) {
      console.log('[Migration] Agregando campos de tracking...');

      // Agregar campos nuevos
      await queryRunner.query(`
        ALTER TABLE claim_compliances
        ADD COLUMN IF NOT EXISTS current_attempt INT DEFAULT 1,
        ADD COLUMN IF NOT EXISTS max_attempts INT DEFAULT 3,
        ADD COLUMN IF NOT EXISTS has_active_warning BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS warning_sent_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS suspension_triggered BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS ban_triggered BOOLEAN DEFAULT false;
      `);

      console.log('[Migration] ✅ Campos de tracking agregados exitosamente');
    } else {
      console.log('[Migration] ⏭️  Campos de tracking ya existen, saltando...');
    }

    console.log('[Migration] Migración completada');
  } catch (error) {
    console.error('[Migration] ❌ Error en migración:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
