"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFinance } from "@/context/FinanceContext";
import { createClient } from "@/lib/supabase/client";

function getTrashTypeLabel(type: string) {
  if (type === "operation") return "Операция";
  if (type === "account") return "Счет";
  if (type === "goal") return "Цель";
  if (type === "budget") return "Бюджет";
  if (type === "category") return "Категория";
  if (type === "template") return "Шаблон";

  return "Элемент";
}

function getTrashTypeIcon(type: string) {
  if (type === "operation") return "⇄";
  if (type === "account") return "◼";
  if (type === "goal") return "★";
  if (type === "budget") return "%";
  if (type === "category") return "◌";
  if (type === "template") return "↻";

  return "•";
}

function getTrashTypeColor(type: string) {
  if (type === "operation") return "bg-blue-400/15 text-blue-300";
  if (type === "account") return "bg-emerald-400/15 text-emerald-300";
  if (type === "goal") return "bg-purple-400/15 text-purple-300";
  if (type === "budget") return "bg-orange-400/15 text-orange-300";
  if (type === "category") return "bg-pink-400/15 text-pink-300";
  if (type === "template") return "bg-cyan-400/15 text-cyan-300";

  return "bg-white/[0.06] text-slate-300";
}

const settingsItems = [

    {
    href: "/profile/import",
    title: "Импорт / Экспорт",
    description: "Перенос истории операций и выгрузка данных",
    icon: "⇅",
    color: "bg-cyan-400/15 text-cyan-300",
  },
  
  {
    href: "/profile/accounts",
    title: "Управление счетами",
    description: "Добавление, редактирование и удаление счетов",
    icon: "◼",
    color: "bg-emerald-400/15 text-emerald-300",
  },
  {
    href: "/profile/goals",
    title: "Управление целями",
    description: "Накопления, цели и прогресс",
    icon: "★",
    color: "bg-purple-400/15 text-purple-300",
  },
  {
    href: "/profile/budgets",
    title: "Управление бюджетами",
    description: "Лимиты по категориям на месяц",
    icon: "%",
    color: "bg-orange-400/15 text-orange-300",
  },
  {
    href: "/profile/categories",
    title: "Категории операций",
    description: "Доходы и расходы по категориям",
    icon: "◌",
    color: "bg-pink-400/15 text-pink-300",
  },
  {
    href: "/profile/templates",
    title: "Шаблоны автопереводов",
    description: "Повторяющиеся доходы, расходы и переводы",
    icon: "↻",
    color: "bg-blue-400/15 text-blue-300",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const {
    accounts,
    goals,
    operations,
    budgets,
    categories,
    recurringTemplates,
    trashItems,
    restoreTrashItem,
    deleteTrashItemForever,
    clearTrash,
  } = useFinance();

  const [email, setEmail] = useState("Не выполнен вход");

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (data.user?.email) {
        setEmail(data.user.email);
      }
    }

    loadUser();
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#080A12] text-white p-4 pb-24">
      <section className="mx-auto w-full max-w-md space-y-6 sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <header className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Мои финансы</p>
              <h1 className="mt-1 text-3xl font-bold">Профиль</h1>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.08]"
            >
              Выйти
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-400/20 via-blue-400/10 to-white/[0.04] p-5 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.75rem] bg-white/10 text-3xl font-bold shadow-xl shadow-black/20">
                А
              </div>

              <div className="min-w-0">
                <p className="text-lg font-semibold">Пользователь</p>
                <p className="truncate text-sm text-slate-300">{email}</p>

                <div className="mt-3 inline-flex rounded-2xl bg-emerald-400/15 px-3 py-2 text-xs font-semibold text-emerald-300">
                  Аккаунт активен
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={signOut}
                className="rounded-3xl bg-black/20 p-4 text-left hover:bg-black/30"
              >
                <p className="text-sm text-slate-400">Сессия</p>
                <p className="mt-1 font-semibold">Выйти из аккаунта</p>
              </button>

              <Link
                href="/auth"
                className="rounded-3xl bg-black/20 p-4 hover:bg-black/30"
              >
                <p className="text-sm text-slate-400">Аккаунт</p>
                <p className="mt-1 font-semibold">Сменить пользователя</p>
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-semibold">Сводка</h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-black/20 p-4">
                <p className="text-xs text-slate-400">Счета</p>
                <p className="mt-2 text-2xl font-bold">{accounts.length}</p>
              </div>

              <div className="rounded-3xl bg-black/20 p-4">
                <p className="text-xs text-slate-400">Цели</p>
                <p className="mt-2 text-2xl font-bold">{goals.length}</p>
              </div>

              <div className="rounded-3xl bg-black/20 p-4">
                <p className="text-xs text-slate-400">Операции</p>
                <p className="mt-2 text-2xl font-bold">{operations.length}</p>
              </div>

              <div className="rounded-3xl bg-black/20 p-4">
                <p className="text-xs text-slate-400">Бюджеты</p>
                <p className="mt-2 text-2xl font-bold">{budgets.length}</p>
              </div>

              <div className="rounded-3xl bg-black/20 p-4">
                <p className="text-xs text-slate-400">Категории</p>
                <p className="mt-2 text-2xl font-bold">{categories.length}</p>
              </div>

              <div className="rounded-3xl bg-black/20 p-4">
                <p className="text-xs text-slate-400">Шаблоны</p>
                <p className="mt-2 text-2xl font-bold">
                  {recurringTemplates.length}
                </p>
              </div>
            </div>
          </section>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Настройки</h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {settingsItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-3xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.08]"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${item.color}`}
                  >
                    {item.icon}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Корзина</h2>
              <p className="mt-1 text-sm text-slate-500">
                Здесь можно восстановить случайно удаленные данные
              </p>
            </div>

            {trashItems.length > 0 && (
              <button
                type="button"
                onClick={clearTrash}
                className="rounded-2xl bg-rose-400/10 px-4 py-2 text-sm text-rose-300 hover:bg-rose-400/15"
              >
                Очистить
              </button>
            )}
          </div>

          {trashItems.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-400">
              Корзина пуста
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {trashItems.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${getTrashTypeColor(
                      item.type
                    )}`}
                  >
                    {getTrashTypeIcon(item.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{item.title}</p>

                    <p className="mt-1 text-sm text-slate-400">
                      {getTrashTypeLabel(item.type)} · удалено {item.deletedAt}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => restoreTrashItem(item.id)}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-slate-200"
                  >
                    Восстановить
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTrashItemForever(item.id)}
                    className="rounded-xl bg-rose-400/10 px-4 py-2 text-sm text-rose-300 hover:bg-rose-400/15"
                  >
                    Удалить навсегда
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}