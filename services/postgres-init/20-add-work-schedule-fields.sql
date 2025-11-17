-- Agregar campos para información de horario de trabajo en cotizaciones
-- hours_per_day: Horas aproximadas de trabajo por día (ej: 2, 4, 8)
-- work_on_business_days_only: Si trabaja solo días hábiles (lunes a viernes)

ALTER TABLE service_hirings 
ADD COLUMN IF NOT EXISTS hours_per_day DECIMAL(5,2) NULL,
ADD COLUMN IF NOT EXISTS work_on_business_days_only BOOLEAN DEFAULT false;

COMMENT ON COLUMN service_hirings.hours_per_day IS 
'Horas aproximadas de trabajo por día. Ayuda al cliente a estimar la dedicación diaria del proveedor.';

COMMENT ON COLUMN service_hirings.work_on_business_days_only IS 
'Indica si el proveedor trabaja solo en días hábiles (lunes a viernes). Diferente de isBusinessDays que aplica a la validez de la cotización.';
