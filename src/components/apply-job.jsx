import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "./ui/input";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useFetch from "@/hooks/use-fetch";
import { applyToJob } from "@/api/apiApplication";
import { BarLoader } from "react-spinners";
import {
  BriefcaseBusiness,
  FileUp,
  GraduationCap,
  Send,
  Wrench,
} from "lucide-react";

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

const schema = z.object({
  experience: z
    .number()
    .min(0, { message: "Experience must be at least 0" })
    .int(),
  skills: z.string().min(1, { message: "Skills are required" }),
  education: z.enum(["Intermediate", "Graduate", "Post Graduate"], {
    message: "Education is required",
  }),
  resume: z
    .any()
    .refine(
      (file) =>
        file?.[0] &&
        (file[0].type === "application/pdf" ||
          file[0].type === "application/msword" ||
          file[0].type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
      { message: "Only PDF or Word documents are allowed" }
    )
    .refine((file) => file?.[0] && file[0].size <= MAX_RESUME_SIZE_BYTES, {
      message: "Resume must be 5MB or smaller",
    }),
});

export function ApplyJobDrawer({ user, job, fetchJob, applied = false }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
  });

  const {
    loading: loadingApply,
    error: errorApply,
    fn: fnApply,
  } = useFetch(applyToJob, {}, job.id);

  const onSubmit = (data) => {
    fnApply({
      ...data,
      job_id: job.id,
      candidate_id: user.id,
      name: user.fullName,
      status: "applied",
      resume: data.resume[0],
    }).then((result) => {
      if (result.error || !result.isCurrent()) return;
      fetchJob();
      reset();
    });
  };

  const disabled = !job?.isOpen || applied;

  return (
    <Drawer open={applied ? false : undefined}>
      <DrawerTrigger asChild>
        <Button
          size="lg"
          variant={job?.isOpen && !applied ? "default" : "destructive"}
          className="w-full font-black"
          disabled={disabled}
        >
          {job?.isOpen ? (applied ? "Applied" : "Apply") : "Hiring Closed"}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="mx-auto max-w-3xl">
        <DrawerHeader className="px-5 sm:px-6">
          <DrawerTitle className="text-2xl font-black">
            Apply for {job?.title} at {job?.company?.name}
          </DrawerTitle>
          <DrawerDescription>
            Submit your experience, skills, education, and resume.
          </DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 px-5 pb-0 sm:px-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 items-start">
            <div className="grid gap-2">
              <Label htmlFor="apply-experience" className="flex items-center gap-2 text-sm font-black">
                <BriefcaseBusiness size={16} className="text-primary" />
                Experience
              </Label>
              <Input
                id="apply-experience"
                type="number"
                min="0"
                placeholder="Years of experience"
                className="h-12 border-border bg-background"
                {...register("experience", {
                  valueAsNumber: true,
                })}
              />
              {errors.experience && (
                <p className="text-sm font-semibold text-destructive">
                  {errors.experience.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apply-skills" className="flex items-center gap-2 text-sm font-black">
                <Wrench size={16} className="text-primary" />
                Skills
              </Label>
              <Input
                id="apply-skills"
                type="text"
                placeholder="React, SQL, onboarding"
                className="h-12 border-border bg-background"
                {...register("skills")}
              />
              {errors.skills && (
                <p className="text-sm font-semibold text-destructive">
                  {errors.skills.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="flex items-center gap-2 text-sm font-black">
              <GraduationCap size={16} className="text-primary" />
              Education
            </Label>
            <Controller
              name="education"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  className="grid gap-2 rounded-md border border-border bg-background p-4 sm:grid-cols-3"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="Intermediate" id="intermediate" />
                    <Label htmlFor="intermediate">Intermediate</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="Graduate" id="graduate" />
                    <Label htmlFor="graduate">Graduate</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="Post Graduate" id="post-graduate" />
                    <Label htmlFor="post-graduate">Post Graduate</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.education && (
              <p className="text-sm font-semibold text-destructive">
                {errors.education.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="apply-resume" className="flex items-center gap-2 text-sm font-black">
              <FileUp size={16} className="text-primary" />
              Resume
            </Label>
            <Input
              id="apply-resume"
              type="file"
              accept=".pdf, .doc, .docx"
              className="h-12 border-border bg-background file:text-muted-foreground"
              {...register("resume")}
            />
            {errors.resume && (
              <p className="text-sm font-semibold text-destructive">
                {errors.resume.message}
              </p>
            )}
          </div>
          {errorApply?.message && (
            <p className="text-sm font-semibold text-destructive">
              {errorApply?.message}
            </p>
          )}
          {loadingApply && <BarLoader width={"100%"} color="var(--primary)" />}
          <Button
            type="submit"
            size="lg"
            className="font-black"
            disabled={loadingApply}
          >
            <Send size={17} className="mr-2" />
            {loadingApply ? "Submitting" : "Submit application"}
          </Button>
        </form>

        <DrawerFooter className="px-5 sm:px-6">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
