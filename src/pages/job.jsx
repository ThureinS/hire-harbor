import { useEffect } from "react";
import { BarLoader } from "react-spinners";
import { SafeMarkdown } from "@/components/safe-markdown";
import { useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  DoorClosed,
  DoorOpen,
  Inbox,
  MapPinIcon,
  Users,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApplyJobDrawer } from "@/components/apply-job";
import ApplicationCard from "@/components/application-card";
import LoadError from "@/components/load-error";

import useFetch from "@/hooks/use-fetch";
import { getSingleJob, updateHiringStatus } from "@/api/apiJobs";

const JobPage = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();

  const {
    loading: loadingJob,
    data: loadedJob,
    ready,
    error: errorJob,
    fn: fnJob,
  } = useFetch(getSingleJob, {
    job_id: id,
  }, id);

  const job = loadedJob && String(loadedJob.id) === id ? loadedJob : null;

  useEffect(() => {
    if (isLoaded && ready) fnJob();
  }, [isLoaded, ready, fnJob, id]);

  const { loading: loadingHiringStatus, error: errorHiringStatus, fn: fnHiringStatus } = useFetch(
    updateHiringStatus,
    {
      job_id: id,
    },
    id
  );

  const handleStatusChange = (value) => {
    if (!job || !ready || loadingHiringStatus) return;
    const isOpen = value === "open";
    fnHiringStatus(isOpen).then((result) => { if (!result.error && result.isCurrent()) fnJob(); });
  };

  if (!isLoaded || !ready || loadingJob || loadingJob === null) {
    return <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />;
  }

  if (errorJob && !job)
    return <LoadError message="Unable to load this job. Please refresh and try again." />;

  if (!job) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <section className="rounded-md border border-border bg-card p-8 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-black">Job not found</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            This role may have been removed or is no longer available.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7 px-4 py-6 sm:px-0">
      {errorJob && (
        <p role="alert" className="text-destructive">
          Could not refresh this job. Showing the last loaded version.
        </p>
      )}
      <section className="rounded-md border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
              Job details
            </p>
            <h1 className="page-title mt-2 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">
              {job?.title}
            </h1>
            <div className="mt-4 flex items-center gap-3 text-muted-foreground">
              <Building2 size={18} className="text-primary" />
              <span className="font-semibold">{job?.company?.name}</span>
            </div>
          </div>
          <div className="flex h-16 w-24 items-center justify-center rounded-md border border-border bg-background p-3">
            {job?.company?.logo_url ? (
              <img
                src={job.company.logo_url}
                className="max-h-10 max-w-20 object-contain"
                alt={job?.company?.name || job?.title}
              />
            ) : (
              <Building2 size={28} className="text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-background p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
              <MapPinIcon size={15} />
              Location
            </p>
            <p className="mt-2 text-lg font-black">{job?.location}</p>
          </div>
          <div className="rounded-md border border-border bg-background p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
              <Users size={15} />
              Applicants
            </p>
            <p className="mt-2 text-lg font-black">
              {job?.applications?.length ?? 0}
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
              <Briefcase size={15} />
              Hiring Status
            </p>
            <p className="mt-2 flex items-center gap-2 text-lg font-black">
              {job?.isOpen ? (
                <>
                  <DoorOpen size={19} className="text-primary" />
                  Open
                </>
              ) : (
                <>
                  <DoorClosed size={19} className="text-destructive" />
                  Closed
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {job?.recruiter_id === user?.id && (
        <Select
          onValueChange={handleStatusChange}
          value={job?.isOpen ? "open" : "closed"}
          disabled={!ready || loadingHiringStatus}
        >
          <SelectTrigger
            className={`h-12 w-full border-border font-bold ${
              job?.isOpen ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
            }`}
          >
            <SelectValue
              placeholder={
                "Hiring Status " + (job?.isOpen ? "(Open)" : "(Closed)")
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      )}

      {errorHiringStatus && <p role="alert" className="text-destructive">{errorHiringStatus.message}</p>}

      <section className="grid gap-5 lg:grid-cols-[1fr_320px] items-start">
        <div className="rounded-md border border-border bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-primary" />
            <h2 className="text-2xl font-black sm:text-3xl">About the job</h2>
          </div>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            {job?.description}
          </p>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="text-xl font-black">Move on this role</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Review the requirements and apply while the role is open.
          </p>
          {job?.recruiter_id !== user?.id && (
            <div className="mt-5">
              <ApplyJobDrawer
                key={job.id}
                job={job}
                user={user}
                fetchJob={fnJob}
                applied={job?.applications?.find(
                  (ap) => ap.candidate_id === user.id
                )}
              />
            </div>
          )}
          {job?.recruiter_id === user?.id && (
            <p className="mt-5 rounded-md border border-border bg-background p-3 text-sm font-semibold text-muted-foreground">
              You are managing this job post.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5 sm:p-6">
        <h2 className="mb-4 text-2xl font-black sm:text-3xl">
          What we are looking for
        </h2>
        <SafeMarkdown
          source={job?.requirements}
          style={{ backgroundColor: "transparent" }}
          className="text-base leading-7 sm:text-lg"
        />
      </section>

      {loadingHiringStatus && (
        <BarLoader width={"100%"} color="var(--primary)" />
      )}
      {job?.recruiter_id === user?.id && (
        <section className="flex flex-col gap-3 rounded-md border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
                Recruiter view
              </p>
              <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                Applications
              </h2>
            </div>
            <span className="rounded-md border border-border bg-background px-3 py-2 text-sm font-black">
              {job?.applications?.length ?? 0} total
            </span>
          </div>

          {job?.applications?.length ? (
            job.applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))
          ) : (
            <div className="rounded-md border border-border bg-background p-8 text-center">
              <Inbox className="mx-auto h-9 w-9 text-primary" />
              <p className="mt-4 text-lg font-black">No applications yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Candidate submissions for this role will appear here for review.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default JobPage;
