import { UserDetailView } from "@shared/features/users/detail/user-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UserDetailView id={id} />;
}
