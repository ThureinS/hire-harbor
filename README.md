# HireHarbor

A modern, full-featured job board platform built with React and Supabase. HireHarbor connects job seekers with employers, offering an intuitive interface for browsing, applying, and managing job listings.

> **Note**: This is a learning project developed as part of a tutorial to practice modern web development technologies.

Current implementation status and remaining release gates are tracked in [CONTEXT.md](CONTEXT.md) and [the release-readiness review](docs/release-readiness.md). A passing build does not establish production readiness.

## 🚀 Live Demo

Check out the live application: [https://hire-harbor-roan.vercel.app/](https://hire-harbor-roan.vercel.app/)

## ✨ Features

### For Job Seekers

- **Browse Jobs**: View available job listings with search and filter capabilities
- **Advanced Search**: Filter jobs by location, company, or search by title
- **Pagination**: Efficiently navigate through large numbers of job listings
- **Save Jobs**: Bookmark interesting positions for later review
- **Apply to Jobs**: Submit applications with resume upload
- **Track Applications**: View all submitted applications in one place
- **Dark Mode**: Eye-friendly dark theme with theme persistence

### For Recruiters

- **Post Jobs**: Create detailed job listings with markdown support
- **Manage Jobs**: View and delete your posted positions, and change hiring status
- **Company Management**: Add and manage company profiles with logo uploads
- **Toggle Hiring Status**: Open or close job postings as needed
- **View Applications**: Review all applications for your posted jobs
- **Update Application Status**: Track candidate progress through the hiring pipeline

### General Features

- **User Authentication**: Secure login and signup via Clerk
- **Role-based Access**: Different interfaces for recruiters and candidates
- **Onboarding Flow**: Guided setup for new users
- **Responsive Design**: Optimized for desktop and mobile devices
- **Protected Routes**: Secure pages requiring authentication

## 🛠️ Tech Stack

### Frontend

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router v7** - Client-side routing
- **Tailwind CSS v4** - Utility-first styling
- **Shadcn/ui** - Reusable component library
- **Radix UI** - Accessible primitives

### Backend & Services

- **Supabase** - PostgreSQL database and file storage
- **Clerk** - User authentication and management

### Key Libraries

- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Lucide React** - Icon library
- **Embla Carousel** - Carousel functionality
- **React MD Editor** - Markdown editor for job descriptions
- **Country State City** - Location data

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (20.19+ on Node 20, or 22.12+; required by the installed Vite 7 version)
- **npm** or **yarn**
- A **Supabase** account ([supabase.com](https://supabase.com))
- A **Clerk** account ([clerk.com](https://clerk.com))

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd HireHarbor
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Set Up Supabase

#### Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings → API

#### Create Database Tables

The SQL below is a starting schema for a new disposable environment, not a versioned production migration or a dump of the existing QA database. Do not rerun it against an existing database without reviewing its current schema and policies.

Run the following SQL in your new Supabase project's SQL Editor:

```sql
-- Companies table
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  recruiter_id TEXT NOT NULL,
  requirements TEXT,
  "isOpen" BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL,
  status TEXT DEFAULT 'applied',
  resume TEXT NOT NULL,
  skills TEXT,
  experience INTEGER,
  education TEXT,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved Jobs table
CREATE TABLE saved_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_saved_jobs_user ON saved_jobs(user_id);
```

#### Create Storage Buckets

1. Go to Storage in your Supabase dashboard
2. Create the following buckets:

**For Learning/Demo (Current Setup):**

- `company-logo` - **Public** ✅
- `resumes` - **Public** ⚠️

> [!CAUTION] > **Security Warning**: Public resume bucket means anyone with the URL can view uploaded resumes. Only use this setup with fake/test data. Never upload real resumes containing personal information.

**For Production (Recommended):**

- `company-logo` - **Public** ✅
- `resumes` - **Private** (requires authenticated access)

Private storage is implemented in the app: `apiApplication.js` persists object paths and `application-card.jsx` requests fresh signed URLs (`getResumeSignedUrl`) with 1-hour expiry on download, with backwards-compatible fallback for legacy public files.

To configure private storage and hardened RLS policies in Supabase, execute the SQL migration script:
[`supabase/migrations/20261019_storage_and_rls_security.sql`](file:///Users/thureinsoe/Learning/uniProject/hire-harbor/supabase/migrations/20261019_storage_and_rls_security.sql)

See the full setup guide in [`docs/supabase-rls-guide.md`](file:///Users/thureinsoe/Learning/uniProject/hire-harbor/docs/supabase-rls-guide.md).

#### Set Up Row Level Security (RLS)

> [!IMPORTANT]
> These policies are illustrative ownership checks, not a complete production authorization design. They have not been compared with the deployed QA policies in the current review. Verify cross-account denial, recruiter permissions, application constraints, and storage policies before deploying with real data.

Enable RLS on all tables:

```sql
-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
```

**Companies Policies:**

```sql
-- Anyone can view companies
CREATE POLICY "Companies are viewable by everyone"
  ON companies FOR SELECT
  USING (true);

-- Authenticated users can insert companies
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

**Jobs Policies:**

```sql
-- Anyone can view jobs (both open and closed)
CREATE POLICY "Anyone can view jobs"
  ON jobs FOR SELECT
  USING (true);

-- An authenticated user can create a job only under their own identity
CREATE POLICY "Authenticated users can create jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt()->>'sub') = recruiter_id);

-- Recruiters can update their own jobs
CREATE POLICY "Users can update their own jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING ((auth.jwt()->>'sub') = recruiter_id)
  WITH CHECK ((auth.jwt()->>'sub') = recruiter_id);

-- Recruiters can delete their own jobs
CREATE POLICY "Users can delete their own jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING ((auth.jwt()->>'sub') = recruiter_id);
```

**Applications Policies:**

```sql
-- Users can view their own applications
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'sub') = candidate_id);

-- Recruiters can view applications for their jobs
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

-- Candidates can create applications
CREATE POLICY "Users can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt()->>'sub') = candidate_id);

-- Recruiters can update application status for their jobs
CREATE POLICY "Recruiters can update applications for their jobs"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = (auth.jwt()->>'sub')
    )
  );
```

**Saved Jobs Policies:**

```sql
-- Users can view their own saved jobs
CREATE POLICY "Users can view their own saved jobs"
  ON saved_jobs FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'sub') = user_id);

-- Users can save jobs
CREATE POLICY "Users can save jobs"
  ON saved_jobs FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt()->>'sub') = user_id);

-- Users can unsave their own saved jobs
CREATE POLICY "Users can delete their own saved jobs"
  ON saved_jobs FOR DELETE
  TO authenticated
  USING ((auth.jwt()->>'sub') = user_id);
```

Clerk user IDs are strings such as `user_...`. Compare them with the JWT's text subject, `auth.jwt()->>'sub'`; `auth.uid()` expects a UUID, and casting its result to text does not fix that mismatch. See the [Clerk integration documentation](https://clerk.com/docs/guides/development/integrations/databases/supabase).

The examples above do not enforce recruiter-only company/job creation, limit recruiter updates to application status, prevent duplicate applications, or reject applications to closed jobs. The UI role is stored in user-editable Clerk `unsafeMetadata`; it is a workflow preference, not a trusted authorization boundary. Add database constraints and appropriately scoped policies/server operations, then test them with separate accounts. Storage object policies must be configured separately.

### 4. Set Up Clerk Authentication

1. Create a new application at [clerk.com](https://clerk.com)
2. Enable the authentication methods you want (Email, Google, etc.)
3. Copy your Publishable Key from the Clerk Dashboard.
4. The current code calls `session.getToken({ template: "supabase" })`. The documented QA environment uses that legacy JWT-template integration; an ordinary Clerk sign-in alone is insufficient. Review the [Supabase Clerk integration guide](https://supabase.com/docs/guides/auth/third-party/clerk) before configuring a new environment. Moving to native third-party auth requires coordinated changes to token acquisition and Supabase configuration; it is not implemented here.

### 5. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

Use the matching environment's public browser keys. Never place a Supabase service-role key or a JWT signing secret in a `VITE_*` variable: Vite includes those values in the browser bundle. Keep QA and production projects and Clerk instances separate.

### 6. Run the Development Server

```bash
npm run dev
```

The application should now be running at `http://localhost:5173`

### Local verification

```bash
npm test
npm run lint
npm run build
```

`npm run test:watch` runs the Vitest suite while editing. Tests mount React in
jsdom with mocked Clerk/Supabase boundaries and exercise the actual Markdown
editor/renderer. They make no authenticated network requests and do not replace
browser workflow QA or database/storage authorization tests.

`useFetch(callback, options, resourceKey?)` exposes `ready`; read effects should
wait for it and depend on `fn` plus their query inputs. `fn` remains stable within
a session/resource and changes when that owner changes. Options are shallow-copied
at invocation; keep nested inputs immutable. Only the newest invocation updates
hook state. A different session/resource hides old data immediately. Mutations
return `{ data, error, isCurrent }`: check `!error && isCurrent()` before refreshing,
resetting forms, or navigating. Ignoring a stale response does not cancel a server
mutation. Pass a resource key when mounted components can move between records.

Use `SafeMarkdown` and `SafeMarkdownEditor` for untrusted requirements. Their
shared allowlist runs after the Markdown HTML transformations; raw stored Markdown
is not modified. See [release readiness](docs/release-readiness.md) for current
test evidence and remaining gates.

## 📁 Project Structure

```
HireHarbor/
├── public/              # Static assets
├── src/
│   ├── api/            # API service functions
│   │   ├── apiJobs.js
│   │   ├── apiApplication.js
│   │   └── apiCompanies.js
│   ├── components/     # Reusable UI components
│   ├── data/          # Static data (FAQs, sample companies)
│   ├── hooks/         # Custom React hooks
│   ├── layouts/       # Layout components
│   ├── lib/           # Utility functions
│   ├── pages/         # Page components
│   │   ├── landing.jsx
│   │   ├── onboarding.jsx
│   │   ├── jobListing.jsx
│   │   ├── job.jsx
│   │   ├── post-job.jsx
│   │   ├── my-jobs.jsx
│   │   └── saved-jobs.jsx
│   ├── utils/         # Utility functions
│   ├── App.jsx        # Root component with routing
│   ├── main.jsx       # Application entry point
│   └── index.css      # Global styles
├── .env               # Environment variables (not in git)
├── package.json
└── vite.config.js
```

## 🔑 Key API Functions

### Jobs

- `getJobs()` - Fetch jobs with filters
- `getSingleJob()` - Get job details
- `addNewJob()` - Create a new job posting
- `getMyJobs()` - Fetch recruiter's jobs
- `deleteJob()` - Remove a job
- `updateHiringStatus()` - Toggle job open/closed status

### Applications

- `applyToJob()` - Submit job application
- `getApplications()` - Fetch user's applications
- `updateApplicationStatus()` - Update application status

### Companies

- `getCompanies()` - Fetch all companies
- `addNewCompany()` - Create new company

### Saved Jobs

- `getSavedJobs()` - Fetch user's saved jobs
- `saveJob()` - Add/remove job from saved

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Complete the [release gates](docs/release-readiness.md) before deploying. The repository does not yet contain a Vercel SPA rewrite configuration; verify direct navigation/refresh on nested routes using the [Vercel Vite guidance](https://vercel.com/docs/frameworks/frontend/vite).
5. After deployment, smoke-test authentication and both roles against the intended environment.

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Customization

### Themes

The application supports light and dark modes. Theme preference is stored in localStorage. Modify theme settings in [`src/components/theme-provider.jsx`](src/components/theme-provider.jsx).

### Styling

Tailwind CSS v4 is integrated through [`vite.config.js`](vite.config.js); theme tokens and global styles are in [`src/index.css`](src/index.css).

## 🛡️ Security Best Practices

Since this is a learning project, some strict security measures might be relaxed. However, for a production environment, ensure you implement the following:

1.  **Environment Variables**: Never commit `.env` files to version control.
2.  **Input Validation**: This project uses `zod` for frontend validation, but always ensure backend policies (RLS) validate data integrity.
3.  **Storage Access**: As noted in the Setup section, secure your storage buckets. Resumes containing PII should never be publicly accessible in a real application.
4.  **Authentication**: Ensure all protected routes are wrapped in the `<ProtectedRoute>` component and verify user identity on the backend using RLS policies.
5.  **SQL Injection**: Supabase's JS client handles parameterization automatically, but be careful if writing raw SQL functions.

## 📄 License

This project is for educational purposes only and does not have a formal license.

## 🙏 Acknowledgments

- Tutorial/course that inspired this project
- [Supabase](https://supabase.com) for backend services
- [Clerk](https://clerk.com) for authentication
- [Shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Vercel](https://vercel.com) for hosting

---

**Happy Hiring! 🎉**
