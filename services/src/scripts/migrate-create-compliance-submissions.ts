import { DataSource } from 'typeorm';

/**
 * Migración: Crear tabla claim_compliance_submissions
 * Fecha: 2026-01-28
 *
 * Propósito: Crear tabla de historial de submissions de compliances.
 *            Esta tabla mantiene registro de cada intento de cumplimiento.
 */

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'services-db',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'services_db',
});

async function migrate() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await dataSource.initialize();

    console.log(
      '🔍 Verificando si la tabla claim_compliance_submissions existe...',
    );

    // Verificar si la tabla ya existe
    const tableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'claim_compliance_submissions'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('📋 Creando tabla claim_compliance_submissions...');

      // Crear la tabla
      await dataSource.query(`
        CREATE TABLE claim_compliance_submissions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          compliance_id UUID NOT NULL REFERENCES claim_compliances(id) ON DELETE CASCADE,
          
          -- Número de intento (1, 2, 3...)
          attempt_number INT NOT NULL,
          
          -- Estado de esta submission específica
          status VARCHAR(50) NOT NULL,
          
          -- Evidencia y notas del usuario
          evidence_urls TEXT[],
          user_notes TEXT,
          submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
          
          -- Revisión del moderador
          reviewed_by VARCHAR(255),
          reviewed_at TIMESTAMP,
          moderator_decision VARCHAR(20),
          moderator_notes TEXT,
          rejection_reason TEXT,
          
          -- Peer review (opcional)
          peer_reviewed_by VARCHAR(255),
          peer_approved BOOLEAN,
          peer_review_reason TEXT,
          peer_reviewed_at TIMESTAMP,
          
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      console.log('🔑 Creando índices...');

      // Crear índices
      await dataSource.query(`
        CREATE INDEX idx_compliance_submissions_compliance 
        ON claim_compliance_submissions(compliance_id);
      `);

      await dataSource.query(`
        CREATE INDEX idx_compliance_submissions_attempt 
        ON claim_compliance_submissions(compliance_id, attempt_number);
      `);

      await dataSource.query(`
        CREATE INDEX idx_compliance_submissions_status 
        ON claim_compliance_submissions(status);
      `);

      await dataSource.query(`
        CREATE UNIQUE INDEX idx_compliance_submissions_unique_attempt 
        ON claim_compliance_submissions(compliance_id, attempt_number);
      `);

      console.log('💬 Agregando comentarios...');

      // Agregar comentarios
      await dataSource.query(`
        COMMENT ON TABLE claim_compliance_submissions IS 
        'Historial de todas las submissions de evidencia para cada compliance. Permite tracking de múltiples intentos y auditoría completa.';
      `);

      await dataSource.query(`
        COMMENT ON COLUMN claim_compliance_submissions.attempt_number IS 
        'Número de intento (1, 2, 3...). Incrementa con cada rechazo.';
      `);

      await dataSource.query(`
        COMMENT ON COLUMN claim_compliance_submissions.status IS 
        'Estado de esta submission: pending_review, approved, rejected, requires_adjustment';
      `);

      await dataSource.query(`
        COMMENT ON COLUMN claim_compliance_submissions.moderator_decision IS 
        'Decisión del moderador: approve, reject, adjust';
      `);

      console.log('✅ Tabla claim_compliance_submissions creada exitosamente');
    } else {
      console.log('⏭️  La tabla claim_compliance_submissions ya existe');
    }

    await dataSource.destroy();
    console.log('✅ Migración completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    try {
      await dataSource.destroy();
    } catch {
      // Ignorar errores al cerrar conexión
    }
    process.exit(1);
  }
}

migrate().catch((err) => {
  console.error('Unhandled error in migrate:', err);
  process.exit(1);
});
