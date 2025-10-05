-- Conectar a la base de datos users_db
\c users_db;

-- Actualizar registros existentes que tengan alias NULL con un valor temporal
-- (esto es por si hay registros antiguos sin alias)
UPDATE payment_accounts 
SET alias = CONCAT('alias_', id) 
WHERE alias IS NULL;

-- Hacer la columna alias NOT NULL
ALTER TABLE payment_accounts 
ALTER COLUMN alias SET NOT NULL;

-- Comentario descriptivo
COMMENT ON COLUMN payment_accounts.alias IS 'Alias de la cuenta bancaria o digital (obligatorio)';
