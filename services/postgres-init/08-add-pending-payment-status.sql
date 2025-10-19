-- Migration: Add pending_payment status and payment tracking for deliveries
-- Date: 2025-10-18
-- Description: Adds PENDING_PAYMENT status to prevent approving deliveries before payment confirmation
--              Also adds mercadoPagoPaymentId to track payments

-- Add deliverySubmissionId to payments table for webhook processing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'deliverySubmissionId') THEN
        ALTER TABLE payments 
        ADD COLUMN "deliverySubmissionId" INTEGER NULL;
        
        COMMENT ON COLUMN payments."deliverySubmissionId" IS 
        'ID of the delivery submission associated with this payment (for webhook processing)';
    END IF;
END $$;

-- Add mercadoPagoPaymentId to delivery_submissions table for payment tracking
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'delivery_submissions' AND column_name = 'mercadoPagoPaymentId') THEN
        ALTER TABLE delivery_submissions 
        ADD COLUMN "mercadoPagoPaymentId" VARCHAR(255) NULL;
        
        COMMENT ON COLUMN delivery_submissions."mercadoPagoPaymentId" IS 
        'ID of the MercadoPago payment/preference to track payment status';
    END IF;
END $$;

-- Note: The PENDING_PAYMENT enum value will be added automatically by TypeORM sync
-- This is because TypeORM manages enum types and will update them on startup
