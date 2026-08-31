import {
  ArrowRight,
  Building2,
  Heart,
  MapPinIcon,
  Trash2Icon,
  Users,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Link } from "react-router-dom";
import useFetch from "@/hooks/use-fetch";
import { deleteJob, saveJob } from "@/api/apiJobs";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";

const JobCard = ({
  job,
  savedInit = false,
  onJobAction = () => {},
  isMyJob = false,
}) => {
  const [saved, setSaved] = useState(savedInit);

  const { user } = useUser();

  const { loading: loadingDeleteJob, fn: fnDeleteJob } = useFetch(deleteJob, {
    job_id: job.id,
  });

  const {
    loading: loadingSavedJob,
    data: savedJob,
    fn: fnSavedJob,
  } = useFetch(saveJob, {
    alreadySaved: saved,
  });

  const handleSaveJob = async () => {
    await fnSavedJob({
      user_id: user.id,
      job_id: job.id,
    });
    onJobAction();
  };

  const handleDeleteJob = async () => {
    await fnDeleteJob();
    onJobAction();
  };

  useEffect(() => {
    if (savedJob !== undefined) setSaved(savedJob?.length > 0);
  }, [savedJob]);

  const summary = job?.description
    ? job.description.includes(".")
      ? job.description.slice(0, job.description.indexOf(".") + 1)
      : job.description
    : "No description has been added for this role yet.";

  return (
    <Card className="group flex h-full flex-col rounded-md border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      {loadingDeleteJob && (
        <BarLoader className="mt-4" width={"100%"} color="var(--primary)" />
      )}
      <CardHeader className="gap-4 border-b border-border pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-background">
              {job.company?.logo_url ? (
                <img
                  src={job.company.logo_url}
                  className="max-h-7 max-w-8 object-contain"
                  alt={job.company?.name || "Company logo"}
                />
              ) : (
                <Building2 size={20} className="text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-muted-foreground">
                {job.company?.name || "Company"}
              </p>
              <CardTitle className="mt-1 line-clamp-2 text-xl font-black leading-tight">
                {job.title}
              </CardTitle>
            </div>
          </div>
          {isMyJob && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDeleteJob}
              aria-label={`Delete ${job.title}`}
            >
              <Trash2Icon size={18} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5 p-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border border-border bg-background p-3">
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
              <MapPinIcon size={14} />
              Location
            </p>
            <p className="mt-1 truncate font-bold">{job.location}</p>
          </div>
          <div className="rounded-md border border-border bg-background p-3">
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
              <Users size={14} />
              Applicants
            </p>
            <p className="mt-1 font-bold">{job.applications?.length ?? 0}</p>
          </div>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
          {summary}
        </p>
      </CardContent>

      <CardFooter className="gap-2 p-5 pt-0">
        <Button asChild className="flex-1 font-bold">
          <Link to={`/job/${job.id}`}>
            Details
            <ArrowRight size={17} className="ml-2" />
          </Link>
        </Button>
        {!isMyJob && (
          <Button
            variant="outline"
            size="icon"
            className="border-border bg-card hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            onClick={handleSaveJob}
            disabled={loadingSavedJob}
            aria-label={saved ? "Remove saved job" : "Save job"}
          >
            {saved ? (
              <Heart size={20} fill="var(--primary)" stroke="var(--primary)" />
            ) : (
              <Heart size={20} />
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default JobCard;
