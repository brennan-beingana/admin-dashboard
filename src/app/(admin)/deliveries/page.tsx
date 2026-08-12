import { redirect } from "next/navigation";

// Parcels in flight are the default view; history is a deliberate second click.
export default function DeliveriesPage() {
  redirect("/deliveries/live");
}
