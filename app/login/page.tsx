import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Giriş yap" };
export default function Page() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
