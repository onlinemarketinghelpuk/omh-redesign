import { DashboardLoading } from "@/components/dashboard/Loading";
import { SCREENS } from "@/lib/dashboard/screens";

/* A channel's page sits under the Control panel, and loads like it. */
export default function Loading() {
  return <DashboardLoading screen={SCREENS["control"]} />;
}
