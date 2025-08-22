// import { useEffect, useState } from "react";
// import { useUser } from "@clerk/clerk-react";
// import { Country } from "country-state-city";
// import { BarLoader } from "react-spinners";
// import useFetch from "@/hooks/use-fetch";

// import JobCard from "@/components/job-card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// import { getCompanies } from "@/api/apiCompanies";
// import { getJobs } from "@/api/apiJobs";

// const JobListing = () => {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [location, setLocation] = useState("");
//   const [company_id, setCompany_id] = useState("");

//   const { isLoaded } = useUser();

//   const {
//     // loading: loadingCompanies,
//     data: companies,
//     fn: fnCompanies,
//   } = useFetch(getCompanies);

//   const {
//     loading: loadingJobs,
//     data: jobs,
//     fn: fnJobs,
//   } = useFetch(getJobs, {
//     location,
//     company_id,
//     searchQuery,
//   });

//   useEffect(() => {
//     if (isLoaded) {
//       fnCompanies();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isLoaded]);

//   useEffect(() => {
//     if (isLoaded) fnJobs();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isLoaded, location, company_id, searchQuery]);

//   const handleSearch = (e) => {
//     e.preventDefault();
//     let formData = new FormData(e.target);

//     const query = formData.get("search-query");
//     if (query) setSearchQuery(query);
//   };

//   const clearFilters = () => {
//     setSearchQuery("");
//     setCompany_id("");
//     setLocation("");
//   };

//   if (!isLoaded) {
//     return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
//   }

//   return (
//     <div className="">
//       <h1 className="gradient-title font-extrabold text-6xl sm:text-7xl text-center pb-8">
//         Latest Jobs
//       </h1>
//       <form
//         onSubmit={handleSearch}
//         className="h-14 flex flex-row w-full gap-2 items-center mb-3"
//       >
//         <Input
//           type="text"
//           placeholder="Search Jobs by Title.."
//           name="search-query"
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           className="h-full flex-1  px-4 text-md"
//         />
//       </form>

//       <div className="flex flex-col sm:flex-row gap-2">
//         <Select value={location} onValueChange={(value) => setLocation(value)}>
//           <SelectTrigger>
//             <SelectValue placeholder="Filter by Location" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectGroup>
//               {Country.getAllCountries().map(({ name }) => {
//                 return (
//                   <SelectItem key={name} value={name}>
//                     {name}
//                   </SelectItem>
//                 );
//               })}
//             </SelectGroup>
//           </SelectContent>
//         </Select>

//         <Select
//           value={company_id}
//           onValueChange={(value) => setCompany_id(value)}
//         >
//           <SelectTrigger>
//             <SelectValue placeholder="Filter by Company" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectGroup>
//               {companies?.map(({ name, id }) => {
//                 return (
//                   <SelectItem key={name} value={id}>
//                     {name}
//                   </SelectItem>
//                 );
//               })}
//             </SelectGroup>
//           </SelectContent>
//         </Select>
//         <Button
//           className="sm:w-1/2"
//           variant="destructive"
//           onClick={clearFilters}
//         >
//           Clear Filters
//         </Button>
//       </div>

//       {loadingJobs && (
//         <BarLoader className="mt-4" width={"100%"} color="#36d7b7" />
//       )}

//       {loadingJobs === false && (
//         <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {jobs?.length ? (
//             jobs.map((job) => {
//               return (
//                 <JobCard
//                   key={job.id}
//                   job={job}
//                   savedInit={job?.saved?.length > 0}
//                 />
//               );
//             })
//           ) : (
//             <div>No Jobs Found 😢</div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default JobListing;

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

const PAGE_SIZE = 1; // tweak if you like

const JobListing = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [company_id, setCompany_id] = useState("");

  // pagination state
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
    // backend can ignore these; we paginate on the client
    page,
    limit: PAGE_SIZE,
  });

  useEffect(() => {
    if (isLoaded) fnCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded) fnJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, location, company_id, searchQuery]);

  // reset to page 1 when filters/search change
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

  // ===== client-side pagination math =====
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
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="">
      <h1 className="gradient-title font-extrabold text-6xl sm:text-7xl text-center pb-8">
        Latest Jobs
      </h1>

      <form
        onSubmit={handleSearch}
        className="h-14 flex flex-row w-full gap-2 items-center mb-3"
      >
        <Input
          type="text"
          placeholder="Search Jobs by Title.."
          name="search-query"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-full flex-1  px-4 text-md"
        />
      </form>

      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={location} onValueChange={(value) => setLocation(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Location" />
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
          <SelectTrigger>
            <SelectValue placeholder="Filter by Company" />
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
          className="sm:w-1/2"
          variant="destructive"
          onClick={clearFilters}
        >
          Clear Filters
        </Button>
      </div>

      {loadingJobs && (
        <BarLoader className="mt-4" width={"100%"} color="#36d7b7" />
      )}

      {loadingJobs === false && (
        <>
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedJobs?.length ? (
              displayedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  savedInit={job?.saved?.length > 0}
                />
              ))
            ) : (
              <div>No Jobs Found 😢</div>
            )}
          </div>

          {totalCount > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                <p className="w-[200px]">
                  {"Showing "}
                  {showingFrom}-{showingTo}
                </p>
                {"of "}
                {totalCount}
                {" jobs"}
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
