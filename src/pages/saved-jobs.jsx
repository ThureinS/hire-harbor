import { getSavedJobs } from "@/api/apiJobs";
import JobCard from "@/components/job-card";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { BarLoader } from "react-spinners";
import { BookmarkCheck } from "lucide-react";

const SavedJobs = () => {
  const { isLoaded } = useUser();

  const {
    loading: loadingSavedJobs,
    data: savedJobs,
    fn: fnSavedJobs,
  } = useFetch(getSavedJobs);

  useEffect(() => {
    if (isLoaded) {
      fnSavedJobs();
    }
  }, [isLoaded, fnSavedJobs]);

  if (!isLoaded || loadingSavedJobs) {
    return (
      <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />
    );
  }

  return (
    <div className="flex flex-col gap-7 px-4 py-6 sm:px-0">
      <section className="rounded-md border border-border bg-card p-5 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
          Candidate shortlist
        </p>
        <h1 className="page-title mt-2 text-4xl font-black sm:text-6xl">
          Saved Jobs
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Keep high-signal roles close while you compare openings and decide
          where to apply next.
        </p>
      </section>

      {loadingSavedJobs === false && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {savedJobs?.length ? (
            savedJobs?.map((saved) => {
              return (
                <JobCard
                  key={saved.id}
                  job={saved?.job}
                  onJobAction={fnSavedJobs}
                  savedInit={true}
                />
              );
            })
          ) : (
            <div className="rounded-md border border-border bg-card p-8 text-center md:col-span-2 lg:col-span-3">
              <BookmarkCheck className="mx-auto h-9 w-9 text-primary" />
              <p className="mt-4 text-lg font-black">No saved jobs yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Save listings from the jobs board to build a focused shortlist.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;
