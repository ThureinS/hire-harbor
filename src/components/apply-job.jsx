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
        file[0] &&
        (file[0].type === "application/pdf" ||
          file[0].type === "application/msword"),
      { message: "Only PDF or Word documents are allowed" }
    ),
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
  } = useFetch(applyToJob);

  const onSubmit = (data) => {
    fnApply({
      ...data,
      job_id: job.id,
      candidate_id: user.id,
      name: user.fullName,
      status: "applied",
      resume: data.resume[0],
    }).then(() => {
      fetchJob();
      reset();
    });
  };

  return (
    <Drawer open={applied ? false : undefined}>
      <DrawerTrigger asChild>
        <Button
          size="lg"
          variant={job?.isOpen && !applied ? "default" : "destructive"}
          className="w-full font-black"
          disabled={!job?.isOpen || applied}
        >
          {job?.isOpen ? (applied ? "Applied" : "Apply") : "Hiring Closed"}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
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
          <Input
            type="number"
            placeholder="Years of Experience"
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
          <Input
            type="text"
            placeholder="Skills (Comma Separated)"
            className="h-12 border-border bg-background"
            {...register("skills")}
          />
          {errors.skills && (
            <p className="text-sm font-semibold text-destructive">
              {errors.skills.message}
            </p>
          )}
          <Controller
            name="education"
            control={control}
            render={({ field }) => (
              <RadioGroup
                onValueChange={field.onChange}
                className="grid gap-2 rounded-md border border-border bg-background p-4 sm:grid-cols-3"
                {...field}
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
          <Input
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
          {errorApply?.message && (
            <p className="text-sm font-semibold text-destructive">
              {errorApply?.message}
            </p>
          )}
          {loadingApply && <BarLoader width={"100%"} color="var(--primary)" />}
          <Button type="submit" size="lg" className="font-black">
            Apply
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
