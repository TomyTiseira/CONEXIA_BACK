import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTokensInvalidatedAt20260113180958 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la columna ya existe
    const table = await queryRunner.getTable('users');
    const column = table?.findColumnByName('tokens_invalidated_at');

    if (!column) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'tokens_invalidated_at',
          type: 'timestamp',
          isNullable: true,
          comment: 'Timestamp de última invalidación de sesiones JWT - se actualiza al suspender/banear/reactivar',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'tokens_invalidated_at');
  }
}
