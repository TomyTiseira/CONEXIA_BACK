-- Migration: Add 'revision_requested' status to deliverable_status enum
-- Date: 2025-10-20
-- Description: Adds 'revision_requested' status to the deliverable_status enum
--              so that deliverables can be marked as needing revision when the client
--              requests changes to a specific deliverable submission.

-- Add 'revision_requested' to the deliverable_status enum if it doesn't exist
DO $$
BEGIN
    -- Check if the enum value already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'revision_requested' 
        AND enumtypid = (
            SELECT oid 
            FROM pg_type 
            WHERE typname = 'deliverables_status_enum'
        )
    ) THEN
        -- Add the new enum value
        ALTER TYPE deliverables_status_enum ADD VALUE 'revision_requested';
        RAISE NOTICE '✅ Added revision_requested to deliverables_status_enum';
    ELSE
        RAISE NOTICE '⚠️ revision_requested already exists in deliverables_status_enum';
    END IF;
END $$;

-- Verify the change
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'revision_requested' 
        AND enumtypid = (
            SELECT oid 
            FROM pg_type 
            WHERE typname = 'deliverables_status_enum'
        )
    ) THEN
        RAISE NOTICE '✅ Migration completed successfully';
    ELSE
        RAISE EXCEPTION '❌ Migration failed - revision_requested not found in deliverables_status_enum';
    END IF;
END $$;
