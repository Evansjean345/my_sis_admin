import { OrganizationDetail } from "./_components/organization-detail";

/** Page serveur : lit les paramètres, puis délègue à la fiche (composant client). */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrganizationDetail id={id} />;
}
