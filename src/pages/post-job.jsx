import { getCompanies } from "@/api/apiCompanies";
import { addNewJob } from "@/api/apiJobs";
import AddCompanyDrawer from "@/components/add-company-drawer";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import MDEditor from "@uiw/react-md-editor";
import { Country } from "country-state-city";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { z } from "zod";
import {
  BriefcaseBusiness,
  Building2,
  FileText,
  MapPinIcon,
} from "lucide-react";

const schema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  location: z.string().min(1, { message: "Select a location" }),
  company_id: z.string().min(1, { message: "Select or Add a new Company" }),
  requirements: z.string().min(1, { message: "Requirements are required" }),
});

const PostJob = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: { location: "", company_id: "", requirements: "" },
    resolver: zodResolver(schema),
  });

  const {
    loading: loadingCreateJob,
    error: errorCreateJob,
    data: dataCreateJob,
    fn: fnCreateJob,
  } = useFetch(addNewJob);

  const onSubmit = (data) => {
    fnCreateJob({
      ...data,
      recruiter_id: user.id,
      isOpen: true,
    });
  };

  useEffect(() => {
    if (dataCreateJob?.length > 0) navigate("/jobs");
  }, [dataCreateJob, navigate]);

  const {
    loading: loadingCompanies,
    data: companies,
    fn: fnCompanies,
  } = useFetch(getCompanies);

  useEffect(() => {
    if (isLoaded) {
      fnCompanies();
    }
  }, [isLoaded, fnCompanies]);

  if (!isLoaded || loadingCompanies) {
    return (
      <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />
    );
  }

  if (user?.unsafeMetadata?.role !== "recruiter") {
    return <Navigate to="/jobs" />;
  }

  return (
    <div className="flex flex-col gap-7 px-4 py-6 sm:px-0">
      <section className="rounded-md border border-border bg-card p-5 sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
          Recruiter console
        </p>
        <h1 className="page-title mt-2 text-4xl font-black sm:text-6xl">
          Post a Job
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Publish a focused listing with the essentials candidates need to scan,
          compare, and apply.
        </p>
      </section>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-5 rounded-md border border-border bg-card p-5 sm:p-6"
      >
        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-sm font-black">
            <BriefcaseBusiness size={16} className="text-primary" />
            Job title
          </label>
          <Input
            placeholder="Senior frontend engineer"
            className="h-12 border-border bg-background"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-sm font-semibold text-destructive">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-sm font-black">
            <FileText size={16} className="text-primary" />
            Job description
          </label>
          <Textarea
            placeholder="Describe the role, team, and outcomes."
            className="min-h-32 border-border bg-background text-base leading-6"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm font-semibold text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm font-black">
              <MapPinIcon size={16} className="text-primary" />
              Location
            </label>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-12 border-border bg-background">
                    <SelectValue placeholder="Job location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {Country.getAllCountries().map(({ name }) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.location && (
              <p className="text-sm font-semibold text-destructive">
                {errors.location.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm font-black">
              <Building2 size={16} className="text-primary" />
              Company
            </label>
            <Controller
              name="company_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-12 border-border bg-background">
                    <SelectValue placeholder="Company">
                      {field.value
                        ? companies?.find(
                            (com) => com.id === Number(field.value)
                          )?.name
                        : "Company"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {companies?.map(({ name, id }) => (
                        <SelectItem key={id} value={String(id)}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.company_id && (
              <p className="text-sm font-semibold text-destructive">
                {errors.company_id.message}
              </p>
            )}
          </div>

          <AddCompanyDrawer fetchCompanies={fnCompanies} />
        </div>

        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-sm font-black">
            <FileText size={16} className="text-primary" />
            Requirements
          </label>
          <div className="overflow-hidden rounded-md border border-border bg-background">
            <Controller
              name="requirements"
              control={control}
              render={({ field }) => (
                <MDEditor value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
          {errors.requirements && (
            <p className="text-sm font-semibold text-destructive">
              {errors.requirements.message}
            </p>
          )}
        </div>

        {errors.errorCreateJob && (
          <p className="text-sm font-semibold text-destructive">
            {errors?.errorCreateJob?.message}
          </p>
        )}
        {errorCreateJob?.message && (
          <p className="text-sm font-semibold text-destructive">
            {errorCreateJob?.message}
          </p>
        )}
        {loadingCreateJob && (
          <BarLoader width={"100%"} color="var(--primary)" />
        )}
        <Button type="submit" size="lg" className="mt-1 font-black">
          Submit
        </Button>
      </form>
    </div>
  );
};

export default PostJob;
