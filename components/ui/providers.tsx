"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
const ToastContext = createContext<(message: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);
export function Providers({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<{ id: number; text: string }[]>([]);
  const toast = useCallback((text: string) => {
    const id = Date.now();
    setMessages((m) => [...m, { id, text }]);
    setTimeout(() => setMessages((m) => m.filter((x) => x.id !== id)), 5000);
  }, []);
  return (
    <ToastContext.Provider value={toast}>
      <AuthProvider>{children}</AuthProvider>
      <div className="toasts" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className="toast">
            {m.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
