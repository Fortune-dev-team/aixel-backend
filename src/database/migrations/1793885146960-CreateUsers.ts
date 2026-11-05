import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1793885146960 implements MigrationInterface {
  name = 'CreateUsers1793885146960';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('tim', 'admin')`,
    );
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "full_name" character varying(100) NOT NULL,
        "email" character varying(320) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'tim',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
