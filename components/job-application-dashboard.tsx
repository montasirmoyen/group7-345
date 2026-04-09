"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, Pencil, Plus, Trash2, TrendingUp, FileText } from "lucide-react";

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
import { useAuth } from "@/lib/auth-context";
import {
  type ApplicationStatus,
  type JobApplication,
  type ApplicationFormData,
  type ContactInfo,
  addApplication,
  updateApplication,
  deleteApplication,
  batchUpdateStatuses,
  subscribeToApplications,
} from "@/lib/firestore-applications";
import {
  type DocumentMetadata,
  subscribeToDocuments,
} from "@/lib/firestore-documents";

type ApplicationForm = ApplicationFormData;

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

const emptyForm: ApplicationForm = {
  companyName: "",
  jobTitle: "",
  applicationDate: "",
  status: "apply",
  location: "",
  salary: "",
  notes: "",
  contactInfo: {
    name: "",
    email: "",
    phoneNumber: "",
    company: "",
    linkedInProfile: "",
  },
};

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatDisplayDate(value: string) {
  if (!value) return "N/A";
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function hasContactInfo(contactInfo: ContactInfo) {
  return Object.values(contactInfo).some((value) => value.trim().length > 0);
}

export function JobApplicationDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [form, setForm] = useState<ApplicationForm>({ ...emptyForm, applicationDate: getTodayDate() });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [locationFilter, setLocationFilter] = useState("");

  // Subscribe to applications from Firestore
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const unsubscribe = subscribeToApplications(user.uid, (apps) => {
      setApplications(apps);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [user]);

  // Subscribe to documents from Firestore
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToDocuments(user.uid, (docs) => {
      setDocuments(docs);
    });
    return unsubscribe;
  }, [user]);

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

  const filteredApplications = useMemo(() => {
  return applications.filter((app) => {
    const matchesSearch =
      searchQuery === "" ||
      app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.notes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || app.status === statusFilter;

    const matchesLocation =
      locationFilter === "" ||
      app.location.toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesLocation;
  });
}, [applications, searchQuery, statusFilter, locationFilter]);

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
      contactInfo: application.contactInfo,
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

  const updateContactField = <K extends keyof ContactInfo>(
    field: K,
    value: ContactInfo[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.companyName.trim() || !form.jobTitle.trim() || !form.applicationDate) {
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateApplication(user.uid, editingId, form);
      } else {
        await addApplication(user.uid, form);
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save application:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteApplication(user.uid, id);
    } catch (error) {
      console.error("Failed to delete application:", error);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!user) return;
    try {
      await updateApplication(user.uid, id, {
        contactInfo: {
          name: "",
          email: "",
          phoneNumber: "",
          company: "",
          linkedInProfile: "",
        },
      });
    } catch (error) {
      console.error("Failed to delete contact information:", error);
    }
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    if (!user) return;
    try {
      await updateApplication(user.uid, id, { status });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleKanbanDataChange = async (next: Array<{ id: string; column: string }>) => {
    if (!user) return;

    // Determine which items actually changed status
    const updates: Array<{ id: string; status: ApplicationStatus }> = [];
    for (const item of next) {
      const existing = applications.find((app) => app.id === item.id);
      if (existing && existing.status !== item.column) {
        updates.push({ id: item.id, status: item.column as ApplicationStatus });
      }
    }

    if (updates.length > 0) {
      // Optimistically update local state
      setApplications((prev) => {
        const statusById = new Map(next.map((item) => [item.id, item.column as ApplicationStatus]));
        return prev.map((application) => ({
          ...application,
          status: statusById.get(application.id) ?? application.status,
        }));
      });

      try {
        await batchUpdateStatuses(user.uid, updates);
      } catch (error) {
        console.error("Failed to update statuses:", error);
      }
    }
  };

  // Get linked documents for an application
  const getLinkedDocuments = (appId: string) => {
    return documents.filter(
      (doc) => doc.linkedApplicationIds && doc.linkedApplicationIds.includes(appId)
    );
  };

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

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

                          const linkedDocs = getLinkedDocuments(application.id);

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
                                  {hasContactInfo(application.contactInfo) && (
                                    <p className="line-clamp-2">
                                      Contact: {application.contactInfo.name || "N/A"}
                                      {application.contactInfo.email ? ` • ${application.contactInfo.email}` : ""}
                                    </p>
                                  )}
                                  <p className="line-clamp-2">{application.notes || "No notes yet"}</p>
                                  {linkedDocs.length > 0 && (
                                    <p className="flex items-center gap-1 text-primary">
                                      <FileText className="size-3" />
                                      {linkedDocs.length} document{linkedDocs.length !== 1 ? "s" : ""}
                                    </p>
                                  )}
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
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <Input
                  placeholder="Search by company, title, or keyword.."
                  value = {searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sm:max-w-xs"
                  />
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as ApplicationStatus | "all")}
                    >
                      <SelectTrigger className="sm:max-w-40">
                          <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                    <SelectContent>
                      <SelectItem value ="all">All Statuses</SelectItem>
                      {statusColumns.map((status) => (
                        <SelectItem key = {status.id} value = {status.id}>
                          {status.name}
                          </SelectItem>
                      ))}
                    </SelectContent>
                    </Select>
                    <Input
                    placeholder="Filter by location.."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="sm:max-w-xs"
                    />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredApplications.map((application) => {
              const linkedDocs = getLinkedDocuments(application.id);
              return (
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
                    {hasContactInfo(application.contactInfo) && (
                      <p className="text-xs text-muted-foreground">
                        Contact: {application.contactInfo.name || "N/A"}
                        {application.contactInfo.email ? ` • ${application.contactInfo.email}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{application.location || "No location"}</p>
                    <p>{application.salary || "No salary"}</p>
                    {linkedDocs.length > 0 && (
                      <p className="flex items-center gap-1 text-xs text-primary">
                        <FileText className="size-3" />
                        {linkedDocs.length} linked document{linkedDocs.length !== 1 ? "s" : ""}
                      </p>
                    )}
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
                    {hasContactInfo(application.contactInfo) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Delete contact
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete contact information?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This removes recruiter or hiring manager details from this application only.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleDeleteContact(application.id)}
                            >
                              Delete contact
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
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
              );
            })}
            {filteredApplications.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                {applications.length === 0
                ? "No applications yet. Create your first entry to start tracking progress."
                : "No applications match your filters."}
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
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input
                id="jobTitle"
                placeholder="Product Manager"
                value={form.jobTitle}
                onChange={(event) => updateField("jobTitle", event.target.value)}
                disabled={isSaving}
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
                disabled={isSaving}
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
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                placeholder="$120,000"
                value={form.salary}
                onChange={(event) => updateField("salary", event.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Interview context, recruiter details, prep reminders"
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <p className="text-sm font-medium">Contact information</p>
              <p className="text-xs text-muted-foreground">
                Add recruiter or hiring manager details for this application.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Name</Label>
              <Input
                id="contactName"
                placeholder="Jane Doe"
                value={form.contactInfo.name}
                onChange={(event) => updateContactField("name", event.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="jane@company.com"
                value={form.contactInfo.email}
                onChange={(event) => updateContactField("email", event.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhoneNumber">Phone Number</Label>
              <Input
                id="contactPhoneNumber"
                placeholder="+1 (555) 123-4567"
                value={form.contactInfo.phoneNumber}
                onChange={(event) => updateContactField("phoneNumber", event.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactCompany">Company</Label>
              <Input
                id="contactCompany"
                placeholder="Acme Inc"
                value={form.contactInfo.company}
                onChange={(event) => updateContactField("company", event.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="contactLinkedInProfile">LinkedIn Profile</Label>
              <Input
                id="contactLinkedInProfile"
                placeholder="https://www.linkedin.com/in/jane-doe"
                value={form.contactInfo.linkedInProfile}
                onChange={(event) => updateContactField("linkedInProfile", event.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <TrendingUp className="size-4" />
                  {editingId ? "Save changes" : "Create application"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
