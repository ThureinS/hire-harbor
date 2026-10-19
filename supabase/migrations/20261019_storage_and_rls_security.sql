-- Hire Harbor: Production Storage & Database RLS Security Migration
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ============================================================================
-- 1. DATABASE CONSTRAINTS & APPLICATION INTEGRITY
-- ============================================================================

-- Prevent duplicate applications to the same job by the same candidate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_candidate_job_application'
  ) THEN
    ALTER TABLE applications ADD CONSTRAINT unique_candidate_job_application UNIQUE (job_id, candidate_id);
  END IF;
END $$;

-- Trigger to prevent tampering with candidate's submitted application data
-- Only status can be updated once submitted
CREATE OR REPLACE FUNCTION check_application_update_integrity()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.candidate_id <> NEW.candidate_id OR
      OLD.job_id <> NEW.job_id OR
      OLD.resume <> NEW.resume OR
      OLD.skills <> NEW.skills OR
      OLD.experience <> NEW.experience OR
      OLD.education <> NEW.education OR
      OLD.name <> NEW.name) THEN
    RAISE EXCEPTION 'Only application status may be updated after submission.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_application_update_integrity ON applications;
CREATE TRIGGER trg_application_update_integrity
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION check_application_update_integrity();

-- ============================================================================
-- 2. HARDENED DATABASE RLS POLICIES
-- ============================================================================

-- Ensure RLS is active on all core tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- 2.1 Applications table policies
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'sub') = candidate_id);

DROP POLICY IF EXISTS "Recruiters can view applications for their jobs" ON applications;
CREATE POLICY "Recruiters can view applications for their jobs"
  ON applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = (auth.jwt()->>'sub')
    )
  );

DROP POLICY IF EXISTS "Users can create applications" ON applications;
DROP POLICY IF EXISTS "Candidates can only apply to open jobs" ON applications;
CREATE POLICY "Candidates can only apply to open jobs"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'sub') = candidate_id AND
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs."isOpen" = true
    )
  );

DROP POLICY IF EXISTS "Recruiters can update applications for their jobs" ON applications;
CREATE POLICY "Recruiters can update applications for their jobs"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = (auth.jwt()->>'sub')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = (auth.jwt()->>'sub')
    )
  );

-- ============================================================================
-- 3. STORAGE BUCKETS CONFIGURATION
-- ============================================================================

-- 3.1 Configure buckets (ensure company-logo is public and resumes is private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('company-logo', 'company-logo', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('resumes', 'resumes', false, 5242880, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 4. STORAGE RLS POLICIES (storage.objects)
-- ============================================================================

-- 4.1 Company Logo bucket policies
DROP POLICY IF EXISTS "Public can read company logos" ON storage.objects;
DROP POLICY IF EXISTS "Company logos are publicly accessible" ON storage.objects;
CREATE POLICY "Company logos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logo');

DROP POLICY IF EXISTS "Authenticated users can upload company logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload company logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-logo');

-- 4.2 Resumes bucket policies (Private & Authenticated Access)
-- Drop legacy permissive QA policies
DROP POLICY IF EXISTS "Public can read resumes for QA" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload resumes" ON storage.objects;
-- Candidates can upload their resume (named resume-<random>-<candidate_id>.<ext>)
DROP POLICY IF EXISTS "Candidates can upload their own resume" ON storage.objects;
CREATE POLICY "Candidates can upload their own resume"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes' AND
    (auth.jwt()->>'sub') IS NOT NULL AND
    storage.objects.name LIKE '%-' || (auth.jwt()->>'sub') || '%'
  );

-- Authorized download policy (Candidate owner OR Recruiter of the job)
DROP POLICY IF EXISTS "Authorized candidates and recruiters can download resumes" ON storage.objects;
CREATE POLICY "Authorized candidates and recruiters can download resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes' AND (
      -- Match candidate application
      EXISTS (
        SELECT 1 FROM applications
        WHERE applications.candidate_id = (auth.jwt()->>'sub')
        AND (
          applications.resume = storage.objects.name OR
          applications.resume LIKE '%' || storage.objects.name
        )
      )
      OR
      -- Match recruiter of the applied job
      EXISTS (
        SELECT 1 FROM applications
        JOIN jobs ON jobs.id = applications.job_id
        WHERE jobs.recruiter_id = (auth.jwt()->>'sub')
        AND (
          applications.resume = storage.objects.name OR
          applications.resume LIKE '%' || storage.objects.name
        )
      )
      OR
      -- Match recently uploaded file before application insertion completes
      storage.objects.name LIKE '%-' || (auth.jwt()->>'sub') || '%'
    )
  );

-- Cleanup policy (Candidate can delete their uploaded file on insert error)
DROP POLICY IF EXISTS "Candidates can delete their uploaded resumes" ON storage.objects;
CREATE POLICY "Candidates can delete their uploaded resumes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes' AND
    storage.objects.name LIKE '%-' || (auth.jwt()->>'sub') || '%'
  );
