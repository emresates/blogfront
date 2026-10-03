import { Suspense } from "react";
import { UserList } from "@/components/admin/users/UserList";
import { LoadingSkeleton } from "@/components/ui/primitives";
export const metadata = {
  title: "Users",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <UserList />
    </Suspense>
  );
}
