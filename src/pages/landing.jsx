import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import companies from "../data/companies.json";
import faqs from "../data/faq.json";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { createElement } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Search,
  ShipWheel,
} from "lucide-react";

const loopSteps = [
  {
    icon: Search,
    title: "Search signal-rich roles",
    text: "Filter by title, company, and location without losing sight of the job data that matters.",
  },
  {
    icon: ClipboardList,
    title: "Inspect the fit",
    text: "Open each role for the description, requirements, hiring status, and applicant activity.",
  },
  {
    icon: CheckCircle2,
    title: "Apply or save",
    text: "Move on a role immediately, or keep it docked for a later pass.",
  },
];

const LandingPage = () => {
  return (
    <main className="flex flex-col gap-14 px-4 py-8 sm:gap-20 sm:px-0 sm:py-14">
      <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-primary">
            <ShipWheel size={14} />
            Harbor Bold
          </span>
          <h1 className="page-title max-w-4xl text-5xl font-black leading-[0.95] sm:text-7xl lg:text-8xl">
            Find your next role with a sharper first pass.
          </h1>
          <p className="max-w-2xl text-base font-medium leading-7 text-muted-foreground sm:text-xl">
            Hire Harbor puts the job search loop first: search the market,
            compare clear role data, then apply or save without extra noise.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="xl" className="font-black">
              <Link to="/jobs">
                Find Jobs
                <ArrowRight size={20} className="ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="xl"
              className="border border-border bg-card font-black hover:bg-accent"
            >
              <Link to="/post-job">
                <Building2 size={20} className="mr-2" />
                Post a Job
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-5 shadow-[0_20px_60px_-44px_var(--primary)]">
          <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Live search
              </p>
              <h2 className="mt-1 text-2xl font-black">Frontend Engineer</h2>
            </div>
            <span className="rounded-md bg-primary px-3 py-1 text-sm font-black text-primary-foreground">
              Open
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Location", "Remote"],
              ["Applicants", "18"],
              ["Company", "Harbor Labs"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border bg-background p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-lg font-black">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md border border-border bg-background p-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Build hiring workflows, tighten candidate paths, and ship React
              interfaces with a small product team.
            </p>
          </div>
          <div className="mt-5 flex gap-3">
            <Button asChild className="flex-1 font-bold">
              <Link to="/jobs">View Matches</Link>
            </Button>
            <Button variant="outline" className="border-border bg-card font-bold">
              Save
            </Button>
          </div>
        </div>
      </section>

      <Carousel
        plugins={[
          Autoplay({
            delay: 2000,
          }),
        ]}
        className="w-full border-y border-border py-8"
      >
        <CarouselContent className="flex items-center gap-8 sm:gap-20">
          {companies.map(({ name, id, path }) => (
            <CarouselItem key={id} className="basis-1/3 lg:basis-1/6">
              <img
                src={path}
                alt={name}
                className="h-9 object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0 sm:h-12"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <section className="grid gap-4 md:grid-cols-3">
        {loopSteps.map(({ icon, title, text }) => (
          <div
            key={title}
            className="rounded-md border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
          >
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              {createElement(icon, { size: 21 })}
            </div>
            <h2 className="text-xl font-black">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {text}
            </p>
          </div>
        ))}
      </section>

      <Accordion type="multiple" className="w-full rounded-md border border-border bg-card px-4">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index + 1}`}>
            <AccordionTrigger className="text-left font-bold">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </main>
  );
};

export default LandingPage;
