# HireHarbor

A modern, full-featured job board platform built with React and Supabase. HireHarbor connects job seekers with employers, offering an intuitive interface for browsing, applying, and managing job listings.

> **Note**: This is a learning project developed as part of a tutorial to practice modern web development technologies.

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
- **Manage Jobs**: View, edit, and delete your posted positions
- **Company Management**: Add and manage company profiles with logo uploads
- **Toggle Hiring Status**: Open or close job postings as needed
- **View Applications**: Review all applications for your posted jobs
- **Update Application Status**: Track candidate progress through the hiring pipeline

### General Features

- **User Authentication**: Secure authentication powered by Clerk
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

- **Supabase** - Database, authentication, and file storage
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

- **Node.js** (v18 or higher)
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
npm install
```

### 3. Set Up Supabase

#### Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings → API

#### Create Database Tables

Run the following SQL in your Supabase SQL Editor:

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

If using private buckets, you'll need to modify `apiApplication.js` to generate signed URLs:

```javascript
// Example: Generate signed URL for private resume access
const { data: signedUrlData } = await supabase.storage
  .from("resumes")
  .createSignedUrl(fileName, 3600); // URL expires in 1 hour

const resume = signedUrlData.signedUrl;
```

#### Set Up Row Level Security (RLS)

> [!IMPORTANT]
> Row Level Security is critical for protecting user data. Enable RLS on all tables and add appropriate policies before deploying to production.

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
-- Anyone can view open jobs
CREATE POLICY "Anyone can view jobs"
  ON jobs FOR SELECT
  USING (true);

-- Recruiters can create jobs (user must be authenticated)
CREATE POLICY "Authenticated users can create jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Recruiters can update their own jobs
CREATE POLICY "Users can update their own jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = recruiter_id)
  WITH CHECK (auth.uid()::text = recruiter_id);

-- Recruiters can delete their own jobs
CREATE POLICY "Users can delete their own jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (auth.uid()::text = recruiter_id);
```

**Applications Policies:**

```sql
-- Users can view their own applications
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (auth.uid()::text = candidate_id);

-- Recruiters can view applications for their jobs
CREATE POLICY "Recruiters can view applications for their jobs"
  ON applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = auth.uid()::text
    )
  );

-- Candidates can create applications
CREATE POLICY "Users can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = candidate_id);

-- Recruiters can update application status for their jobs
CREATE POLICY "Recruiters can update applications for their jobs"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = auth.uid()::text
    )
  );
```

**Saved Jobs Policies:**

```sql
-- Users can view their own saved jobs
CREATE POLICY "Users can view their own saved jobs"
  ON saved_jobs FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Users can save jobs
CREATE POLICY "Users can save jobs"
  ON saved_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Users can unsave their own saved jobs
CREATE POLICY "Users can delete their own saved jobs"
  ON saved_jobs FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);
```

> [!WARNING] > **Note on Authentication**: These policies use `auth.uid()::text` because Clerk user IDs are stored as text. If you're using Supabase Auth instead, you may need to adjust the policies to match UUID types.

### 4. Set Up Clerk Authentication

1. Create a new application at [clerk.com](https://clerk.com)
2. Enable the authentication methods you want (Email, Google, etc.)
3. Copy your Publishable Key from the Clerk Dashboard

### 5. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

Replace the placeholder values with your actual credentials.

### 6. Run the Development Server

```bash
npm run dev
```

The application should now be running at `http://localhost:5173`

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
4. Deploy!

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

Tailwind CSS configuration can be customized in [`tailwind.config.js`](tailwind.config.js). Global styles are in [`src/index.css`](src/index.css).

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
