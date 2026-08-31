import { useEffect } from "react";
import { BarLoader } from "react-spinners";
import MDEditor from "@uiw/react-md-editor";
import { useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  DoorClosed,
  DoorOpen,
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

import useFetch from "@/hooks/use-fetch";
import { getSingleJob, updateHiringStatus } from "@/api/apiJobs";

const JobPage = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();

  const {
    loading: loadingJob,
    data: job,
    fn: fnJob,
  } = useFetch(getSingleJob, {
    job_id: id,
  });

  useEffect(() => {
    if (isLoaded) fnJob();
  }, [isLoaded, fnJob]);

  const { loading: loadingHiringStatus, fn: fnHiringStatus } = useFetch(
    updateHiringStatus,
    {
      job_id: id,
    }
  );

  const handleStatusChange = (value) => {
    const isOpen = value === "open";
    fnHiringStatus(isOpen).then(() => fnJob());
  };

  if (!isLoaded || loadingJob) {
    return <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />;
  }

  return (
    <div className="flex flex-col gap-7 px-4 py-6 sm:px-0">
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
        <Select onValueChange={handleStatusChange}>
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

      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
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
        <MDEditor.Markdown
          source={job?.requirements}
          style={{ backgroundColor: "transparent" }}
          className="text-base leading-7 sm:text-lg"
        />
      </section>

      {loadingHiringStatus && <BarLoader width={"100%"} color="var(--primary)" />}
      {job?.applications?.length > 0 && job?.recruiter_id === user?.id && (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-5">
          <h2 className="text-xl font-black">Applications</h2>
          {job?.applications.map((application) => {
            return (
              <ApplicationCard key={application.id} application={application} />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobPage;
