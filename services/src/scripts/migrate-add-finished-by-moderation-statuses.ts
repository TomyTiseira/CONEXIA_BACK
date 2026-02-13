import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  console.log(
    '🔧 Running enum migration: add finished_by_moderation to claims.status and claim_compliances.status...',
  );

  try {
    await dataSource.query(`
      DO $$
      DECLARE
        claim_enum_name text;
        claim_enum_oid oid;
        compliance_enum_name text;
        compliance_enum_oid oid;
      BEGIN
        -- ===== claims.status enum =====
        SELECT c.udt_name
          INTO claim_enum_name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'claims'
          AND c.column_name = 'status';

        IF claim_enum_name IS NOT NULL THEN
          SELECT t.oid
            INTO claim_enum_oid
          FROM pg_type t
          WHERE t.typname = claim_enum_name;

          IF claim_enum_oid IS NOT NULL THEN
            IF NOT EXISTS (
              SELECT 1 FROM pg_enum
              WHERE enumlabel = 'finished_by_moderation'
                AND enumtypid = claim_enum_oid
            ) THEN
              EXECUTE format('ALTER TYPE %I ADD VALUE %L', claim_enum_name, 'finished_by_moderation');
              RAISE NOTICE 'Added finished_by_moderation to % enum', claim_enum_name;
            ELSE
              RAISE NOTICE 'finished_by_moderation already exists in % enum', claim_enum_name;
            END IF;
          ELSE
            RAISE NOTICE 'Skipping claims.status enum migration: enum type % not found', claim_enum_name;
          END IF;
        ELSE
          RAISE NOTICE 'Skipping claims.status enum migration: public.claims.status not found';
        END IF;

        -- ===== claim_compliances.status enum =====
        SELECT c.udt_name
          INTO compliance_enum_name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'claim_compliances'
          AND c.column_name = 'status';

        IF compliance_enum_name IS NOT NULL THEN
          SELECT t.oid
            INTO compliance_enum_oid
          FROM pg_type t
          WHERE t.typname = compliance_enum_name;

          IF compliance_enum_oid IS NOT NULL THEN
            IF NOT EXISTS (
              SELECT 1 FROM pg_enum
              WHERE enumlabel = 'finished_by_moderation'
                AND enumtypid = compliance_enum_oid
            ) THEN
              EXECUTE format('ALTER TYPE %I ADD VALUE %L', compliance_enum_name, 'finished_by_moderation');
              RAISE NOTICE 'Added finished_by_moderation to % enum', compliance_enum_name;
            ELSE
              RAISE NOTICE 'finished_by_moderation already exists in % enum', compliance_enum_name;
            END IF;
          ELSE
            RAISE NOTICE 'Skipping claim_compliances.status enum migration: enum type % not found', compliance_enum_name;
          END IF;
        ELSE
          RAISE NOTICE 'Skipping claim_compliances.status enum migration: public.claim_compliances.status not found';
        END IF;
      END $$;
    `);

    console.log('✅ Enum migration completed successfully');
  } catch (error) {
    console.error('❌ Error running enum migration:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
