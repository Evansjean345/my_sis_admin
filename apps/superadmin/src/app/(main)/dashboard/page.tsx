import { redirect } from "next/navigation";

/** `/dashboard` → accueil de l'espace Super Admin (URL historique conservée). */
export default function Page() {
  redirect("/dashboard/default");
}
