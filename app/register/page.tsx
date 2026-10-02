import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Hesap oluştur" };
export default function Page() {
  return (
    <Suspense>
      <AuthForm register />
    </Suspense>
  );
}
