-- Add wa_number column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'wa_number'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN wa_number TEXT;
    END IF;
END $$;

-- Comment: This migration adds the wa_number column to the profiles table
-- to separate WhatsApp number from the general phone number.
-- wa_number: For storing the WhatsApp number from the WhatsApp page
-- phone: For storing the general phone number from the Profile page
