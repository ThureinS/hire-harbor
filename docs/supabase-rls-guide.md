# Supabase Storage & Database Security Guide

This guide explains how to configure Supabase Storage bucket visibility and Row Level Security (RLS) policies for **Hire Harbor** production readiness.

The companion SQL migration file is located at:
[`supabase/migrations/20261019_storage_and_rls_security.sql`](file:///Users/thureinsoe/Learning/uniProject/hire-harbor/supabase/migrations/20261019_storage_and_rls_security.sql)

---

## 1. Apply the SQL Migration

1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/_/sql).
2. Navigate to **SQL Editor** -> **New query**.
3. Copy the contents of `supabase/migrations/20261019_storage_and_rls_security.sql` and click **Run**.

---

## 2. Verify Storage Bucket Visibility

In the Supabase Dashboard, navigate to **Storage** -> **Buckets**:

| Bucket Name | Public Visibility | Size Limit | Allowed MIME Types | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `company-logo` | **Public** ✅ | 2 MiB | `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml` | Company branding images rendered publicly on job cards |
| `resumes` | **Private** 🔒 | 5 MiB | `application/pdf`, `application/msword`, `.docx` | Candidate CVs/resumes protected by signed URLs |

> [!IMPORTANT]
> If your `resumes` bucket was previously set to **Public**, toggle it to **Private** under Bucket Settings.
> Hire Harbor's frontend now uses `getResumeSignedUrl()` to generate time-limited signed URLs (1 hour validity), so private bucket access is fully supported.

---

## 3. Security Protections Enforced

### A. Resume Access & Storage Security
- **Strict Upload Authorization**: Users can only upload files matching their Clerk user ID (`resume-<random>-<candidate_id>.<ext>`).
- **Authorized Download Only**: Only the candidate who submitted the application OR the recruiter who posted that specific job can download the resume.
- **Rollback Cleanup**: If network issues or database constraints abort application submission, candidates have permission to clean up their uploaded file.

### B. Application Integrity & Anti-Tampering
- **Duplicate Prevention**: A unique constraint (`unique_candidate_job_application`) prevents candidates from submitting multiple applications to the same job.
- **Closed Job Protection**: Candidates can only submit applications to listings where `"isOpen" = true`.
- **Field Tampering Prevention**: A database trigger (`trg_application_update_integrity`) ensures recruiters can only update the `status` field; candidate details (`skills`, `experience`, `education`, `resume`, `candidate_id`) are immutable.
