import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewComplianceTypes1737892800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar nuevos valores al enum de compliance_type
    await queryRunner.query(`
      ALTER TYPE claim_compliances_compliance_type_enum 
      ADD VALUE IF NOT EXISTS 'work_completion'
    `);

    await queryRunner.query(`
      ALTER TYPE claim_compliances_compliance_type_enum 
      ADD VALUE IF NOT EXISTS 'work_revision'
    `);

    await queryRunner.query(`
      ALTER TYPE claim_compliances_compliance_type_enum 
      ADD VALUE IF NOT EXISTS 'apology_required'
    `);

    await queryRunner.query(`
      ALTER TYPE claim_compliances_compliance_type_enum 
      ADD VALUE IF NOT EXISTS 'service_discount'
    `);

    await queryRunner.query(`
      ALTER TYPE claim_compliances_compliance_type_enum 
      ADD VALUE IF NOT EXISTS 'penalty_fee'
    `);

    await queryRunner.query(`
      ALTER TYPE claim_compliances_compliance_type_enum 
      ADD VALUE IF NOT EXISTS 'account_restriction'
    `);

    await queryRunner.query(`
      ALTER TYPE claim_compliances_compliance_type_enum 
      ADD VALUE IF NOT EXISTS 'other'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // NOTA: PostgreSQL no soporta eliminar valores de ENUMs directamente
    // Si necesitas revertir esta migración, deberás:
    // 1. Crear un nuevo ENUM sin estos valores
    // 2. Migrar los datos
    // 3. Reemplazar el ENUM antiguo
    // Por ahora, esta migración no tiene reversión automática
    console.warn(
      'Esta migración no puede revertirse automáticamente. Los valores de ENUM agregados permanecerán en la base de datos.',
    );
  }
}
