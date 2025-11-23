-- Migration: Consolidate SchoolBranding into SystemSettings
-- This migration adds branding fields to SystemSettings and migrates data from SchoolBranding

-- Add new columns to system_settings table
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#8b5cf6';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS accent_color TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS email_logo TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS email_footer TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS email_signature TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS letterhead_logo TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS letterhead_text TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS document_footer TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Migrate data from school_branding to system_settings (if school_branding exists and has active record)
DO $$
DECLARE
    branding_record RECORD;
    settings_record RECORD;
BEGIN
    -- Check if school_branding table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'school_branding') THEN
        -- Get the active branding record
        SELECT * INTO branding_record FROM school_branding WHERE is_active = true ORDER BY created_at DESC LIMIT 1;
        
        IF FOUND THEN
            -- Get the system settings record
            SELECT * INTO settings_record FROM system_settings LIMIT 1;
            
            IF FOUND THEN
                -- Update system_settings with branding data
                UPDATE system_settings
                SET
                    school_name = COALESCE(branding_record.school_name, school_name),
                    tagline = branding_record.tagline,
                    school_logo = COALESCE(branding_record.logo, school_logo),
                    favicon_url = COALESCE(branding_record.favicon, favicon_url),
                    primary_color = COALESCE(branding_record.primary_color, primary_color),
                    secondary_color = COALESCE(branding_record.secondary_color, '#8b5cf6'),
                    accent_color = branding_record.accent_color,
                    email_logo = branding_record.email_logo,
                    email_footer = branding_record.email_footer,
                    email_signature = branding_record.email_signature,
                    letterhead_logo = branding_record.letterhead_logo,
                    letterhead_text = branding_record.letterhead_text,
                    document_footer = branding_record.document_footer,
                    school_address = COALESCE(branding_record.address, school_address),
                    school_phone = COALESCE(branding_record.phone, school_phone),
                    school_email = COALESCE(branding_record.email, school_email),
                    school_website = COALESCE(branding_record.website, school_website),
                    facebook_url = branding_record.facebook_url,
                    twitter_url = branding_record.twitter_url,
                    linkedin_url = branding_record.linkedin_url,
                    instagram_url = branding_record.instagram_url
                WHERE id = settings_record.id;
                
                RAISE NOTICE 'Successfully migrated branding data to system_settings';
            END IF;
        END IF;
    END IF;
END $$;

-- Note: We're keeping the school_branding table for now but marking it as deprecated
-- It can be dropped in a future migration after verifying the data migration was successful
