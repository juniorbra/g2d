-- Add address column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'address'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN address TEXT;
    END IF;
END $$;

-- Comment: This migration adds the address column to the profiles table
-- if it doesn't already exist. This ensures compatibility with the profile page
-- which expects this column to be present.
