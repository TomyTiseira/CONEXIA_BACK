import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🔧 Running claim clarification-evidence migration...');

  try {
    await dataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'claims' AND column_name = 'clarification_evidence_urls'
        ) THEN
          ALTER TABLE claims
          ADD COLUMN clarification_evidence_urls JSONB NULL DEFAULT '[]'::jsonb;
          RAISE NOTICE 'Added clarification_evidence_urls to claims table';
        ELSE
          RAISE NOTICE 'clarification_evidence_urls already exists in claims table';
        END IF;
      END $$;
    `);

    console.log('✅ Claim clarification-evidence migration completed successfully');
  } catch (error) {
    console.error('❌ Error running claim clarification-evidence migration:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
