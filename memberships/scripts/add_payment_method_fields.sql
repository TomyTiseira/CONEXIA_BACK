-- Migración para agregar campos de información de método de pago a subscriptions
-- Fecha: 2025-11-10
-- Descripción: Agrega campos para almacenar información del método de pago (tipo, últimos 4 dígitos y marca de tarjeta)

-- Agregar columna para el tipo de método de pago (credit_card, debit_card, etc.)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(50) NULL;

-- Agregar columna para los últimos 4 dígitos de la tarjeta
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS card_last_four_digits VARCHAR(4) NULL;

-- Agregar columna para la marca de la tarjeta (visa, mastercard, etc.)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS card_brand VARCHAR(50) NULL;

-- Comentarios para documentación
COMMENT ON COLUMN subscriptions.payment_method_type IS 'Tipo de método de pago utilizado (credit_card, debit_card, etc.)';
COMMENT ON COLUMN subscriptions.card_last_four_digits IS 'Últimos 4 dígitos de la tarjeta de crédito/débito';
COMMENT ON COLUMN subscriptions.card_brand IS 'Marca de la tarjeta (visa, mastercard, amex, etc.)';
