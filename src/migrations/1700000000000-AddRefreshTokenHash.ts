import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRefreshTokenHash1700000000000 implements MigrationInterface {
  name = 'AddRefreshTokenHash1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'refreshTokenHash',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'refreshTokenHash');
  }
}