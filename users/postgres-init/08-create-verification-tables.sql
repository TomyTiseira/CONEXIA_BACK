-- Migration: Add identity verification tables and fields
-- Date: 2025-10-22
-- Description: Adds verified field to users table and creates user_verifications table
--              for tracking identity verification attempts with AWS Rekognition and Textract

-- Add verified field to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'verified') THEN
        ALTER TABLE users 
        ADD COLUMN verified BOOLEAN DEFAULT FALSE;
        
        COMMENT ON COLUMN users.verified IS 
        'Indica si el usuario ha verificado su identidad correctamente usando AWS Rekognition y Textract';
    END IF;
END $$;

-- Create user_verifications table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'user_verifications') THEN
        CREATE TABLE user_verifications (
            "verificationId" SERIAL PRIMARY KEY,
            "userId" INTEGER NOT NULL,
            "documentNumberExtracted" VARCHAR(255),
            "documentNumberMatch" BOOLEAN DEFAULT FALSE,
            "similarityScore" FLOAT,
            "matchResult" BOOLEAN DEFAULT FALSE,
            "documentType" VARCHAR(50),
            "errorMessage" TEXT,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_user_verification_user
                FOREIGN KEY("userId") 
                REFERENCES users(id)
                ON DELETE CASCADE
        );
        
        -- Create indexes
        CREATE INDEX idx_user_verifications_userId ON user_verifications("userId");
        CREATE INDEX idx_user_verifications_createdAt ON user_verifications("createdAt");
        
        -- Add table and column comments
        COMMENT ON TABLE user_verifications IS 
        'Almacena el historial de intentos de verificación de identidad de usuarios';
        
        COMMENT ON COLUMN user_verifications."verificationId" IS 
        'ID único de la verificación';
        
        COMMENT ON COLUMN user_verifications."userId" IS 
        'ID del usuario que realizó la verificación';
        
        COMMENT ON COLUMN user_verifications."documentNumberExtracted" IS 
        'Número de documento extraído del DNI/Pasaporte usando OCR (AWS Textract)';
        
        COMMENT ON COLUMN user_verifications."documentNumberMatch" IS 
        'Indica si el número extraído coincide con el registrado en el perfil del usuario';
        
        COMMENT ON COLUMN user_verifications."similarityScore" IS 
        'Porcentaje de similitud facial entre documento y selfie (0-100) calculado por AWS Rekognition';
        
        COMMENT ON COLUMN user_verifications."matchResult" IS 
        'Resultado final de la verificación (true si pasó todas las validaciones: número coincide y similitud >= 90%)';
        
        COMMENT ON COLUMN user_verifications."documentType" IS 
        'Tipo de documento utilizado (DNI, Pasaporte, etc.)';
        
        COMMENT ON COLUMN user_verifications."errorMessage" IS 
        'Mensaje de error descriptivo si la verificación falló';
        
        COMMENT ON COLUMN user_verifications."createdAt" IS 
        'Fecha y hora en que se realizó el intento de verificación';
    END IF;
END $$;

-- Create index on users.verified for query optimization
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE indexname = 'idx_users_verified') THEN
        CREATE INDEX idx_users_verified ON users(verified);
    END IF;
END $$;
