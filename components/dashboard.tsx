import { JobApplicationDashboard } from "@/components/job-application-dashboard";
import { RemindersDashboard } from "@/components/ui/reminders-dashboard";

export function Dashboard() {
  return (
    <>
      <JobApplicationDashboard />
      <RemindersDashboard />
    </>
  );
}