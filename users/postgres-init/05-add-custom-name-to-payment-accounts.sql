-- Conectar a la base de datos users_db
\c users_db;

-- Agregar columna customName a la tabla payment_accounts
ALTER TABLE payment_accounts 
ADD COLUMN IF NOT EXISTS "customName" VARCHAR NULL;

-- Comentario descriptivo de la columna
COMMENT ON COLUMN payment_accounts."customName" IS 'Nombre personalizado que el usuario asigna a la cuenta para identificarla fácilmente (ej: "Cuenta Mercado Pago de Juan")';
