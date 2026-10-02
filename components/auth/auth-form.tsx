"use client";
import Link from "next/link";
import { safeReturnPath } from "@/lib/api/proxy-policy";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Code2 } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/client";
import { useAuth } from "./auth-provider";
import { useToast } from "@/components/ui/providers";
import { Field } from "@/components/ui/primitives";
export function AuthForm({ register = false }: { register?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { refresh } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      if (register)
        await authApi.register(
          String(form.get("name")).trim(),
          String(form.get("email")).trim(),
          String(form.get("password")),
        );
      else
        await authApi.login(
          String(form.get("email")).trim(),
          String(form.get("password")),
        );
      await refresh();
      toast(register ? "Hesabın oluşturuldu. Hoş geldin!" : "Giriş başarılı.");
      const next = params.get("next");
      router.replace(safeReturnPath(next));
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page container">
      <aside className="auth-aside">
        <Code2 size={35} />
        <div>
          <div className="eyebrow">FİKİRLER BURADA BULUŞUR</div>
          <h1>
            Meraklı zihinler.
            <br />
            Yeni ihtimaller.
          </h1>
          <p>Birlikte öğrenmek, tek başına bilmekten daha güzel.</p>
        </div>
        <span className="small">MARGIN / BİRLİKTE ÜRETELİM</span>
      </aside>
      <div className="auth-form">
        <div className="eyebrow">
          {register ? "TOPLULUĞA KATIL" : "KALDIĞIN YERDEN"}
        </div>
        <h1>{register ? "Yeni bir başlangıç." : "Tekrar hoş geldin."}</h1>
        <p>
          {register
            ? "Oku, beğen ve sohbete kendi sesini ekle."
            : "Fikirler ve yeni keşifler seni bekliyor."}
        </p>
        <form onSubmit={submit}>
          {register && (
            <Field
              label="Ad soyad"
              name="name"
              required
              maxLength={100}
              autoComplete="name"
            />
          )}
          <Field
            label="E-posta"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
          <Field
            label="Şifre"
            name="password"
            type="password"
            required
            minLength={register ? 8 : 1}
            autoComplete={register ? "new-password" : "current-password"}
          />
          {register && (
            <p className="small muted">
              En az 8 karakter kullan. Sunucunun şifre kuralları ayrıca
              uygulanır.
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button full" disabled={busy}>
            {busy ? "Lütfen bekle…" : register ? "Hesap oluştur" : "Giriş yap"}
            <ArrowUpRight size={17} />
          </button>
        </form>
        <p className="auth-switch">
          {register ? "Zaten hesabın var mı?" : "Henüz hesabın yok mu?"}{" "}
          <Link href={register ? "/login" : "/register"}>
            {register ? "Giriş yap" : "Aramıza katıl"}
          </Link>
        </p>
      </div>
    </div>
  );
}
