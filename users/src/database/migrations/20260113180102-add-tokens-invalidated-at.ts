import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTokensInvalidatedAt20260113180102
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna tokens_invalidated_at
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'tokens_invalidated_at',
        type: 'timestamp',
        isNullable: true,
        comment:
          'Timestamp de última invalidación de tokens - se actualiza al suspender/reactivar para forzar re-login',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'tokens_invalidated_at');
  }
}
