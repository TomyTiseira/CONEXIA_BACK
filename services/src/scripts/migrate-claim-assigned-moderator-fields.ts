import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🔧 Running claim assigned-moderator migration...');

  try {
    await dataSource.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'claims' AND column_name = 'assigned_moderator_id'
          ) THEN
              ALTER TABLE claims
              ADD COLUMN assigned_moderator_id INTEGER NULL;
              RAISE NOTICE 'Added assigned_moderator_id to claims table';
          ELSE
              RAISE NOTICE 'assigned_moderator_id already exists in claims table';
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'claims' AND column_name = 'assigned_moderator_email'
          ) THEN
              ALTER TABLE claims
              ADD COLUMN assigned_moderator_email VARCHAR(255) NULL;
              RAISE NOTICE 'Added assigned_moderator_email to claims table';
          ELSE
              RAISE NOTICE 'assigned_moderator_email already exists in claims table';
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'claims' AND column_name = 'assigned_at'
          ) THEN
              ALTER TABLE claims
              ADD COLUMN assigned_at TIMESTAMP NULL;
              RAISE NOTICE 'Added assigned_at to claims table';
          ELSE
              RAISE NOTICE 'assigned_at already exists in claims table';
          END IF;
      END $$;
    `);

    console.log('✅ Claim assigned-moderator migration completed successfully');
  } catch (error) {
    console.error('❌ Error running claim assigned-moderator migration:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
