-- Add phone column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN phone TEXT;
    END IF;
END $$;

-- Comment: This migration adds the phone column to the profiles table
-- if it doesn't already exist. This ensures compatibility with the profile page
-- which expects this column to be present.
