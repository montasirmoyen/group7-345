"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Pencil, Plus, Trash2, TrendingUp } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/ui/kanban";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerInput } from "@/components/ui/date-picker";

type ApplicationStatus = "apply" | "applied" | "interviewing" | "offer" | "rejected";

type JobApplication = {
  id: string;
  companyName: string;
  jobTitle: string;
  applicationDate: string;
  status: ApplicationStatus;
  location: string;
  salary: string;
  notes: string;
};

type ApplicationForm = Omit<JobApplication, "id">;

const statusColumns: Array<{ id: ApplicationStatus; name: string }> = [
  { id: "apply", name: "Apply" },
  { id: "applied", name: "Applied" },
  { id: "interviewing", name: "Interviewing" },
  { id: "offer", name: "Offer" },
  { id: "rejected", name: "Rejected" },
];

const statusLabelMap: Record<ApplicationStatus, string> = {
  apply: "Apply",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

const statusBadgeClass: Record<ApplicationStatus, string> = {
  apply: "bg-muted text-foreground",
  applied: "bg-blue-500/12 text-blue-700 dark:text-blue-300",
  interviewing: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  offer: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
};

const initialApplications: JobApplication[] = [
  {
    id: "app-1",
    companyName: "Stripe",
    jobTitle: "Product Designer",
    applicationDate: "2026-03-28",
    status: "interviewing",
    location: "Remote",
    salary: "$145,000",
    notes: "Portfolio review completed. Final round on Tuesday.",
  },
  {
    id: "app-2",
    companyName: "Notion",
    jobTitle: "Frontend Engineer",
    applicationDate: "2026-03-30",
    status: "applied",
    location: "San Francisco, CA",
    salary: "$165,000",
    notes: "Referral submitted by ex-colleague.",
  },
  {
    id: "app-3",
    companyName: "Linear",
    jobTitle: "Growth Product Manager",
    applicationDate: "2026-04-01",
    status: "apply",
    location: "Remote",
    salary: "$155,000",
    notes: "Customize resume to highlight lifecycle metrics.",
  },
];

const emptyForm: ApplicationForm = {
  companyName: "",
  jobTitle: "",
  applicationDate: "",
  status: "apply",
  location: "",
  salary: "",
  notes: "",
};

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatDisplayDate(value: string) {
  if (!value) return "N/A";
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export function JobApplicationDashboard() {
  const [applications, setApplications] = useState<JobApplication[]>(initialApplications);
  const [form, setForm] = useState<ApplicationForm>({ ...emptyForm, applicationDate: getTodayDate() });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const kanbanData = useMemo(
    () =>
      applications.map((application) => ({
        id: application.id,
        name: `${application.companyName} - ${application.jobTitle}`,
        column: application.status,
      })),
    [applications],
  );

  const stats = useMemo(() => {
    const activePipeline = applications.filter((app) => app.status !== "rejected").length;
    const interviewingCount = applications.filter((app) => app.status === "interviewing").length;
    const offerCount = applications.filter((app) => app.status === "offer").length;

    return {
      total: applications.length,
      activePipeline,
      interviewingCount,
      offerCount,
    };
  }, [applications]);

  const resetForm = () => {
    setForm({ ...emptyForm, applicationDate: getTodayDate() });
    setEditingId(null);
  };

  const handleCreateClick = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEditClick = (application: JobApplication) => {
    setEditingId(application.id);
    setForm({
      companyName: application.companyName,
      jobTitle: application.jobTitle,
      applicationDate: application.applicationDate,
      status: application.status,
      location: application.location,
      salary: application.salary,
      notes: application.notes,
    });
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const updateField = <K extends keyof ApplicationForm>(field: K, value: ApplicationForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.companyName.trim() || !form.jobTitle.trim() || !form.applicationDate) {
      return;
    }

    if (editingId) {
      setApplications((prev) =>
        prev.map((application) =>
          application.id === editingId ? { ...application, ...form } : application,
        ),
      );
    } else {
      const nextApplication: JobApplication = {
        id: `app-${Date.now()}`,
        ...form,
      };
      setApplications((prev) => [nextApplication, ...prev]);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setApplications((prev) => prev.filter((application) => application.id !== id));
  };

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((application) => (application.id === id ? { ...application, status } : application)),
    );
  };

  const handleKanbanDataChange = (next: Array<{ id: string; column: string }>) => {
    setApplications((prev) => {
      const statusById = new Map(next.map((item) => [item.id, item.column as ApplicationStatus]));
      return prev.map((application) => ({
        ...application,
        status: statusById.get(application.id) ?? application.status,
      }));
    });
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Application Dashboard</CardTitle>
              <CardDescription>
                Create, edit, and manage job applications with status-driven workflow.
              </CardDescription>
            </div>
            <Button onClick={handleCreateClick}>
              <Plus className="size-4" />
              Add application
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card size="sm" className="border border-border/70">
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Total Applications</p>
                  <p className="text-2xl font-semibold">{stats.total}</p>
                </CardContent>
              </Card>
              <Card size="sm" className="border border-border/70">
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Active Pipeline</p>
                  <p className="text-2xl font-semibold">{stats.activePipeline}</p>
                </CardContent>
              </Card>
              <Card size="sm" className="border border-border/70">
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Interviewing</p>
                  <p className="text-2xl font-semibold">{stats.interviewingCount}</p>
                </CardContent>
              </Card>
              <Card size="sm" className="border border-border/70">
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Offers</p>
                  <p className="text-2xl font-semibold">{stats.offerCount}</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kanban Pipeline</CardTitle>
            <CardDescription>
              Drag cards across columns to reflect progress in the hiring process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="h-140 min-w-300">
                <KanbanProvider
                  columns={statusColumns}
                  data={kanbanData}
                  onDataChange={handleKanbanDataChange}
                  className="h-full"
                >
                  {(column) => (
                    <KanbanBoard id={column.id} key={column.id} className="bg-background">
                      <KanbanHeader className="flex items-center justify-between border-b px-3 py-2">
                        <span>{column.name}</span>
                        <Badge variant="outline">
                          {applications.filter((item) => item.status === column.id).length}
                        </Badge>
                      </KanbanHeader>
                      <KanbanCards id={column.id}>
                        {(item) => {
                          const application = applications.find((entry) => entry.id === item.id);
                          if (!application) return null;

                          return (
                            <KanbanCard key={application.id} {...item}>
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-sm">{application.companyName}</p>
                                    <p className="text-xs text-muted-foreground">{application.jobTitle}</p>
                                  </div>
                                  <Badge className={statusBadgeClass[application.status]}>
                                    {statusLabelMap[application.status]}
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <p className="flex items-center gap-1">
                                    <CalendarDays className="size-3" />
                                    {formatDisplayDate(application.applicationDate)}
                                  </p>
                                  <p>{application.location || "Location pending"}</p>
                                  <p>{application.salary || "Salary not specified"}</p>
                                  <p className="line-clamp-2">{application.notes || "No notes yet"}</p>
                                </div>
                              </div>
                            </KanbanCard>
                          );
                        }}
                      </KanbanCards>
                    </KanbanBoard>
                  )}
                </KanbanProvider>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Applications</CardTitle>
            <CardDescription>
              Edit details, change status directly, or remove entries from your pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {applications.map((application) => (
              <div
                key={application.id}
                className="grid gap-3 rounded-xl border border-border/70 p-4 lg:grid-cols-[1.5fr_1.2fr_1fr_1.2fr_auto] lg:items-center"
              >
                <div>
                  <p className="font-medium">{application.companyName}</p>
                  <p className="text-sm text-muted-foreground">{application.jobTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    Applied on {formatDisplayDate(application.applicationDate)}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{application.location || "No location"}</p>
                  <p>{application.salary || "No salary"}</p>
                </div>
                <Select
                  value={application.status}
                  onValueChange={(value) => handleStatusChange(application.id, value as ApplicationStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusColumns.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="line-clamp-2 text-sm text-muted-foreground">{application.notes || "No notes"}</p>
                <div className="flex items-center gap-2 lg:justify-end">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(application)}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this application?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes {application.companyName} - {application.jobTitle} from your board.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => handleDelete(application.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {applications.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No applications yet. Create your first entry to start tracking progress.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit application" : "Create application"}</DialogTitle>
            <DialogDescription>
              Track company, role, status, and all supporting details in one place.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company name</Label>
              <Input
                id="companyName"
                placeholder="Acme Inc"
                value={form.companyName}
                onChange={(event) => updateField("companyName", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input
                id="jobTitle"
                placeholder="Product Manager"
                value={form.jobTitle}
                onChange={(event) => updateField("jobTitle", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <DatePickerInput
                fieldLabel="Application date"
                id="applicationDate"
                value={form.applicationDate}
                onChange={(value) => updateField("applicationDate", value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => updateField("status", value as ApplicationStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusColumns.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Remote / City"
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                placeholder="$120,000"
                value={form.salary}
                onChange={(event) => updateField("salary", event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Interview context, recruiter details, prep reminders"
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <TrendingUp className="size-4" />
              {editingId ? "Save changes" : "Create application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
