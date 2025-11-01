import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeliveryAttachmentsTable1730476800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla delivery_attachments para soportar múltiples archivos por entrega
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS delivery_attachments (
        id SERIAL PRIMARY KEY,
        delivery_id INTEGER NOT NULL REFERENCES delivery_submissions(id) ON DELETE CASCADE,
        file_path VARCHAR(500) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT,
        mime_type VARCHAR(100),
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear índices
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_attachments_delivery_id 
      ON delivery_attachments(delivery_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_attachments_order 
      ON delivery_attachments(delivery_id, order_index)
    `);

    // Migrar datos existentes de delivery_submissions a delivery_attachments
    await queryRunner.query(`
      INSERT INTO delivery_attachments (
        delivery_id, 
        file_path, 
        file_url, 
        file_name, 
        file_size, 
        order_index, 
        created_at
      )
      SELECT 
        id as delivery_id,
        attachment_path as file_path,
        attachment_path as file_url,
        SUBSTRING(attachment_path FROM '[^/]+$') as file_name,
        attachment_size as file_size,
        0 as order_index,
        created_at
      FROM delivery_submissions
      WHERE attachment_path IS NOT NULL 
        AND attachment_path != ''
        AND NOT EXISTS (
          SELECT 1 FROM delivery_attachments da 
          WHERE da.delivery_id = delivery_submissions.id
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_delivery_attachments_order`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_delivery_attachments_delivery_id`,
    );

    // Eliminar tabla
    await queryRunner.query(`DROP TABLE IF EXISTS delivery_attachments`);
  }
}
