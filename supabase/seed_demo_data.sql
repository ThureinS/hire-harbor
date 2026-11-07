-- ==============================================================================
-- Hire Harbor: Complete RLS Setup & Demo Data Seed Script
-- Project: mrodzrcmqdjadtkdslvx (or any Hire Harbor Supabase project)
-- Paste this script into Supabase SQL Editor -> New Query -> Run
-- ==============================================================================

-- ==============================================================================
-- 1. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on core tables
ALTER TABLE IF EXISTS companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS saved_jobs ENABLE ROW LEVEL SECURITY;

-- 1.1 Companies Policies
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON companies;
CREATE POLICY "Companies are viewable by everyone"
  ON companies FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 1.2 Jobs Policies
DROP POLICY IF EXISTS "Anyone can view jobs" ON jobs;
CREATE POLICY "Anyone can view jobs"
  ON jobs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create jobs" ON jobs;
CREATE POLICY "Authenticated users can create jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt()->>'sub') = recruiter_id);

DROP POLICY IF EXISTS "Users can update their own jobs" ON jobs;
CREATE POLICY "Users can update their own jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING ((auth.jwt()->>'sub') = recruiter_id)
  WITH CHECK ((auth.jwt()->>'sub') = recruiter_id);

DROP POLICY IF EXISTS "Users can delete their own jobs" ON jobs;
CREATE POLICY "Users can delete their own jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING ((auth.jwt()->>'sub') = recruiter_id);

-- 1.3 Saved Jobs Policies
DROP POLICY IF EXISTS "Users can view their own saved jobs" ON saved_jobs;
CREATE POLICY "Users can view their own saved jobs"
  ON saved_jobs FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'sub') = user_id);

DROP POLICY IF EXISTS "Users can save jobs" ON saved_jobs;
CREATE POLICY "Users can save jobs"
  ON saved_jobs FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt()->>'sub') = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved jobs" ON saved_jobs;
CREATE POLICY "Users can delete their own saved jobs"
  ON saved_jobs FOR DELETE
  TO authenticated
  USING ((auth.jwt()->>'sub') = user_id);

-- 1.4 Applications Policies
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


-- ==============================================================================
-- 2. SEED COMPANIES (Idempotent: skips existing companies)
-- ==============================================================================

INSERT INTO companies (name, logo_url)
SELECT c.name, c.logo_url
FROM (VALUES
  ('Google', '/companies/google.webp'),
  ('Meta', '/companies/meta.svg'),
  ('Netflix', '/companies/netflix.png'),
  ('Amazon', '/companies/amazon.svg'),
  ('Microsoft', '/companies/microsoft.webp'),
  ('Atlassian', '/companies/atlassian.svg'),
  ('Uber', '/companies/uber.svg'),
  ('Harbor Labs', '/logo.png')
) AS c(name, logo_url)
WHERE NOT EXISTS (
  SELECT 1 FROM companies WHERE companies.name = c.name
);


-- ==============================================================================
-- 3. SEED JOBS (Idempotent: linked to Demo Recruiter user_3Lmtb8odq0sdFdaKX8McP4p7HqU)
-- ==============================================================================

INSERT INTO jobs (title, description, location, company_id, recruiter_id, requirements, "isOpen")
SELECT
  j.title,
  j.description,
  j.location,
  (SELECT id FROM companies WHERE name = j.company_name LIMIT 1),
  j.recruiter_id,
  j.requirements,
  j."isOpen"
FROM (VALUES
(
  'Staff Frontend Engineer (Design Systems)',
  'Lead our core design system initiative across web applications using React 19, TypeScript, and modern CSS.',
  'Remote',
  'Google',
  'user_3Lmtb8odq0sdFdaKX8McP4p7HqU',
  $req$### Requirements
- 6+ years specialized frontend experience with React.
- Deep expertise in Design Systems and web accessibility.
- Experience leading architectural RFCs.$req$,
  true
),
(
  'Senior Full Stack Engineer',
  'Build scalable candidate matching workflows, high-throughput search infrastructure, and messaging.',
  'Thailand',
  'Meta',
  'user_3Lmtb8odq0sdFdaKX8McP4p7HqU',
  $req$### Requirements
- 4+ years full-stack engineering experience.
- Strong proficiency with TypeScript, React, and PostgreSQL.
- Solid grasp of REST and GraphQL APIs.$req$,
  true
),
(
  'Lead Cloud Infrastructure Architect',
  'Architect and scale cloud-native services across AWS and distributed Kubernetes clusters.',
  'Singapore',
  'Amazon',
  'user_3Lmtb8odq0sdFdaKX8McP4p7HqU',
  $req$### Requirements
- 7+ years in Cloud Infrastructure and DevOps.
- Hands-on mastery of AWS, Terraform, and Docker.
- Experience with CI/CD automation and disaster recovery.$req$,
  true
),
(
  'Senior Distributed Systems Engineer (Go)',
  'Design and operate global telemetry and streaming pipelines handling millions of events per second.',
  'Germany',
  'Netflix',
  'user_3Lmtb8odq0sdFdaKX8McP4p7HqU',
  $req$### Requirements
- 5+ years of software engineering in Go or Rust.
- Proven track record building distributed data pipelines.
- Strong understanding of concurrency and network protocols.$req$,
  true
),
(
  'Senior Mobile Engineer (React Native)',
  'Build fluid, offline-first mobile applications across iOS and Android.',
  'Thailand',
  'Uber',
  'user_3Lmtb8odq0sdFdaKX8McP4p7HqU',
  $req$### Requirements
- 4+ years building production React Native applications.
- Experience with native device APIs and push notifications.
- Strong focus on 60fps animations and local storage sync.$req$,
  true
),
(
  'Product Security Engineer',
  'Drive threat modeling, secure code reviews, automated scanning, and bug bounty remediation.',
  'United States',
  'Atlassian',
  'user_3Lmtb8odq0sdFdaKX8McP4p7HqU',
  $req$### Requirements
- 4+ years in application security and penetration testing.
- Proficiency in identifying OWASP Top 10 vulnerabilities.
- Experience writing security automation scripts.$req$,
  true
),
(
  'Applied AI / ML Engineer',
  'Integrate frontier LLMs and vector search embeddings into software tools and enterprise automation.',
  'Japan',
  'Microsoft',
  'user_3Lmtb8odq0sdFdaKX8McP4p7HqU',
  $req$### Requirements
- 3+ years working with machine learning models.
- Practical experience with PyTorch and vector databases.
- Strong software engineering practices for low-latency APIs.$req$,
  true
),
(
  'Frontend Engineer (Harbor Bold Core)',
  'Join the Harbor Labs core crew to expand our job marketplace UI and craft data-dense interfaces.',
  'Remote',
  'Harbor Labs',
  'user_3Lmtb8odq0sdFdaKX8McP4p7HqU',
  $req$### Requirements
- 3+ years in modern React frontend engineering.
- Passion for typography, dark mode aesthetics, and clean layouts.
- Experience with Tailwind CSS and Radix UI.$req$,
  true
)
) AS j(title, description, location, company_name, recruiter_id, requirements, "isOpen")
WHERE NOT EXISTS (
  SELECT 1 FROM jobs
  WHERE jobs.title = j.title
  AND jobs.recruiter_id = j.recruiter_id
);
