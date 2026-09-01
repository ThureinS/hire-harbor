import CreatedApplications from "@/components/created-applications";
import CreatedJobs from "@/components/created-jobs";
import { useUser } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";

const MyJobs = () => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />
    );
  }

  const isCandidate = user?.unsafeMetadata?.role === "candidate";

  return (
    <div className="flex flex-col gap-7 px-4 py-6 sm:px-0">
      <section className="rounded-md border border-border bg-card p-5 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
          {isCandidate ? "Candidate pipeline" : "Recruiter dashboard"}
        </p>
        <h1 className="page-title mt-2 text-4xl font-black sm:text-6xl">
          {isCandidate ? "My Applications" : "My Jobs"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {isCandidate
            ? "Track every application you have submitted and watch status changes from recruiters."
            : "Manage your active listings and keep the hiring board current."}
        </p>
      </section>

      {isCandidate ? <CreatedApplications /> : <CreatedJobs />}
    </div>
  );
};

export default MyJobs;
