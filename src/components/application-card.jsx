import {
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  Download,
  School,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { updateApplicationStatus } from "@/api/apiApplication";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";

const statusStyles = {
  applied: "border-primary/30 bg-primary/10 text-primary",
  interviewing: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  hired: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
};

const ApplicationCard = ({ application, isCandidate = false }) => {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = application?.resume;
    link.target = "_blank";
    link.click();
  };

  const { loading: loadingHiringStatus, fn: fnHiringStatus } = useFetch(
    updateApplicationStatus,
    {
      application_id: application.id,
    }
  );

  const handleStatusChange = (status) => {
    fnHiringStatus(status);
  };

  const submittedAt = application?.created_at
    ? new Date(application.created_at).toLocaleString()
    : "Submitted date unavailable";
  const statusClass =
    statusStyles[application?.status] ??
    "border-border bg-background text-muted-foreground";

  return (
    <Card className="group transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      {loadingHiringStatus && (
        <BarLoader width={"100%"} color="var(--primary)" />
      )}
      <CardHeader className="gap-4 border-b border-border pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
              {isCandidate ? "Submitted application" : "Candidate"}
            </p>
            <CardTitle className="mt-2 line-clamp-2 text-xl font-black leading-tight">
              {isCandidate
                ? `${application?.job?.title} at ${application?.job?.company?.name}`
                : application?.name}
            </CardTitle>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            onClick={handleDownload}
            aria-label="Download resume"
          >
            <Download size={18} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-border bg-background p-3">
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
              <BriefcaseBusiness size={14} />
              Experience
            </p>
            <p className="mt-1 font-bold">
              {application?.experience} years
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-3">
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
              <School size={14} />
              Education
            </p>
            <p className="mt-1 truncate font-bold">{application?.education}</p>
          </div>
          <div className="rounded-md border border-border bg-background p-3">
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
              <Boxes size={14} />
              Skills
            </p>
            <p className="mt-1 line-clamp-2 font-bold">{application?.skills}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays size={15} className="text-primary" />
          {submittedAt}
        </span>
        {isCandidate ? (
          <span
            className={`rounded-md border px-3 py-2 text-sm font-black capitalize ${statusClass}`}
          >
            Status: {application.status}
          </span>
        ) : (
          <Select
            onValueChange={handleStatusChange}
            defaultValue={application.status}
            disabled={loadingHiringStatus}
          >
            <SelectTrigger className="h-11 w-full border-border bg-background font-bold sm:w-52">
              <SelectValue placeholder="Application Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interviewing">Interviewing</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        )}
      </CardFooter>
    </Card>
  );
};

export default ApplicationCard;
