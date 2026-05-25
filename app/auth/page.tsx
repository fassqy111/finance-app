"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setMessage("");

    if (!email.trim() || password.length < 6) {
      setMessage("Укажи почту и пароль минимум 6 символов");
      setIsLoading(false);
      return;
    }

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    }

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: "Пользователь",
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setIsLoading(false);
        return;
      }

      setMessage(
        "Регистрация выполнена. Если Supabase попросит подтвердить почту, открой письмо и подтверди аккаунт."
      );

      setMode("login");
    }

    setIsLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#080A12] text-white p-4">
      <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center space-y-6">
        <header className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-emerald-400/25 via-blue-400/15 to-white/[0.04] text-3xl font-bold shadow-2xl shadow-black/40">
            ₽
          </div>

          <p className="mt-6 text-sm text-slate-400">Мои финансы</p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            {mode === "login" ? "Вход" : "Регистрация"}
          </h1>

          <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-400">
            Учет счетов, целей, операций, бюджетов и аналитики в одном месте
          </p>
        </header>

        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-5 shadow-2xl shadow-black/30">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-3xl bg-black/25 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-white text-neutral-950"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              Вход
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-white text-neutral-950"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="Почта"
              className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
            />

            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Пароль"
              className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
            />

            {message && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-3xl bg-white p-4 font-bold text-neutral-950 transition hover:bg-slate-200 disabled:opacity-60"
            >
              {isLoading
                ? "Загрузка..."
                : mode === "login"
                  ? "Войти"
                  : "Зарегистрироваться"}
            </button>
          </form>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-center">
            <p className="text-2xl">◼</p>
            <p className="mt-2 text-xs text-slate-400">Счета</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-center">
            <p className="text-2xl">▥</p>
            <p className="mt-2 text-xs text-slate-400">Аналитика</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-center">
            <p className="text-2xl">★</p>
            <p className="mt-2 text-xs text-slate-400">Цели</p>
          </div>
        </section>

        <p className="text-center text-xs leading-5 text-slate-600">
          Данные сохраняются в Supabase и будут доступны после входа на разных
          устройствах
        </p>
      </section>
    </main>
  );
}