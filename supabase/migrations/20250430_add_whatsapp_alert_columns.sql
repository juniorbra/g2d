-- Add WhatsApp alert columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN wa_alert TEXT,
ADD COLUMN wagroup_alert TEXT;

-- Comment: These columns were added to store WhatsApp alert settings
-- wa_alert: For individual WhatsApp alerts
-- wagroup_alert: For WhatsApp group alerts
