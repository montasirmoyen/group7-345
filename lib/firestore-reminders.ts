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
  | "interview";

export type ReminderStatus = "upcoming" | "passed";

export type Reminder = {
  id: string;
  title: string;
  type: ReminderType;
  date: string;
  applicationId: string;
  applicationName: string;
  notes: string;
};

export type ReminderFormData = Omit<Reminder, "id">;

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
  const q = query(remindersCollection(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const reminders: Reminder[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title ?? "",
      type: doc.data().type ?? "follow-up",
      date: doc.data().date ?? "",
      applicationId: doc.data().applicationId ?? "",
      applicationName: doc.data().applicationName ?? "",
      notes: doc.data().notes ?? "",
    }));
    callback(reminders);
  });
}

export function getReminderStatus(date: string): ReminderStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reminderDate = new Date(`${date}T00:00:00`);
  return reminderDate < today ? "passed" : "upcoming";
}