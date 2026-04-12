"use client";

import { useEffect, useMemo, useState } from "react";
import emailjs from "@emailjs/browser";
import {
  Bell,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

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
  type Reminder,
  type ReminderFormData,
  type ReminderType,
  addReminder,
  updateReminder,
  deleteReminder,
  subscribeToReminders,
  getReminderStatus,
} from "@/lib/firestore-reminders";
import { type JobApplication, subscribeToApplications } from "@/lib/firestore-applications";

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

const emailsSentThisSession = new Set<string>();

const reminderTypes: Array<{ id: ReminderType; name: string }> = [
  { id: "deadline", name: "Application Deadline" },
  { id: "follow-up", name: "Follow-up" },
  { id: "thank-you", name: "Thank-you Email" },
  { id: "interview", name: "Interview Date" },
];

const reminderTypeBadgeClass: Record<ReminderType, string> = {
  deadline: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  "follow-up": "bg-blue-500/12 text-blue-700 dark:text-blue-300",
  "thank-you": "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  interview: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
};

const emptyForm: ReminderFormData = {
  title: "",
  type: "follow-up",
  date: "",
  applicationId: "",
  applicationName: "",
  notes: "",
};

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatDisplayDate(value: string) {
  if (!value) return "N/A";
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export function RemindersDashboard() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [form, setForm] = useState<ReminderFormData>({ ...emptyForm, date: getTodayDate() });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}, []);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const unsubscribe = subscribeToReminders(user.uid, (data) => {
      setReminders(data);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToApplications(user.uid, (apps) => {
      setApplications(apps);
    });
    return unsubscribe;
  }, [user]);

  // Check for upcoming/passed reminders and send emails
  useEffect(() => {
    if (!user?.email || reminders.length === 0) return;

    const sentKey = `reminder-emails-sent:${user.uid}`;

    reminders.forEach((reminder) => {
        if (emailsSentThisSession.has(reminder.id)) return;
        
        const sentKey = `reminder-emails-sent:${user.uid}`;
        const persisted: string[] = JSON.parse(localStorage.getItem(sentKey) ?? "[]");
        if (persisted.includes(reminder.id)) return;

        const status = getReminderStatus(reminder.date);
        const today = new Date().toISOString().split("T")[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

        if (reminder.date === today || reminder.date === tomorrow || status === "passed") {
            emailsSentThisSession.add(reminder.id); // block immediately
            emailjs
            .send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                {
                to_email: user.email,
                title: reminder.title,
                type: reminderTypes.find((t) => t.id === reminder.type)?.name ?? reminder.type,
                application_name: reminder.applicationName || "N/A",
                date: formatDisplayDate(reminder.date),
                notes: reminder.notes || "No notes",
                },
                EMAILJS_PUBLIC_KEY
            )
            .then(() => {
                const current: string[] = JSON.parse(localStorage.getItem(sentKey) ?? "[]");
                if (!current.includes(reminder.id)) {
                localStorage.setItem(sentKey, JSON.stringify([...current, reminder.id]));
                }
            })
            .catch((err) => console.error("EmailJS error:", err));
        }
        });
  }, [reminders, user]);

  const upcomingCount = useMemo(
    () => reminders.filter((r) => getReminderStatus(r.date) === "upcoming").length,
    [reminders]
  );

  const passedCount = useMemo(
    () => reminders.filter((r) => getReminderStatus(r.date) === "passed").length,
    [reminders]
  );

  const resetForm = () => {
    setForm({ ...emptyForm, date: getTodayDate() });
    setEditingId(null);
  };

  const handleCreateClick = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEditClick = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setForm({
      title: reminder.title,
      type: reminder.type,
      date: reminder.date,
      applicationId: reminder.applicationId,
      applicationName: reminder.applicationName,
      notes: reminder.notes,
    });
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  const updateField = <K extends keyof ReminderFormData>(
    field: K,
    value: ReminderFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplicationSelect = (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    setForm((prev) => ({
      ...prev,
      applicationId: appId,
      applicationName: app ? `${app.companyName} - ${app.jobTitle}` : "",
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.title.trim() || !form.date) return;

    setIsSaving(true);
    try {
      if (editingId) {
        await updateReminder(user.uid, editingId, form);
      } else {
        await addReminder(user.uid, form);
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save reminder:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteReminder(user.uid, id);
    } catch (error) {
      console.error("Failed to delete reminder:", error);
    }
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
        {/* Stats */}
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Reminders</CardTitle>
              <CardDescription>
                Track deadlines, follow-ups, thank-you emails, and interview dates.
              </CardDescription>
            </div>
            <Button onClick={handleCreateClick}>
              <Plus className="size-4" />
              Add reminder
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card size="sm" className="border border-border/70">
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Total Reminders</p>
                  <p className="text-2xl font-semibold">{reminders.length}</p>
                </CardContent>
              </Card>
              <Card size="sm" className="border border-border/70">
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                    {upcomingCount}
                  </p>
                </CardContent>
              </Card>
              <Card size="sm" className="border border-border/70">
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Passed</p>
                  <p className="text-2xl font-semibold text-rose-600 dark:text-rose-400">
                    {passedCount}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Reminders List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Reminders</CardTitle>
            <CardDescription>
              Email notifications are sent automatically for reminders due today, tomorrow, or already passed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reminders.map((reminder) => {
              const status = getReminderStatus(reminder.date);
              return (
                <div
                  key={reminder.id}
                  className="grid gap-3 rounded-xl border border-border/70 p-4 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{reminder.title}</p>
                      {status === "upcoming" ? (
                        <CheckCircle className="size-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="size-4 text-rose-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {reminder.applicationName || "No application linked"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDisplayDate(reminder.date)}
                    </p>
                  </div>
                  <Badge className={reminderTypeBadgeClass[reminder.type]}>
                    {reminderTypes.find((t) => t.id === reminder.type)?.name}
                  </Badge>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {reminder.notes || "No notes"}
                  </p>
                  <div className="flex items-center gap-2 lg:justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(reminder)}>
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
                          <AlertDialogTitle>Delete this reminder?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes "{reminder.title}" from your reminders.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => handleDelete(reminder.id)}
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
            {reminders.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No reminders yet. Add your first reminder to stay on top of your job search.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit reminder" : "Create reminder"}</DialogTitle>
            <DialogDescription>
              Set a reminder for deadlines, follow-ups, thank-you emails, or interview dates.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Reminder title</Label>
              <Input
                id="title"
                placeholder="Follow up with Google recruiter"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(value) => updateField("type", value as ReminderType)}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {reminderTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <DatePickerInput
                fieldLabel="Date"
                id="date"
                value={form.date}
                onChange={(value) => updateField("date", value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Linked application (optional)</Label>
              <Select
                value={form.applicationId}
                onValueChange={handleApplicationSelect}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an application" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.companyName} - {app.jobTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional context..."
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
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
                  <Bell className="size-4" />
                  {editingId ? "Save changes" : "Create reminder"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}