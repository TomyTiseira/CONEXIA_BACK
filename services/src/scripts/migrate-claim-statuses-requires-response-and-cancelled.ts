import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  console.log(
    '🔧 Running claim status enum migration (requires_staff_response, cancelled)...',
  );

  try {
    await dataSource.query(`
      DO $$
      DECLARE
        enum_type_name text;
        enum_type_oid oid;
      BEGIN
        SELECT c.udt_name
          INTO enum_type_name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'claims'
          AND c.column_name = 'status';

        IF enum_type_name IS NULL THEN
          RAISE NOTICE 'Skipping claim status enum migration: public.claims.status not found';
          RETURN;
        END IF;

        SELECT t.oid
          INTO enum_type_oid
        FROM pg_type t
        WHERE t.typname = enum_type_name;

        IF enum_type_oid IS NULL THEN
          RAISE NOTICE 'Skipping claim status enum migration: enum type % not found', enum_type_name;
          RETURN;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'requires_staff_response'
            AND enumtypid = enum_type_oid
        ) THEN
          EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type_name, 'requires_staff_response');
          RAISE NOTICE 'Added requires_staff_response to % enum', enum_type_name;
        ELSE
          RAISE NOTICE 'requires_staff_response already exists in % enum', enum_type_name;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'cancelled'
            AND enumtypid = enum_type_oid
        ) THEN
          EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type_name, 'cancelled');
          RAISE NOTICE 'Added cancelled to % enum', enum_type_name;
        ELSE
          RAISE NOTICE 'cancelled already exists in % enum', enum_type_name;
        END IF;
      END $$;
    `);

    console.log('✅ Claim status enum migration completed successfully');
  } catch (error) {
    console.error('❌ Error running claim status enum migration:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
