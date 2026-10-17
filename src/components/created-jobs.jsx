import { getMyJobs } from "@/api/apiJobs";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";
import JobCard from "./job-card";
import LoadError from "./load-error";
import { useEffect } from "react";

const CreatedJobs = () => {
  const { user } = useUser();

  const {
    loading: loadingCreatedJobs,
    data: createdJobs,
    error: loadError,
    ready,
    fn: fnCreatedJobs,
  } = useFetch(getMyJobs, {
    recruiter_id: user?.id,
  });

  useEffect(() => {
    if (ready && user?.id) fnCreatedJobs();
  }, [ready, user?.id, fnCreatedJobs]);

  if (loadError) return <LoadError />;

  return (
    <div>
      {!ready || loadingCreatedJobs ? (
        <BarLoader className="mt-4" width={"100%"} color="var(--primary)" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {createdJobs?.length ? (
            createdJobs.map((job) => {
              return (
                <JobCard
                  key={job.id}
                  job={job}
                  onJobAction={fnCreatedJobs}
                  isMyJob
                />
              );
            })
          ) : (
            <div className="rounded-md border border-border bg-card p-8 text-center md:col-span-2 lg:col-span-3">
              <p className="text-lg font-black">No jobs posted yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Create your first listing from the recruiter console to start
                collecting applications.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatedJobs;
