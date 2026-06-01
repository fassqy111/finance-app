"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

const settingsItems = [
  {
    href: "/profile/accounts",
    title: "Счета",
    description: "Управление счетами и балансами",
    icon: "▣",
    color: "bg-blue-400/15 text-blue-300",
  },
  {
    href: "/profile/goals",
    title: "Цели",
    description: "Накопления и финансовые цели",
    icon: "★",
    color: "bg-purple-400/15 text-purple-300",
  },
  {
    href: "/profile/capital",
    title: "Капитал по месяцам",
    description: "История капитала и чистого дохода",
    icon: "↗",
    color: "bg-emerald-400/15 text-emerald-300",
  },
  {
    href: "/profile/budgets",
    title: "Бюджеты",
    description: "Лимиты расходов по категориям",
    icon: "◫",
    color: "bg-orange-400/15 text-orange-300",
  },
  {
    href: "/profile/categories",
    title: "Категории",
    description: "Категории доходов и расходов",
    icon: "◈",
    color: "bg-pink-400/15 text-pink-300",
  },
  {
    href: "/profile/templates",
    title: "Шаблоны автопереводов",
    description: "Регулярные доходы, расходы и переводы",
    icon: "↻",
    color: "bg-cyan-400/15 text-cyan-300",
  },
  {
    href: "/profile/import",
    title: "Импорт / Экспорт",
    description: "Перенос истории операций и выгрузка данных",
    icon: "⇅",
    color: "bg-teal-400/15 text-teal-300",
  },
  {
    href: "/profile/trash",
    title: "Корзина",
    description: "Восстановление удаленных данных",
    icon: "⌫",
    color: "bg-rose-400/15 text-rose-300",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#080A12] text-white p-4 pb-24">
      <section className="mx-auto w-full max-w-md space-y-6 sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <header className="pt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">Мои финансы</p>
              <h1 className="mt-1 text-3xl font-bold">Профиль</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Настройки приложения, управление справочниками, историей
                капитала, импортом и удаленными данными.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <ThemeToggle />

              <button
                type="button"
                onClick={signOut}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08]"
              >
                Выйти
              </button>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-400/20 via-emerald-400/10 to-white/[0.04] p-5 shadow-2xl shadow-black/30">
          <p className="text-sm text-slate-300">Настройки приложения</p>

          <p className="mt-2 text-4xl font-bold tracking-tight">
            Управление
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Разделы</p>
              <p className="mt-1 text-xl font-semibold">
                {settingsItems.length}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Тема</p>
              <p className="mt-1 text-xl font-semibold">Светлая / темная</p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Данные</p>
              <p className="mt-1 text-xl font-semibold">Supabase</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {settingsItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.08]"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold ${item.color}`}
                >
                  {item.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="truncate text-lg font-semibold">
                      {item.title}
                    </h2>

                    <span className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-white">
                      →
                    </span>
                  </div>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}