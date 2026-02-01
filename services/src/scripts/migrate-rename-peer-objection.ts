import { DataSource } from 'typeorm';

/**
 * Migración: Renombrar peer_objection a peer_review_reason
 * Fecha: 2026-01-27
 *
 * Propósito: Mejorar la semántica del campo que se usa para comentarios
 *            tanto de pre-aprobación como de pre-rechazo.
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

    console.log('🔍 Verificando si la columna peer_objection existe...');

    // Verificar si peer_objection existe
    const checkOldColumn = await dataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'claim_compliances' 
      AND column_name = 'peer_objection'
    `);

    // Verificar si peer_review_reason ya existe
    const checkNewColumn = await dataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'claim_compliances' 
      AND column_name = 'peer_review_reason'
    `);

    if (checkOldColumn.length > 0 && checkNewColumn.length === 0) {
      console.log('✏️  Renombrando peer_objection → peer_review_reason...');

      await dataSource.query(`
        ALTER TABLE claim_compliances 
        RENAME COLUMN peer_objection TO peer_review_reason;
      `);

      await dataSource.query(`
        COMMENT ON COLUMN claim_compliances.peer_review_reason IS 
        'Comentario o razón del peer al pre-aprobar o pre-rechazar el cumplimiento. Sirve tanto para aprobación como para rechazo.';
      `);

      console.log('✅ Columna renombrada exitosamente');
    } else if (checkNewColumn.length > 0) {
      console.log(
        '⏭️  La migración ya fue aplicada (peer_review_reason ya existe)',
      );
    } else {
      console.log(
        '⚠️  La columna peer_objection no existe, no se requiere migración',
      );
    }

    await dataSource.destroy();
    console.log('✅ Migración completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

migrate();
