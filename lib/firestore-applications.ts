import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ApplicationStatus =
  | "apply"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected";

export type ContactInfo = {
  name: string;
  email: string;
  phoneNumber: string;
  company: string;
  linkedInProfile: string;
};

export type JobApplication = {
  id: string;
  companyName: string;
  jobTitle: string;
  applicationDate: string;
  status: ApplicationStatus;
  location: string;
  salary: string;
  notes: string;
  jobDescription: string;
  contactInfo: ContactInfo;
};

export type ApplicationFormData = Omit<JobApplication, "id">;

function applicationsCollection(uid: string) {
  return collection(db, "users", uid, "applications");
}

function applicationDoc(uid: string, appId: string) {
  return doc(db, "users", uid, "applications", appId);
}

export async function addApplication(
  uid: string,
  data: ApplicationFormData
): Promise<string> {
  const docRef = await addDoc(applicationsCollection(uid), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateApplication(
  uid: string,
  appId: string,
  data: Partial<ApplicationFormData>
): Promise<void> {
  await updateDoc(applicationDoc(uid, appId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteApplication(
  uid: string,
  appId: string
): Promise<void> {
  await deleteDoc(applicationDoc(uid, appId));
}

export async function batchUpdateStatuses(
  uid: string,
  updates: Array<{ id: string; status: ApplicationStatus }>
): Promise<void> {
  const batch = writeBatch(db);
  for (const update of updates) {
    batch.update(applicationDoc(uid, update.id), {
      status: update.status,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export function subscribeToApplications(
  uid: string,
  callback: (applications: JobApplication[]) => void
): Unsubscribe {
  const q = query(applicationsCollection(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const applications: JobApplication[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      companyName: doc.data().companyName ?? "",
      jobTitle: doc.data().jobTitle ?? "",
      applicationDate: doc.data().applicationDate ?? "",
      status: doc.data().status ?? "apply",
      location: doc.data().location ?? "",
      salary: doc.data().salary ?? "",
      notes: doc.data().notes ?? "",
      jobDescription: doc.data().jobDescription ?? "",
      contactInfo: {
        name: doc.data().contactInfo?.name ?? "",
        email: doc.data().contactInfo?.email ?? "",
        phoneNumber: doc.data().contactInfo?.phoneNumber ?? "",
        company: doc.data().contactInfo?.company ?? "",
        linkedInProfile: doc.data().contactInfo?.linkedInProfile ?? "",
      },
    }));
    callback(applications);
  });
}
