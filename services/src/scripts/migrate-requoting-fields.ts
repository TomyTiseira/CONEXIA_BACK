import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🔧 Running requoting migrations...');

  try {
    // Agregar requoteRequestedAt a service_hirings
    await dataSource.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'service_hirings' AND column_name = 'requoteRequestedAt') THEN
              ALTER TABLE service_hirings 
              ADD COLUMN "requoteRequestedAt" TIMESTAMP NULL;
              
              COMMENT ON COLUMN service_hirings."requoteRequestedAt" IS 
              'Timestamp when the client requested a re-quotation';
              
              RAISE NOTICE 'Added requoteRequestedAt to service_hirings table';
          ELSE
              RAISE NOTICE 'requoteRequestedAt already exists in service_hirings table';
          END IF;
      END $$;
    `);

    // Agregar previousQuotedPrice a service_hirings
    await dataSource.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'service_hirings' AND column_name = 'previousQuotedPrice') THEN
              ALTER TABLE service_hirings 
              ADD COLUMN "previousQuotedPrice" DECIMAL(10,2) NULL;
              
              COMMENT ON COLUMN service_hirings."previousQuotedPrice" IS 
              'Previous quoted price before re-quotation';
              
              RAISE NOTICE 'Added previousQuotedPrice to service_hirings table';
          ELSE
              RAISE NOTICE 'previousQuotedPrice already exists in service_hirings table';
          END IF;
      END $$;
    `);

    // Agregar previousQuotedAt a service_hirings
    await dataSource.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'service_hirings' AND column_name = 'previousQuotedAt') THEN
              ALTER TABLE service_hirings 
              ADD COLUMN "previousQuotedAt" TIMESTAMP NULL;
              
              COMMENT ON COLUMN service_hirings."previousQuotedAt" IS 
              'Previous quotation date before re-quotation';
              
              RAISE NOTICE 'Added previousQuotedAt to service_hirings table';
          ELSE
              RAISE NOTICE 'previousQuotedAt already exists in service_hirings table';
          END IF;
      END $$;
    `);

    // Agregar previousQuotationValidityDays a service_hirings
    await dataSource.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'service_hirings' AND column_name = 'previousQuotationValidityDays') THEN
              ALTER TABLE service_hirings 
              ADD COLUMN "previousQuotationValidityDays" INTEGER NULL;
              
              COMMENT ON COLUMN service_hirings."previousQuotationValidityDays" IS 
              'Previous quotation validity days before re-quotation';
              
              RAISE NOTICE 'Added previousQuotationValidityDays to service_hirings table';
          ELSE
              RAISE NOTICE 'previousQuotationValidityDays already exists in service_hirings table';
          END IF;
      END $$;
    `);

    // Agregar requoteCount a service_hirings
    await dataSource.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'service_hirings' AND column_name = 'requoteCount') THEN
              ALTER TABLE service_hirings 
              ADD COLUMN "requoteCount" INTEGER DEFAULT 0;
              
              COMMENT ON COLUMN service_hirings."requoteCount" IS 
              'Number of times a re-quotation has been requested';
              
              RAISE NOTICE 'Added requoteCount to service_hirings table';
          ELSE
              RAISE NOTICE 'requoteCount already exists in service_hirings table';
          END IF;
      END $$;
    `);

    console.log('✅ Requoting migrations completed successfully');
  } catch (error) {
    console.error('❌ Error running requoting migrations:', error);
    throw error;
  }

  await app.close();
}

bootstrap().catch(console.error);
