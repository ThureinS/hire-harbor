// Seed script that authenticates as recruiter.demo@hireharbor.dev via Clerk
// and populates all 8 demo companies and 8 demo jobs into Supabase
import { createClient } from "@supabase/supabase-js";

const CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_YWxlcnQtY2F0LTcwLmNsZXJrLmFjY291bnRzLmRldiQ";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://mrodzrcmqdjadtkdslvx.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_TX7Cnxgx63MPfkF_26ehbA_dt3ctl0W";

const DEMO_RECRUITER_EMAIL = "recruiter.demo@hireharbor.dev";
const DEMO_RECRUITER_PASSWORD = "DemoHarbor2026!";

async function main() {
  console.log("1. Authenticating as demo recruiter via Clerk...");
  const signInRes = await fetch("https://alert-cat-70.clerk.accounts.dev/v1/client/sign_ins", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      identifier: DEMO_RECRUITER_EMAIL,
      password: DEMO_RECRUITER_PASSWORD,
    }),
  });

  if (!signInRes.ok) {
    throw new Error(`Clerk sign-in failed: ${signInRes.status} ${await signInRes.text()}`);
  }

  const clientAuth = signInRes.headers.get("authorization");
  const clientData = await signInRes.json();
  const sessionId = clientData?.client?.sessions?.[0]?.id;
  const recruiterId = clientData?.client?.sessions?.[0]?.user?.id;
  console.log(`✓ Signed in successfully as ${recruiterId}`);

  console.log("2. Requesting Supabase JWT token from Clerk...");
  const tokenRes = await fetch(
    `https://alert-cat-70.clerk.accounts.dev/v1/client/sessions/${sessionId}/tokens/supabase`,
    {
      method: "POST",
      headers: { Authorization: clientAuth },
    }
  );

  if (!tokenRes.ok) {
    throw new Error(`Failed to get Supabase token: ${tokenRes.status} ${await tokenRes.text()}`);
  }

  const { jwt: token } = await tokenRes.json();
  console.log("✓ Received signed Supabase JWT token");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  console.log("3. Seeding companies...");
  const companiesData = [
    { name: "Google", logo_url: "/companies/google.webp" },
    { name: "Meta", logo_url: "/companies/meta.svg" },
    { name: "Netflix", logo_url: "/companies/netflix.png" },
    { name: "Amazon", logo_url: "/companies/amazon.svg" },
    { name: "Microsoft", logo_url: "/companies/microsoft.webp" },
    { name: "Atlassian", logo_url: "/companies/atlassian.svg" },
    { name: "Uber", logo_url: "/companies/uber.svg" },
    { name: "Harbor Labs", logo_url: "/logo.png" },
  ];

  const companyMap = new Map();

  // First fetch existing companies
  const { data: existingCompanies, error: fetchCompError } = await supabase
    .from("companies")
    .select("id, name, logo_url");

  if (fetchCompError) {
    throw new Error(`Failed to fetch companies: ${fetchCompError.message}`);
  }

  for (const c of existingCompanies) {
    companyMap.set(c.name, c.id);
  }

  for (const comp of companiesData) {
    if (!companyMap.has(comp.name)) {
      const { data, error } = await supabase
        .from("companies")
        .insert([comp])
        .select();

      if (error) {
        console.error(`Failed to insert ${comp.name}:`, error.message);
      } else if (data?.[0]) {
        companyMap.set(comp.name, data[0].id);
        console.log(`  + Created company: ${comp.name}`);
      }
    } else {
      console.log(`  ✓ Company already exists: ${comp.name}`);
    }
  }

  console.log("4. Seeding demo jobs...");
  const jobsData = [
    {
      title: "Staff Frontend Engineer (Design Systems)",
      description: "Lead our core design system initiative across web applications using React 19, TypeScript, and modern CSS.",
      location: "Remote",
      companyName: "Google",
      requirements: "### Requirements\n- 6+ years specialized frontend experience with React.\n- Deep expertise in Design Systems and web accessibility.\n- Experience leading architectural RFCs.",
      isOpen: true,
    },
    {
      title: "Senior Full Stack Engineer",
      description: "Build scalable candidate matching workflows, high-throughput search infrastructure, and messaging.",
      location: "Thailand",
      companyName: "Meta",
      requirements: "### Requirements\n- 4+ years full-stack engineering experience.\n- Strong proficiency with TypeScript, React, and PostgreSQL.\n- Solid grasp of REST and GraphQL APIs.",
      isOpen: true,
    },
    {
      title: "Lead Cloud Infrastructure Architect",
      description: "Architect and scale cloud-native services across AWS and distributed Kubernetes clusters.",
      location: "Singapore",
      companyName: "Amazon",
      requirements: "### Requirements\n- 7+ years in Cloud Infrastructure and DevOps.\n- Hands-on mastery of AWS, Terraform, and Docker.\n- Experience with CI/CD automation and disaster recovery.",
      isOpen: true,
    },
    {
      title: "Senior Distributed Systems Engineer (Go)",
      description: "Design and operate global telemetry and streaming pipelines handling millions of events per second.",
      location: "Germany",
      companyName: "Netflix",
      requirements: "### Requirements\n- 5+ years of software engineering in Go or Rust.\n- Proven track record building distributed data pipelines.\n- Strong understanding of concurrency and network protocols.",
      isOpen: true,
    },
    {
      title: "Senior Mobile Engineer (React Native)",
      description: "Build fluid, offline-first mobile applications across iOS and Android.",
      location: "Thailand",
      companyName: "Uber",
      requirements: "### Requirements\n- 4+ years building production React Native applications.\n- Experience with native device APIs and push notifications.\n- Strong focus on 60fps animations and local storage sync.",
      isOpen: true,
    },
    {
      title: "Product Security Engineer",
      description: "Drive threat modeling, secure code reviews, automated scanning, and bug bounty remediation.",
      location: "United States",
      companyName: "Atlassian",
      requirements: "### Requirements\n- 4+ years in application security and penetration testing.\n- Proficiency in identifying OWASP Top 10 vulnerabilities.\n- Experience writing security automation scripts.",
      isOpen: true,
    },
    {
      title: "Applied AI / ML Engineer",
      description: "Integrate frontier LLMs and vector search embeddings into software tools and enterprise automation.",
      location: "Japan",
      companyName: "Microsoft",
      requirements: "### Requirements\n- 3+ years working with machine learning models.\n- Practical experience with PyTorch and vector databases.\n- Strong software engineering practices for low-latency APIs.",
      isOpen: true,
    },
    {
      title: "Frontend Engineer (Harbor Bold Core)",
      description: "Join the Harbor Labs core crew to expand our job marketplace UI and craft data-dense interfaces.",
      location: "Remote",
      companyName: "Harbor Labs",
      requirements: "### Requirements\n- 3+ years in modern React frontend engineering.\n- Passion for typography, dark mode aesthetics, and clean layouts.\n- Experience with Tailwind CSS and Radix UI.",
      isOpen: true,
    },
  ];

  // Fetch existing jobs for this recruiter
  const { data: existingJobs, error: fetchJobsError } = await supabase
    .from("jobs")
    .select("id, title, recruiter_id")
    .eq("recruiter_id", recruiterId);

  if (fetchJobsError) {
    throw new Error(`Failed to fetch jobs: ${fetchJobsError.message}`);
  }

  const existingTitles = new Set(existingJobs.map((j) => j.title));

  for (const job of jobsData) {
    if (existingTitles.has(job.title)) {
      console.log(`  ✓ Job already exists: ${job.title}`);
      continue;
    }

    const companyId = companyMap.get(job.companyName);
    if (!companyId) {
      console.error(`  ✗ Company not found for job: ${job.companyName}`);
      continue;
    }

    const { error: insertJobError } = await supabase.from("jobs").insert([
      {
        title: job.title,
        description: job.description,
        location: job.location,
        company_id: companyId,
        recruiter_id: recruiterId,
        requirements: job.requirements,
        isOpen: job.isOpen,
      },
    ]);

    if (insertJobError) {
      console.error(`  ✗ Error creating job ${job.title}:`, insertJobError.message);
    } else {
      console.log(`  + Created job: ${job.title}`);
    }
  }

  console.log("\n✅ All demo companies and jobs seeded successfully!");
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
