-- Migration: Create subscriptions table
-- Date: 2024-01-15
-- Description: Tabla para gestionar suscripciones de usuarios a planes

-- Enum para estados de suscripción
CREATE TYPE subscription_status AS ENUM (
  'pending_payment',
  'active',
  'payment_failed',
  'cancelled',
  'expired',
  'replaced'
);

-- Enum para ciclos de facturación
CREATE TYPE billing_cycle AS ENUM (
  'monthly',
  'annual'
);

-- Crear tabla de suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  
  -- Relaciones
  "userId" INTEGER NOT NULL,
  "planId" INTEGER NOT NULL,
  
  -- Estado y configuración
  status subscription_status NOT NULL DEFAULT 'pending_payment',
  "billingCycle" billing_cycle NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  "autoRenew" BOOLEAN NOT NULL DEFAULT TRUE,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  
  -- Fechas de suscripción
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "paidAt" TIMESTAMP,
  
  -- Datos de MercadoPago
  "preferenceId" VARCHAR(255),
  "paymentId" VARCHAR(255),
  "mercadoPagoSubscriptionId" VARCHAR(255),
  "paymentStatus" VARCHAR(50),
  "paymentStatusDetail" VARCHAR(255),
  "nextPaymentDate" TIMESTAMP,
  
  -- Reemplazo de suscripción (para upgrades/downgrades)
  "replacesSubscriptionId" INTEGER,
  
  -- Auditoría
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Foreign Keys
  CONSTRAINT fk_subscription_plan 
    FOREIGN KEY ("planId") 
    REFERENCES plans(id) 
    ON DELETE RESTRICT,
  
  CONSTRAINT fk_subscription_replaces 
    FOREIGN KEY ("replacesSubscriptionId") 
    REFERENCES subscriptions(id) 
    ON DELETE SET NULL
);

-- Índices para mejorar performance
CREATE INDEX idx_subscriptions_userId ON subscriptions("userId");
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_planId ON subscriptions("planId");
CREATE INDEX idx_subscriptions_preferenceId ON subscriptions("preferenceId");
CREATE INDEX idx_subscriptions_paymentId ON subscriptions("paymentId");
CREATE INDEX idx_subscriptions_mercadoPagoSubscriptionId ON subscriptions("mercadoPagoSubscriptionId");
CREATE INDEX idx_subscriptions_endDate ON subscriptions("endDate");
CREATE INDEX idx_subscriptions_active_user ON subscriptions("userId", status) 
  WHERE status = 'active';

-- Índice compuesto para búsquedas frecuentes
CREATE INDEX idx_subscriptions_user_status_dates 
  ON subscriptions("userId", status, "endDate");

-- Función para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updatedAt
CREATE TRIGGER trigger_update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Comentarios en la tabla
COMMENT ON TABLE subscriptions IS 'Tabla de suscripciones de usuarios a planes de membresía';
COMMENT ON COLUMN subscriptions.id IS 'ID único de la suscripción';
COMMENT ON COLUMN subscriptions."userId" IS 'ID del usuario que contrató el plan';
COMMENT ON COLUMN subscriptions."planId" IS 'ID del plan contratado';
COMMENT ON COLUMN subscriptions.status IS 'Estado actual de la suscripción';
COMMENT ON COLUMN subscriptions."billingCycle" IS 'Ciclo de facturación: mensual o anual';
COMMENT ON COLUMN subscriptions.price IS 'Precio pagado por esta suscripción (en pesos)';
COMMENT ON COLUMN subscriptions."autoRenew" IS 'Si la suscripción se renueva automáticamente';
COMMENT ON COLUMN subscriptions."retryCount" IS 'Cantidad de reintentos de pago fallidos';
COMMENT ON COLUMN subscriptions."startDate" IS 'Fecha de inicio de la suscripción';
COMMENT ON COLUMN subscriptions."endDate" IS 'Fecha de finalización de la suscripción';
COMMENT ON COLUMN subscriptions."paidAt" IS 'Fecha en que se confirmó el pago';
COMMENT ON COLUMN subscriptions."preferenceId" IS 'ID de preferencia de MercadoPago';
COMMENT ON COLUMN subscriptions."paymentId" IS 'ID de pago de MercadoPago';
COMMENT ON COLUMN subscriptions."mercadoPagoSubscriptionId" IS 'ID de suscripción (preapproval) en MercadoPago para cobros recurrentes';
COMMENT ON COLUMN subscriptions."paymentStatus" IS 'Estado del pago en MercadoPago';
COMMENT ON COLUMN subscriptions."paymentStatusDetail" IS 'Detalle del estado del pago';
COMMENT ON COLUMN subscriptions."nextPaymentDate" IS 'Fecha del próximo cobro automático';
COMMENT ON COLUMN subscriptions."replacesSubscriptionId" IS 'ID de la suscripción que esta reemplaza (upgrade/downgrade)';

-- Datos de ejemplo (opcional - solo para desarrollo)
-- Insertar suscripción de prueba
-- INSERT INTO subscriptions (
--   "userId", 
--   "planId", 
--   status, 
--   "billingCycle", 
--   price, 
--   "startDate", 
--   "endDate"
-- ) VALUES (
--   1, 
--   1, 
--   'active', 
--   'monthly', 
--   9999.00,
--   NOW(),
--   NOW() + INTERVAL '1 month'
-- );

-- Verificar creación
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Verificar índices
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'subscriptions';

COMMIT;
