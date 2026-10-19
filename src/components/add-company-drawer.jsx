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
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import useFetch from "@/hooks/use-fetch";
import { addNewCompany } from "@/api/apiCompanies";
import { BarLoader } from "react-spinners";
import { useState } from "react";

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

const schema = z.object({
  name: z.string().min(1, { message: "Company name is required" }),
  logo: z
    .any()
    .refine(
      (file) =>
        file?.[0] &&
        (file[0].type === "image/png" || file[0].type === "image/jpeg"),
      {
        message: "Only Images are allowed",
      }
    )
    .refine((file) => file?.[0] && file[0].size <= MAX_LOGO_SIZE_BYTES, {
      message: "Logo must be 2MB or smaller",
    }),
});

const AddCompanyDrawer = ({ fetchCompanies }) => {
  const [open, setOpen] = useState(false);
  const {
    reset,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const {
    loading: loadingAddCompany,
    error: errorAddCompany,
    fn: fnAddCompany,
  } = useFetch(addNewCompany);

  const onSubmit = async (data) => {
    const result = await fnAddCompany({
      ...data,
      logo: data.logo[0],
    });
    if (!result.error && result.isCurrent()) {
      reset();
      setOpen(false);
      fetchCompanies();
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          type="button"
          size="lg"
          variant="secondary"
          className="h-12 whitespace-nowrap font-black"
        >
          Add Company
        </Button>
      </DrawerTrigger>
      <DrawerContent className="mx-auto max-w-3xl">
        <DrawerHeader className="px-5 sm:px-6">
          <DrawerTitle className="text-2xl font-black">
            Add a new company
          </DrawerTitle>
          <DrawerDescription>
            Add the company name and logo candidates will see on job listings.
          </DrawerDescription>
        </DrawerHeader>
        <form
          onSubmit={(event) => {
            event.stopPropagation();
            handleSubmit(onSubmit)(event);
          }}
          className="grid gap-4 px-5 pb-0 sm:grid-cols-[1fr_1fr_auto] sm:px-6"
        >
          <Input
            aria-label="Company name"
            placeholder="Company name"
            className="h-12 border-border bg-background"
            {...register("name")}
          />

          <Input
            type="file"
            aria-label="Company logo"
            accept="image/*"
            className="h-12 border-border bg-background file:text-muted-foreground"
            {...register("logo")}
          />

          <Button
            type="submit"
            disabled={loadingAddCompany}
            className="h-12 whitespace-nowrap font-black"
          >
            Add
          </Button>
        </form>
        <DrawerFooter className="px-5 sm:px-6">
          {errors.name && (
            <p className="text-sm font-semibold text-destructive">
              {errors.name.message}
            </p>
          )}
          {errors.logo && (
            <p className="text-sm font-semibold text-destructive">
              {errors.logo.message}
            </p>
          )}
          {errorAddCompany?.message && (
            <p className="text-sm font-semibold text-destructive">
              {errorAddCompany?.message}
            </p>
          )}
          {loadingAddCompany && (
            <BarLoader width={"100%"} color="var(--primary)" />
          )}
          <DrawerClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AddCompanyDrawer;
