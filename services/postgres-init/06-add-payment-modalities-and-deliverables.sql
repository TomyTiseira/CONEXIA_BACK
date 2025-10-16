-- Migration: Add payment modalities and deliverables support
-- Date: 2025-01-23
-- Description: Adds support for different payment modalities and deliverables in service hirings

-- Create payment_modalities table
CREATE TABLE IF NOT EXISTS payment_modalities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    "initialPaymentPercentage" INTEGER,
    "finalPaymentPercentage" INTEGER,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default payment modalities
INSERT INTO payment_modalities (name, code, description, "initialPaymentPercentage", "finalPaymentPercentage") 
VALUES 
    ('Pago total al finalizar', 'full_payment', 'Pago completo al finalizar el servicio. Se cobra 25% al aceptar y 75% al completar.', 25, 75),
    ('Pago por entregables', 'by_deliverables', 'Pago fraccionado según entregables definidos. Se paga cada entregable al ser aprobado.', NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- Add payment_modality_id to service_hirings table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_hirings' AND column_name = 'payment_modality_id') THEN
        ALTER TABLE service_hirings 
        ADD COLUMN payment_modality_id INTEGER REFERENCES payment_modalities(id);
    END IF;
END $$;

-- Create deliverables table
CREATE TABLE IF NOT EXISTS deliverables (
    id SERIAL PRIMARY KEY,
    hiring_id INTEGER NOT NULL REFERENCES service_hirings(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    "estimatedDeliveryDate" DATE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    "deliveredAt" TIMESTAMP NULL,
    "approvedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on hiring_id for better query performance
CREATE INDEX IF NOT EXISTS idx_deliverables_hiring_id ON deliverables(hiring_id);

-- Create trigger for updating updatedAt timestamp on payment_modalities
CREATE TRIGGER update_payment_modalities_updated_at 
    BEFORE UPDATE ON payment_modalities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updating updatedAt timestamp on deliverables
CREATE TRIGGER update_deliverables_updated_at 
    BEFORE UPDATE ON deliverables 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
