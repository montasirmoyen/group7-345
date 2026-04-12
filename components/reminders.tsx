"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, Circle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { useAuth } from "@/lib/auth-context";
import {
  type Reminder,
  type ReminderFormData,
  type ReminderType,
  reminderTypeLabels,
  addReminder,
  updateReminder,
  deleteReminder,
  subscribeToReminders,
  getReminderStatus,
} from "@/lib/firestore-reminders";
import {
  type JobApplication,
  subscribeToApplications,
} from "@/lib/firestore-applications";

const reminderTypes: ReminderType[] = [
  "deadline",
  "follow-up",
  "thank-you",
  "interview",
  "other",
];

const statusConfig = {
  overdue: {
    label: "Overdue",
    badgeClass: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  },
  today: {
    label: "Due Today",
    badgeClass: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  },
  upcoming: {
    label: "Upcoming",
    badgeClass: "bg-blue-500/12 text-blue-700 dark:text-blue-300",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-muted text-muted-foreground",
  },
};

const emptyForm: ReminderFormData = {
  type: "follow-up",
  message: "",
  dueDate: "",
  applicationId: "",
  completed: false,
};

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function formatDisplayDate(value: string) {
  if (!value) return "N/A";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RemindersPanel() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReminderFormData>({
    ...emptyForm,
    dueDate: getTodayDate(),
  });
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const unsub1 = subscribeToReminders(user.uid, (data) => {
      setReminders(data);
      setIsLoading(false);
    });
    const unsub2 = subscribeToApplications(user.uid, setApplications);
    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  // Toast alert for overdue reminders on first load
  useEffect(() => {
    if (isLoading) return;
    const overdueCount = reminders.filter(
      (r) => getReminderStatus(r.dueDate, r.completed) === "overdue"
    ).length;
    if (overdueCount > 0) {
      toast.warning(
        `You have ${overdueCount} overdue reminder${overdueCount > 1 ? "s" : ""}.`
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const stats = useMemo(() => {
    const overdue = reminders.filter(
      (r) => getReminderStatus(r.dueDate, r.completed) === "overdue"
    ).length;
    const today = reminders.filter(
      (r) => getReminderStatus(r.dueDate, r.completed) === "today"
    ).length;
    const upcoming = reminders.filter(
      (r) => getReminderStatus(r.dueDate, r.completed) === "upcoming"
    ).length;
    const completed = reminders.filter((r) => r.completed).length;
    return { overdue, today, upcoming, completed, total: reminders.length };
  }, [reminders]);

  const visibleReminders = useMemo(
    () =>
      showCompleted
        ? reminders
        : reminders.filter((r) => !r.completed),
    [reminders, showCompleted]
  );

  const resetForm = () => {
    setForm({ ...emptyForm, dueDate: getTodayDate() });
    setEditingId(null);
  };

  const handleCreateClick = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEditClick = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setForm({
      type: reminder.type,
      message: reminder.message,
      dueDate: reminder.dueDate,
      applicationId: reminder.applicationId,
      completed: reminder.completed,
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

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.message.trim() || !form.dueDate) {
      toast.error("Please fill in the message and due date.");
      return;
    }
    setIsSaving(true);
    try {
      if (editingId) {
        await updateReminder(user.uid, editingId, form);
        toast.success("Reminder updated.");
      } else {
        await addReminder(user.uid, form);
        toast.success("Reminder created.");
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to save reminder. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async (reminder: Reminder) => {
    if (!user) return;
    try {
      await updateReminder(user.uid, reminder.id, {
        completed: !reminder.completed,
      });
    } catch {
      toast.error("Failed to update reminder.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteReminder(user.uid, id);
      toast.success("Reminder deleted.");
    } catch {
      toast.error("Failed to delete reminder.");
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
        {/* Header + Stats */}
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Bell className="size-5" />
                Reminders
              </CardTitle>
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card size="sm" className="border border-rose-500/30">
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-semibold text-rose-600 dark:text-rose-400">
                    {stats.overdue}
                  </p>
                </CardContent>
              </Card>
              <Card size="sm" className="border border-amber-500/30">
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Due Today</p>
                  <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                    {stats.today}
                  </p>
                </CardContent>
              </Card>
              <Card size="sm" className="border border-blue-500/30">
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                    {stats.upcoming}
                  </p>
                </CardContent>
              </Card>
              <Card size="sm" className="border border-border/70">
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-2xl font-semibold">{stats.completed}</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Reminders List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Reminders</CardTitle>
              <CardDescription>
                Click the circle to mark a reminder as complete.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompleted((v) => !v)}
            >
              {showCompleted ? "Hide completed" : "Show completed"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleReminders.map((reminder) => {
              const status = getReminderStatus(reminder.dueDate, reminder.completed);
              const config = statusConfig[status];
              const linkedApp = applications.find(
                (a) => a.id === reminder.applicationId
              );

              return (
                <div
                  key={reminder.id}
                  className={`flex items-start gap-3 rounded-xl border p-4 transition-opacity ${
                    reminder.completed ? "opacity-50" : ""
                  } ${
                    status === "overdue"
                      ? "border-rose-500/30"
                      : status === "today"
                      ? "border-amber-500/30"
                      : "border-border/70"
                  }`}
                >
                  <button
                    onClick={() => handleToggleComplete(reminder)}
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={reminder.completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {reminder.completed ? (
                      <CheckCircle2 className="size-5 text-emerald-500" />
                    ) : (
                      <Circle className="size-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge className={config.badgeClass}>{config.label}</Badge>
                      <Badge variant="outline">
                        {reminderTypeLabels[reminder.type]}
                      </Badge>
                    </div>
                    <p
                      className={`text-sm font-medium ${
                        reminder.completed ? "line-through" : ""
                      }`}
                    >
                      {reminder.message}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {formatDisplayDate(reminder.dueDate)}
                      </span>
                      {linkedApp && (
                        <span>
                          {linkedApp.companyName} — {linkedApp.jobTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(reminder)}
                    >
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
                            This will permanently remove the reminder.
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

            {visibleReminders.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                {reminders.length === 0
                  ? "No reminders yet. Add one to start tracking deadlines and follow-ups."
                  : "No active reminders. All caught up!"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit reminder" : "Create reminder"}</DialogTitle>
            <DialogDescription>
              Set a date and message for your reminder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reminder type</Label>
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
                    <SelectItem key={type} value={type}>
                      {reminderTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderMessage">Message</Label>
              <Textarea
                id="reminderMessage"
                placeholder="e.g. Send thank-you email to recruiter at Stripe"
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderDueDate">Due date</Label>
              <Input
                id="reminderDueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => updateField("dueDate", e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label>Link to application (optional)</Label>
              <Select
                value={form.applicationId || "none"}
                onValueChange={(value) =>
                  updateField("applicationId", value === "none" ? "" : value)
                }
                disabled={isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {applications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.companyName} — {app.jobTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : editingId ? (
                "Save changes"
              ) : (
                "Create reminder"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
