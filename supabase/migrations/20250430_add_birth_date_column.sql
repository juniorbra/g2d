-- Add birth_date column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'birth_date'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN birth_date DATE;
    END IF;
END $$;

-- Comment: This migration adds the birth_date column to the profiles table
-- if it doesn't already exist. This ensures compatibility with the profile page
-- which expects this column to be present.
