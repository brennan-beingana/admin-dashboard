import { redirect } from "next/navigation";

// Live dispatch is the default view; history is a deliberate second click.
export default function RidesPage() {
  redirect("/rides/live");
}
