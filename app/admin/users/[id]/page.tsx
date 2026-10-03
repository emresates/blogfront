import { notFound } from "next/navigation";
import { UserDetail } from "@/components/admin/users/UserDetail";
export const metadata = {
  title: "User details",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(userId) || userId < 1)
    notFound();
  return <UserDetail key={userId} id={userId} />;
}
