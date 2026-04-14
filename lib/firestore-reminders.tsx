import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ReminderType =
  | "deadline"
  | "follow-up"
  | "thank-you"
  | "interview"
  | "other";

export type Reminder = {
  id: string;
  type: ReminderType;
  message: string;
  dueDate: string; // YYYY-MM-DD
  applicationId: string; // optional link to an application (empty string = none)
  completed: boolean;
};

export type ReminderFormData = Omit<Reminder, "id">;

export const reminderTypeLabels: Record<ReminderType, string> = {
  deadline: "Application Deadline",
  "follow-up": "Follow-up",
  "thank-you": "Thank-you Email",
  interview: "Interview",
  other: "Other",
};

function remindersCollection(uid: string) {
  return collection(db, "users", uid, "reminders");
}

function reminderDoc(uid: string, reminderId: string) {
  return doc(db, "users", uid, "reminders", reminderId);
}

export async function addReminder(
  uid: string,
  data: ReminderFormData
): Promise<string> {
  const docRef = await addDoc(remindersCollection(uid), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateReminder(
  uid: string,
  reminderId: string,
  data: Partial<ReminderFormData>
): Promise<void> {
  await updateDoc(reminderDoc(uid, reminderId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteReminder(
  uid: string,
  reminderId: string
): Promise<void> {
  await deleteDoc(reminderDoc(uid, reminderId));
}

export function subscribeToReminders(
  uid: string,
  callback: (reminders: Reminder[]) => void
): Unsubscribe {
  const q = query(remindersCollection(uid), orderBy("dueDate", "asc"));
  return onSnapshot(q, (snapshot) => {
    const reminders: Reminder[] = snapshot.docs.map((d) => ({
      id: d.id,
      type: (d.data().type as ReminderType) ?? "other",
      message: d.data().message ?? "",
      dueDate: d.data().dueDate ?? "",
      applicationId: d.data().applicationId ?? "",
      completed: d.data().completed ?? false,
    }));
    callback(reminders);
  });
}

export function getReminderStatus(
  dueDate: string,
  completed: boolean
): "completed" | "overdue" | "today" | "upcoming" {
  if (completed) return "completed";
  const today = new Date().toISOString().split("T")[0];
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "today";
  return "upcoming";
}