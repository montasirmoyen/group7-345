import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Clock3,
  FileStack,
  KanbanSquare,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const highlights = [
  {
    title: "Kanban Pipeline",
    description:
      "Track every role from Applied to Offer with a drag-and-drop board built for real hiring workflows.",
    icon: KanbanSquare,
  },
  {
    title: "Resume Mapping",
    description:
      "Map each resume version to each job so you always submit the most relevant profile for every opportunity.",
    icon: FileStack,
  },
  {
    title: "Professional Follow-through",
    description:
      "Keep deadlines, interview rounds, and notes organized so your outreach stays consistent and polished.",
    icon: ShieldCheck,
  },
];

const metrics = [
  { label: "Hours saved weekly", value: "6+" },
  { label: "Applications tracked cleanly", value: "100%" },
  { label: "Status visibility vs sheets", value: "Instant" },
];

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.24),transparent_45%),radial-gradient(circle_at_80%_20%,hsl(var(--foreground)/0.12),transparent_38%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))]" />
      <div className="mx-auto w-full max-w-7xl px-4 pb-18 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div className="space-y-6">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.12em]">
              Built for Efficient Job Search
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Run your job search with <span className="text-primary">efficiency</span> and
                <span className="text-primary"> professionalism</span>.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
                Job Application Tracker replaces messy spreadsheets with a structured workspace.
                Manage your Kanban board, map resumes to openings, and save hours of manual entry
                every week.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="#" className="inline-flex items-center gap-2">
                  Start tracking smarter
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#features">Explore features</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <Card key={metric.label} size="sm" className="border border-border/60 bg-card/60 backdrop-blur">
                  <CardHeader className="gap-1 pb-0">
                    <CardDescription className="text-xs uppercase tracking-[0.09em]">
                      {metric.label}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{metric.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card id="features" className="border border-border/70 bg-card/80 shadow-xl shadow-black/5 backdrop-blur">
            <CardHeader>
              <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                <Briefcase className="size-3.5" />
                Why professionals switch
              </div>
              <CardTitle className="text-2xl">From spreadsheet chaos to focused execution</CardTitle>
              <CardDescription>
                Every application, interview stage, and resume variant in one place so you can spend
                more time preparing and less time formatting cells.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {highlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="rounded-xl border border-border/60 bg-background/50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Icon className="size-4" />
                      </span>
                      <h3 className="font-medium">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm">
                <Clock3 className="size-4 text-primary" />
                <span>
                  Save time on admin and focus on interview prep, networking, and better applications.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
