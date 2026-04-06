import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export type DocumentMetadata = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  downloadURL: string;
  storagePath: string;
  linkedApplicationIds: string[];
  uploadedAt: string;
};

function documentsCollection(uid: string) {
  return collection(db, "users", uid, "documents");
}

function documentDoc(uid: string, docId: string) {
  return doc(db, "users", uid, "documents", docId);
}

export async function uploadDocument(
  uid: string,
  file: File
): Promise<string> {
  // Upload file to Firebase Storage
  const storagePath = `users/${uid}/documents/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  // Save metadata to Firestore
  const docRef = await addDoc(documentsCollection(uid), {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    downloadURL,
    storagePath,
    linkedApplicationIds: [],
    uploadedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function deleteDocument(
  uid: string,
  docId: string,
  storagePath: string
): Promise<void> {
  // Delete from Storage
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Failed to delete file from storage:", error);
  }

  // Delete metadata from Firestore
  await deleteDoc(documentDoc(uid, docId));
}

export async function linkDocumentToApplication(
  uid: string,
  docId: string,
  applicationId: string
): Promise<void> {
  await updateDoc(documentDoc(uid, docId), {
    linkedApplicationIds: arrayUnion(applicationId),
  });
}

export async function unlinkDocumentFromApplication(
  uid: string,
  docId: string,
  applicationId: string
): Promise<void> {
  await updateDoc(documentDoc(uid, docId), {
    linkedApplicationIds: arrayRemove(applicationId),
  });
}

export function subscribeToDocuments(
  uid: string,
  callback: (documents: DocumentMetadata[]) => void
): Unsubscribe {
  const q = query(documentsCollection(uid), orderBy("uploadedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const documents: DocumentMetadata[] = snapshot.docs.map((d) => ({
      id: d.id,
      fileName: d.data().fileName ?? "",
      fileType: d.data().fileType ?? "",
      fileSize: d.data().fileSize ?? 0,
      downloadURL: d.data().downloadURL ?? "",
      storagePath: d.data().storagePath ?? "",
      linkedApplicationIds: d.data().linkedApplicationIds ?? [],
      uploadedAt: d.data().uploadedAt?.toDate?.()?.toISOString?.() ?? "",
    }));
    callback(documents);
  });
}
