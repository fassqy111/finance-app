"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/BottomNav";

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const supabase = useMemo(() => createClient(), []);

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthPage = pathname === "/auth";

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!isMounted) return;

      setSession(data.session);
      setIsLoading(false);

      if (!data.session && !isAuthPage) {
        router.replace("/auth");
        return;
      }

      if (data.session && isAuthPage) {
        router.replace("/");
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (!nextSession && !isAuthPage) {
        router.replace("/auth");
      }

      if (nextSession && isAuthPage) {
        router.replace("/");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isAuthPage, router, supabase]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080A12] p-4 text-white">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl shadow-black/30">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-emerald-300" />
          <p className="font-semibold">Загрузка приложения</p>
          <p className="mt-1 text-sm text-slate-400">
            Проверяем вход в аккаунт
          </p>
        </div>
      </main>
    );
  }

  if (!session && !isAuthPage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080A12] p-4 text-white">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl shadow-black/30">
          <p className="font-semibold">Нужен вход</p>
          <p className="mt-1 text-sm text-slate-400">
            Перенаправляем на страницу авторизации
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      {children}
      {!isAuthPage && <BottomNav />}
    </>
  );
}