import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import { ArrowRight, BriefcaseBusiness, UserRound } from "lucide-react";

const Onboarding = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleError, setRoleError] = useState(null);

  const navigateUser = useCallback((currRole) => {
    navigate(currRole === "recruiter" ? "/post-job" : "/jobs");
  }, [navigate]);

  const handleRoleSelection = async (role) => {
    setIsUpdatingRole(true);
    setRoleError(null);
    try {
      await user.update({ unsafeMetadata: { role } });
      navigateUser(role);
    } catch {
      setRoleError("Could not save your role. Please try again.");
      setIsUpdatingRole(false);
    }
  };

  useEffect(() => {
    if (user?.unsafeMetadata?.role) {
      navigateUser(user.unsafeMetadata.role);
    }
  }, [user, navigateUser]);

  if (!isLoaded) {
    return (
      <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col justify-center px-4 py-10 sm:px-0">
      <section className="rounded-md border border-border bg-card p-5 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
          Choose your harbor
        </p>
        <h1 className="page-title mt-2 text-4xl font-black sm:text-6xl">
          Start with the right workflow
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Pick the side of the marketplace you need today. You can move directly
          into applications or job posting after this step.
        </p>
      </section>

      {roleError && (
        <p role="alert" className="mt-4 text-sm font-semibold text-destructive">
          {roleError}
        </p>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Button
          variant="outline"
          disabled={isUpdatingRole}
          className="group h-auto min-h-44 justify-between rounded-md border-border bg-card p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-lg"
          onClick={() => handleRoleSelection("candidate")}
        >
          <span className="flex min-w-0 flex-col items-start">
            <span className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-background text-primary">
              <UserRound size={24} />
            </span>
            <span className="mt-5 text-2xl font-black text-foreground">
              Candidate
            </span>
            <span className="mt-2 whitespace-normal text-sm leading-6 text-muted-foreground">
              Browse listings, save roles, and track submitted applications.
            </span>
          </span>
          <ArrowRight
            size={22}
            className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
          />
        </Button>
        <Button
          variant="outline"
          disabled={isUpdatingRole}
          className="group h-auto min-h-44 justify-between rounded-md border-border bg-card p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-lg"
          onClick={() => handleRoleSelection("recruiter")}
        >
          <span className="flex min-w-0 flex-col items-start">
            <span className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-background text-primary">
              <BriefcaseBusiness size={24} />
            </span>
            <span className="mt-5 text-2xl font-black text-foreground">
              Recruiter
            </span>
            <span className="mt-2 whitespace-normal text-sm leading-6 text-muted-foreground">
              Publish listings, manage openings, and review incoming talent.
            </span>
          </span>
          <ArrowRight
            size={22}
            className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
          />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
