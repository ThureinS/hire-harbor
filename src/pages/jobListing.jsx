import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Country } from "country-state-city";
import { BarLoader } from "react-spinners";
import useFetch from "@/hooks/use-fetch";

import JobCard from "@/components/job-card";
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

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { getCompanies } from "@/api/apiCompanies";
import { getJobs } from "@/api/apiJobs";
import { BriefcaseBusiness, Filter, Search, X } from "lucide-react";

const PAGE_SIZE = 3;

const JobListing = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [company_id, setCompany_id] = useState("");

  const [page, setPage] = useState(1);

  const { isLoaded } = useUser();

  const { data: companies, fn: fnCompanies } = useFetch(getCompanies);

  const {
    loading: loadingJobs,
    data: jobs,
    fn: fnJobs,
  } = useFetch(getJobs, {
    location,
    company_id,
    searchQuery,

    page,
    limit: PAGE_SIZE,
  });

  useEffect(() => {
    if (isLoaded) fnCompanies();
  }, [isLoaded, fnCompanies]);

  useEffect(() => {
    if (isLoaded) fnJobs();
  }, [isLoaded, location, company_id, searchQuery, fnJobs]);

  useEffect(() => {
    setPage(1);
  }, [location, company_id, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const query = formData.get("search-query") || "";
    setSearchQuery(query);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCompany_id("");
    setLocation("");
    setPage(1);
  };

  const totalCount = jobs?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalCount);

  const displayedJobs = useMemo(() => {
    if (!jobs?.length) return [];
    return jobs.slice(startIndex, startIndex + PAGE_SIZE);
  }, [jobs, startIndex]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const base = new Set([
      1,
      totalPages,
      page,
      page - 1,
      page + 1,
      page - 2,
      page + 2,
    ]);
    const list = Array.from(base)
      .filter((n) => typeof n === "number" && n >= 1 && n <= totalPages)
      .sort((a, b) => a - b);
    const withDots = [];
    for (let i = 0; i < list.length; i++) {
      withDots.push(list[i]);
      if (i < list.length - 1 && list[i + 1] - list[i] > 1) withDots.push("…");
    }
    if (withDots[0] !== 1) withDots.unshift(1, "…");
    if (withDots[withDots.length - 1] !== totalPages)
      withDots.push("…", totalPages);
    return withDots;
  }, [page, totalPages]);

  const showingFrom = totalCount === 0 ? 0 : startIndex + 1;
  const showingTo = endIndex;

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />;
  }

  return (
    <div className="flex flex-col gap-7 px-4 py-6 sm:px-0">
      <section className="rounded-md border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
            Job harbor
          </p>
          <h1 className="page-title text-4xl font-black sm:text-6xl">
            Latest Jobs
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Search the board, narrow by location or company, and scan each role
            from the same data-first card layout.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title"
              name="search-query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-md border-border bg-background pl-12 text-base"
            />
          </div>
          <Button type="submit" className="h-12 font-black">
            Search
          </Button>
        </form>
      </section>

      <div className="grid gap-2 rounded-md border border-border bg-card p-3 sm:grid-cols-[1fr_1fr_auto]">
        <Select value={location} onValueChange={(value) => setLocation(value)}>
          <SelectTrigger className="h-11 border-border bg-background">
            <SelectValue placeholder="Filter by location" />
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

        <Select
          value={company_id}
          onValueChange={(value) => setCompany_id(value)}
        >
          <SelectTrigger className="h-11 border-border bg-background">
            <SelectValue placeholder="Filter by company" />
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

        <Button
          className="h-11 border-border bg-card font-bold"
          variant="outline"
          onClick={clearFilters}
        >
          <X size={17} className="mr-2" />
          Clear
        </Button>
      </div>

      {loadingJobs && (
        <BarLoader className="mt-1" width={"100%"} color="var(--primary)" />
      )}

      {loadingJobs === false && (
        <>
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <BriefcaseBusiness size={17} className="text-primary" />
              {totalCount} {totalCount === 1 ? "role" : "roles"} available
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter size={16} />
              Showing {showingFrom}-{showingTo}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedJobs?.length ? (
              displayedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  savedInit={job?.saved?.length > 0}
                />
              ))
            ) : (
              <div className="rounded-md border border-border bg-card p-8 text-center font-bold text-muted-foreground md:col-span-2 lg:col-span-3">
                No jobs found.
              </div>
            )}
          </div>

          {totalCount > 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-border bg-card p-3 sm:flex-row sm:justify-between">
              <div className="text-center text-sm text-muted-foreground sm:text-left">
                Showing {showingFrom}-{showingTo} of {totalCount} jobs
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={
                        page === 1 ? "pointer-events-none opacity-50" : ""
                      }
                      aria-disabled={page === 1}
                    />
                  </PaginationItem>

                  {pageNumbers.map((n, i) =>
                    n === "…" ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={n}>
                        <PaginationLink
                          isActive={n === page}
                          onClick={() => setPage(Number(n))}
                        >
                          {n}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={
                        page === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobListing;
