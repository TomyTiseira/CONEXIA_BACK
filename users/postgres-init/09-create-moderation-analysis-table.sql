-- Crear tabla para almacenar análisis de moderación realizados por IA
-- Esta tabla consolida reportes de todos los microservicios (projects, services, publications)
CREATE TABLE IF NOT EXISTS reports_moderation_analysis (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  analyzed_report_ids TEXT[] NOT NULL,
  total_reports INTEGER NOT NULL DEFAULT 0,
  offensive_reports INTEGER NOT NULL DEFAULT 0,
  violation_reports INTEGER NOT NULL DEFAULT 0,
  classification VARCHAR(50) NOT NULL CHECK (classification IN ('Revisar', 'Banear')),
  ai_summary TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by INTEGER NULL,
  resolved_at TIMESTAMP NULL,
  resolution_action VARCHAR(50) NULL CHECK (resolution_action IN ('ban_user', 'release_user', 'keep_monitoring')),
  resolution_notes TEXT NULL,
  notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMP NULL
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_moderation_user_id ON reports_moderation_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_resolved ON reports_moderation_analysis(resolved);
CREATE INDEX IF NOT EXISTS idx_moderation_classification ON reports_moderation_analysis(classification);
CREATE INDEX IF NOT EXISTS idx_moderation_created_at ON reports_moderation_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_notified ON reports_moderation_analysis(notified, resolved);

-- Comentarios para documentar la tabla
COMMENT ON TABLE reports_moderation_analysis IS 'Almacena los análisis de moderación realizados por IA sobre reportes de usuarios de todos los microservicios';
COMMENT ON COLUMN reports_moderation_analysis.user_id IS 'ID del usuario reportado';
COMMENT ON COLUMN reports_moderation_analysis.analyzed_report_ids IS 'Array de IDs de reportes analizados (formato: "projects:1,services:2,publications:3")';
COMMENT ON COLUMN reports_moderation_analysis.total_reports IS 'Total de reportes analizados para este usuario';
COMMENT ON COLUMN reports_moderation_analysis.offensive_reports IS 'Cantidad de reportes clasificados como ofensivos/racistas';
COMMENT ON COLUMN reports_moderation_analysis.violation_reports IS 'Cantidad de reportes por incumplimiento de condiciones';
COMMENT ON COLUMN reports_moderation_analysis.classification IS 'Clasificación del análisis: Revisar o Banear';
COMMENT ON COLUMN reports_moderation_analysis.ai_summary IS 'Resumen generado por GPT sobre el análisis';
COMMENT ON COLUMN reports_moderation_analysis.resolved IS 'Indica si el análisis fue resuelto por un moderador';
COMMENT ON COLUMN reports_moderation_analysis.resolved_by IS 'ID del moderador que resolvió el análisis';
COMMENT ON COLUMN reports_moderation_analysis.resolved_at IS 'Fecha y hora en que se resolvió el análisis';
COMMENT ON COLUMN reports_moderation_analysis.resolution_action IS 'Acción tomada por el moderador';
COMMENT ON COLUMN reports_moderation_analysis.resolution_notes IS 'Notas adicionales del moderador';
COMMENT ON COLUMN reports_moderation_analysis.notified IS 'Indica si se notificó a los moderadores sobre este análisis';
COMMENT ON COLUMN reports_moderation_analysis.notified_at IS 'Fecha y hora en que se notificó';
