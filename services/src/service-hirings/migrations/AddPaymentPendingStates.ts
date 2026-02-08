import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentPendingStates1730505600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar estado 'payment_pending'
    await queryRunner.query(`
      INSERT INTO service_hiring_statuses (name, code, description) 
      SELECT 'Pago en Proceso', 'payment_pending', 'El cliente fue redirigido a MercadoPago y el pago está siendo procesado. Esperando confirmación del webhook.'
      WHERE NOT EXISTS (
        SELECT 1 FROM service_hiring_statuses WHERE code = 'payment_pending'
      )
    `);

    // Agregar estado 'payment_rejected'
    await queryRunner.query(`
      INSERT INTO service_hiring_statuses (name, code, description) 
      SELECT 'Pago Rechazado', 'payment_rejected', 'El pago fue rechazado o cancelado por MercadoPago. El cliente puede reintentar.'
      WHERE NOT EXISTS (
        SELECT 1 FROM service_hiring_statuses WHERE code = 'payment_rejected'
      )
    `);

    // Agregar columnas de tracking de pagos
    await queryRunner.query(`
      ALTER TABLE service_hirings 
      ADD COLUMN IF NOT EXISTS preference_id VARCHAR(255)
    `);

    await queryRunner.query(`
      ALTER TABLE service_hirings 
      ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255)
    `);

    await queryRunner.query(`
      ALTER TABLE service_hirings 
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50)
    `);

    await queryRunner.query(`
      ALTER TABLE service_hirings 
      ADD COLUMN IF NOT EXISTS payment_status_detail VARCHAR(255)
    `);

    await queryRunner.query(`
      ALTER TABLE service_hirings 
      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE service_hirings 
      ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0
    `);

    // Crear índices
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_service_hirings_preference_id 
      ON service_hirings(preference_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_service_hirings_payment_id 
      ON service_hirings(payment_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_service_hirings_payment_id`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_service_hirings_preference_id`,
    );

    // Eliminar columnas
    await queryRunner.query(
      `ALTER TABLE service_hirings DROP COLUMN IF EXISTS retry_count`,
    );
    await queryRunner.query(
      `ALTER TABLE service_hirings DROP COLUMN IF EXISTS paid_at`,
    );
    await queryRunner.query(
      `ALTER TABLE service_hirings DROP COLUMN IF EXISTS payment_status_detail`,
    );
    await queryRunner.query(
      `ALTER TABLE service_hirings DROP COLUMN IF EXISTS payment_status`,
    );
    await queryRunner.query(
      `ALTER TABLE service_hirings DROP COLUMN IF EXISTS payment_id`,
    );
    await queryRunner.query(
      `ALTER TABLE service_hirings DROP COLUMN IF EXISTS preference_id`,
    );

    // Eliminar estados
    await queryRunner.query(
      `DELETE FROM service_hiring_statuses WHERE code = 'payment_rejected'`,
    );
    await queryRunner.query(
      `DELETE FROM service_hiring_statuses WHERE code = 'payment_pending'`,
    );
  }
}
