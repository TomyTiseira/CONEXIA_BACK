import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

async function addComplianceTypes() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'services-db',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'services_db',
  });

  try {
    await dataSource.initialize();
    console.log('[Migration] Conectado a la base de datos');

    const queryRunner = dataSource.createQueryRunner();

    // Verificar si ya existen los valores
    const existingValues = await queryRunner.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'claim_compliances_compliance_type_enum'
      )
    `);

    const existingLabels = existingValues.map((row: any) => row.enumlabel);
    console.log(
      '[Migration] Valores existentes en el enum:',
      existingLabels.join(', '),
    );

    const newValues = [
      'partial_payment',
      'work_completion',
      'work_revision',
      'other',
    ];

    for (const value of newValues) {
      if (!existingLabels.includes(value)) {
        console.log(`[Migration] Agregando valor '${value}' al enum...`);
        await queryRunner.query(`
          ALTER TYPE claim_compliances_compliance_type_enum ADD VALUE '${value}'
        `);
        console.log(`[Migration] ✓ Valor '${value}' agregado exitosamente`);
      } else {
        console.log(`[Migration] ⊘ Valor '${value}' ya existe, omitiendo...`);
      }
    }

    await queryRunner.release();

    console.log(
      '[Migration] ✓ Migración de tipos de compliance completada exitosamente',
    );
  } catch (error) {
    console.error('[Migration] ✗ Error durante la migración:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// Ejecutar la migración
addComplianceTypes()
  .then(() => {
    console.log('[Migration] Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Migration] Proceso fallido:', error);
    process.exit(1);
  });
