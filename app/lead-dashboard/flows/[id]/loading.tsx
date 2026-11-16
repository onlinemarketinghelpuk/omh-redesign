import { DashboardLoading } from "@/components/dashboard/Loading";
import { SCREENS } from "@/lib/dashboard/screens";

/* The builder sits under the Control Panel in the rail, and loads like it. */
export default function Loading() {
  return <DashboardLoading screen={SCREENS["control"]} />;
}
