"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Upload,
  Trash2,
  Link,
  Unlink,
  Download,
  Loader2,
  File,
  FileImage,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/lib/auth-context";
import {
  type DocumentMetadata,
  uploadDocument,
  deleteDocument,
  linkDocumentToApplication,
  unlinkDocumentFromApplication,
  subscribeToDocuments,
} from "@/lib/firestore-documents";
import {
  type JobApplication,
  subscribeToApplications,
} from "@/lib/firestore-applications";

const ACCEPTED_FILE_TYPES =
  ".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return <FileImage className="size-5 text-sky-500" />;
  if (fileType.includes("pdf")) return <FileText className="size-5 text-rose-500" />;
  return <File className="size-5 text-blue-500" />;
}

function formatDate(iso: string) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DocumentManager() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string>("");

  // Subscribe to documents
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const unsubscribe = subscribeToDocuments(user.uid, (docs) => {
      setDocuments(docs);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [user]);

  // Subscribe to applications (for linking)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToApplications(user.uid, (apps) => {
      setApplications(apps);
    });
    return unsubscribe;
  }, [user]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.length) return;

    setIsUploading(true);
    try {
      const promises = Array.from(e.target.files).map((file) =>
        uploadDocument(user.uid, file)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Failed to upload:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (docMeta: DocumentMetadata) => {
    if (!user) return;
    try {
      await deleteDocument(user.uid, docMeta.id, docMeta.storagePath);
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleOpenLinkDialog = (docId: string) => {
    setSelectedDocId(docId);
    setSelectedAppId("");
    setLinkDialogOpen(true);
  };

  const handleLinkDocument = async () => {
    if (!user || !selectedDocId || !selectedAppId) return;
    try {
      await linkDocumentToApplication(user.uid, selectedDocId, selectedAppId);
      setLinkDialogOpen(false);
    } catch (error) {
      console.error("Failed to link:", error);
    }
  };

  const handleUnlinkDocument = async (docId: string, appId: string) => {
    if (!user) return;
    try {
      await unlinkDocumentFromApplication(user.uid, docId, appId);
    } catch (error) {
      console.error("Failed to unlink:", error);
    }
  };

  const getApplicationName = (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    return app ? `${app.companyName} — ${app.jobTitle}` : "Unknown Application";
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
              <CardTitle className="text-2xl">Document Manager</CardTitle>
              <CardDescription>
                Upload, manage, and link resumes, cover letters, and other documents to your applications.
              </CardDescription>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_FILE_TYPES}
                className="hidden"
                onChange={handleFileChange}
              />
              <Button onClick={handleUploadClick} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Upload document
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Card size="sm" className="border border-border/70">
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Total Documents</p>
                  <p className="text-2xl font-semibold">{documents.length}</p>
                </CardContent>
              </Card>
              <Card size="sm" className="border border-border/70">
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Linked to Applications</p>
                  <p className="text-2xl font-semibold">
                    {documents.filter((d) => d.linkedApplicationIds.length > 0).length}
                  </p>
                </CardContent>
              </Card>
              <Card size="sm" className="border border-border/70">
                <CardContent className="pt-1">
                  <p className="text-xs text-muted-foreground">Unlinked</p>
                  <p className="text-2xl font-semibold">
                    {documents.filter((d) => d.linkedApplicationIds.length === 0).length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Documents</CardTitle>
            <CardDescription>
              View, download, link, or remove your uploaded documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.map((docMeta) => (
              <div
                key={docMeta.id}
                className="rounded-xl border border-border/70 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {getFileIcon(docMeta.fileType)}
                    <div>
                      <p className="font-medium text-sm">{docMeta.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(docMeta.fileSize)} · Uploaded{" "}
                        {formatDate(docMeta.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={docMeta.downloadURL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="size-4" />
                        Download
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenLinkDialog(docMeta.id)}
                    >
                      <Link className="size-4" />
                      Link
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
                          <AlertDialogTitle>Delete this document?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently removes &quot;{docMeta.fileName}&quot; from
                            your storage and unlinks it from all applications.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => handleDelete(docMeta)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Linked applications */}
                {docMeta.linkedApplicationIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-8">
                    {docMeta.linkedApplicationIds.map((appId) => (
                      <Badge
                        key={appId}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        <span className="text-xs">
                          {getApplicationName(appId)}
                        </span>
                        <button
                          onClick={() => handleUnlinkDocument(docMeta.id, appId)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted"
                          title="Unlink"
                        >
                          <Unlink className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {documents.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No documents yet. Upload your first resume or cover letter to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Link Document Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link document to application</DialogTitle>
            <DialogDescription>
              Choose which job application to link this document to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {applications.length > 0 ? (
              <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an application" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.companyName} — {app.jobTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                No applications found. Create an application first to link documents.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkDocument}
              disabled={!selectedAppId}
            >
              <Link className="size-4" />
              Link document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
