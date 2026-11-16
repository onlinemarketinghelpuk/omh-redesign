import { DashboardLoading } from "@/components/dashboard/Loading";
import { SCREENS } from "@/lib/dashboard/screens";

/* Title and sentence from lib/dashboard/screens.ts, like every other screen,
   so the skeleton and the page cannot drift. */
export default function Loading() {
  return <DashboardLoading screen={SCREENS["integrations"]} />;
}
