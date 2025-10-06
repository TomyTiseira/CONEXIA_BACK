-- Migración para agregar campos de método de pago de MercadoPago
-- Ejecutar en la base de datos services_db

ALTER TABLE payments 
ADD COLUMN mercado_pago_payment_method_id VARCHAR(255) NULL,
ADD COLUMN mercado_pago_payment_type_id VARCHAR(255) NULL;

-- Opcional: Comentarios para explicar los campos
COMMENT ON COLUMN payments.mercado_pago_payment_method_id IS 'ID del método de pago de MercadoPago (ej: visa, master, account_money)';
COMMENT ON COLUMN payments.mercado_pago_payment_type_id IS 'Tipo de pago de MercadoPago (ej: credit_card, debit_card, account_money)';