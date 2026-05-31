"use client";

import Link from "next/link";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney } from "@/lib/format";

function getProgressColor(progress: number, isOverLimit: boolean) {
  if (isOverLimit) return "bg-rose-400";
  if (progress >= 80) return "bg-orange-400";
  return "bg-emerald-400";
}

function getProgressTextColor(progress: number, isOverLimit: boolean) {
  if (isOverLimit) return "text-rose-300";
  if (progress >= 80) return "text-orange-300";
  return "text-emerald-300";
}

export default function BudgetPage() {
  const { budgets } = useFinance();

  const totalLimit = budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalLimit - totalSpent;

  const totalProgress =
    totalLimit > 0
      ? Math.min(100, Math.round((totalSpent / totalLimit) * 100))
      : 0;

  const isTotalOverLimit = totalRemaining < 0;

  const normalBudgets = budgets.filter(
    (budget) => budget.spent <= budget.limit
  ).length;

  const overLimitBudgets = budgets.filter(
    (budget) => budget.spent > budget.limit
  ).length;

  return (
    <main className="min-h-screen bg-[#080A12] text-white p-4 pb-24">
      <section className="mx-auto w-full max-w-md space-y-6 sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <header className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Мои финансы</p>
              <h1 className="mt-1 text-3xl font-bold">Бюджет</h1>
            </div>

            <Link
              href="/profile/budgets"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.08]"
            >
              Настроить
            </Link>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-orange-400/20 via-emerald-400/10 to-white/[0.04] p-5 shadow-2xl shadow-black/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">Лимиты на месяц</p>
              <p className="mt-2 text-4xl font-bold tracking-tight">
                {formatMoney(totalLimit)}
              </p>
            </div>

            <div
              className={`rounded-2xl px-3 py-2 text-sm font-semibold ${
                isTotalOverLimit
                  ? "bg-rose-400/15 text-rose-300"
                  : "bg-emerald-400/15 text-emerald-300"
              }`}
            >
              {isTotalOverLimit ? "Превышен" : "В норме"}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Потрачено</p>
              <p className="mt-1 text-xl font-semibold">
                {formatMoney(totalSpent)}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">
                {isTotalOverLimit ? "Превышение" : "Осталось"}
              </p>
              <p
                className={`mt-1 text-xl font-semibold ${
                  isTotalOverLimit ? "text-rose-300" : "text-emerald-300"
                }`}
              >
                {formatMoney(Math.abs(totalRemaining))}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">В норме</p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">
                {normalBudgets}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Превышено</p>
              <p className="mt-1 text-xl font-semibold text-rose-300">
                {overLimitBudgets}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-400">Использовано</span>
              <span
                className={getProgressTextColor(
                  totalProgress,
                  isTotalOverLimit
                )}
              >
                {totalProgress}%
              </span>
            </div>

            <div className="h-3 rounded-full bg-black/25">
              <div
                className={`h-3 rounded-full ${getProgressColor(
                  totalProgress,
                  isTotalOverLimit
                )}`}
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-slate-400">Категорий</p>
            <p className="mt-2 text-2xl font-bold">{budgets.length}</p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-xs text-emerald-200/80">В норме</p>
            <p className="mt-2 text-2xl font-bold text-emerald-300">
              {normalBudgets}
            </p>
          </div>

          <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4">
            <p className="text-xs text-rose-200/80">Превышено</p>
            <p className="mt-2 text-2xl font-bold text-rose-300">
              {overLimitBudgets}
            </p>
          </div>
        </section>

        <Link
          href="/profile/budgets"
          className="block rounded-3xl bg-white p-4 text-center font-bold text-neutral-950 transition hover:bg-slate-200"
        >
          Управлять лимитами
        </Link>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Лимиты</h2>

            <p className="text-sm text-slate-500">{budgets.length} шт.</p>
          </div>

          {budgets.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-400">
              Лимитов пока нет
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {budgets.map((budget) => {
              const progress = budget.limit
                ? Math.min(100, Math.round((budget.spent / budget.limit) * 100))
                : 0;

              const remaining = budget.limit - budget.spent;
              const isOverLimit = remaining < 0;

              return (
                <div
                  key={budget.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{budget.category}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatMoney(budget.spent)} из{" "}
                        {formatMoney(budget.limit)}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl px-3 py-2 text-sm font-semibold ${
                        isOverLimit
                          ? "bg-rose-400/15 text-rose-300"
                          : progress >= 80
                            ? "bg-orange-400/15 text-orange-300"
                            : "bg-emerald-400/15 text-emerald-300"
                      }`}
                    >
                      {isOverLimit ? "Превышен" : `${progress}%`}
                    </div>
                  </div>

                  <div className="mt-4 h-3 rounded-full bg-white/[0.06]">
                    <div
                      className={`h-3 rounded-full ${getProgressColor(
                        progress,
                        isOverLimit
                      )}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                    <p className="text-slate-400">
                      {isOverLimit ? "Превышение" : "Осталось"}
                    </p>

                    <p
                      className={
                        isOverLimit
                          ? "font-semibold text-rose-300"
                          : "font-semibold text-emerald-300"
                      }
                    >
                      {formatMoney(Math.abs(remaining))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}