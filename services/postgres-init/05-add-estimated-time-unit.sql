-- Add estimatedTimeUnit column to service_hirings table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_hirings' AND column_name = 'estimatedTimeUnit') THEN
        ALTER TABLE service_hirings ADD COLUMN "estimatedTimeUnit" VARCHAR(20) NULL;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_service_hirings_estimated_time_unit 
        ON service_hirings("estimatedTimeUnit");
        
        -- Add constraint to ensure valid enum values
        ALTER TABLE service_hirings 
        ADD CONSTRAINT chk_estimated_time_unit 
        CHECK ("estimatedTimeUnit" IN ('hours', 'days', 'weeks', 'months'));
    END IF;
END $$;