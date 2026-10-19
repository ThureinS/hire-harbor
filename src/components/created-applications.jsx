import { useUser } from "@clerk/clerk-react";
import ApplicationCard from "./application-card";
import { useEffect } from "react";
import { getApplications } from "@/api/apiApplication";
import useFetch from "@/hooks/use-fetch";
import LoadError from "./load-error";
import { BarLoader } from "react-spinners";

const CreatedApplications = () => {
  const { user } = useUser();

  const {
    loading: loadingApplications,
    data: applications,
    error: loadError,
    ready,
    fn: fnApplications,
  } = useFetch(getApplications, {
    user_id: user?.id,
  });

  useEffect(() => {
    if (ready && user?.id) fnApplications();
  }, [ready, user?.id, fnApplications]);

  if (!ready || loadingApplications) {
    return (
      <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />
    );
  }

  if (loadError) return <LoadError />;

  return (
    <div className="flex flex-col gap-4">
      {applications?.length ? (
        applications.map((application) => {
          return (
            <ApplicationCard
              key={application.id}
              application={application}
              isCandidate={true}
            />
          );
        })
      ) : (
        <div className="rounded-md border border-border bg-card p-8 text-center">
          <p className="text-lg font-black">No applications submitted yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Apply to a listing from the jobs board and your status will appear
            here.
          </p>
        </div>
      )}
    </div>
  );
};

export default CreatedApplications;
