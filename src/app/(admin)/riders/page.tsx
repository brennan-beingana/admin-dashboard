import { redirect } from "next/navigation";

// The verification queue is the tab with an SLA, so it's where /riders lands.
export default function RidersPage() {
  redirect("/riders/verification");
}
