import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🔧 Running database migrations...');

  try {
    // Agregar deliverySubmissionId a payments
    await dataSource.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'payments' AND column_name = 'deliverySubmissionId') THEN
              ALTER TABLE payments 
              ADD COLUMN "deliverySubmissionId" INTEGER NULL;
              
              COMMENT ON COLUMN payments."deliverySubmissionId" IS 
              'ID of the delivery submission associated with this payment (for webhook processing)';
              
              RAISE NOTICE 'Added deliverySubmissionId to payments table';
          ELSE
              RAISE NOTICE 'deliverySubmissionId already exists in payments table';
          END IF;
      END $$;
    `);

    // Agregar mercadoPagoPaymentId a delivery_submissions
    await dataSource.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'delivery_submissions' AND column_name = 'mercadoPagoPaymentId') THEN
              ALTER TABLE delivery_submissions 
              ADD COLUMN "mercadoPagoPaymentId" VARCHAR(255) NULL;
              
              COMMENT ON COLUMN delivery_submissions."mercadoPagoPaymentId" IS 
              'ID of the MercadoPago payment/preference to track payment status';
              
              RAISE NOTICE 'Added mercadoPagoPaymentId to delivery_submissions table';
          ELSE
              RAISE NOTICE 'mercadoPagoPaymentId already exists in delivery_submissions table';
          END IF;
      END $$;
    `);

    // Agregar mercadoPagoPreferenceId a delivery_submissions
    await dataSource.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'delivery_submissions' AND column_name = 'mercadoPagoPreferenceId') THEN
              ALTER TABLE delivery_submissions 
              ADD COLUMN "mercadoPagoPreferenceId" VARCHAR(255) NULL;
              
              COMMENT ON COLUMN delivery_submissions."mercadoPagoPreferenceId" IS 
              'ID of the MercadoPago preference to track payment creation';
              
              RAISE NOTICE 'Added mercadoPagoPreferenceId to delivery_submissions table';
          ELSE
              RAISE NOTICE 'mercadoPagoPreferenceId already exists in delivery_submissions table';
          END IF;
      END $$;
    `);

    // Crear índice para deliverySubmissionId
    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_delivery_submission 
      ON payments("deliverySubmissionId");
    `);

    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    throw error;
  }

  await app.close();
}

bootstrap().catch(console.error);
