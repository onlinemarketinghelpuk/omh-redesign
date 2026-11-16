import { DashboardLoading } from "@/components/dashboard/Loading";
import { SCREENS } from "@/lib/dashboard/screens";

/* Title and sentence from lib/dashboard/screens.ts, like every other screen. */
export default function Loading() {
  return <DashboardLoading screen={SCREENS["agent"]} />;
}
