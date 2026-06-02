"use client";

import Link from "next/link";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney } from "@/lib/format";

function getBudgetStatus(progress: number, remaining: number) {
  if (remaining < 0) {
    return {
      label: "Превышено",
      textClass: "text-rose-300",
      bgClass: "bg-rose-400",
      cardClass: "border-rose-400/20 bg-rose-400/10",
    };
  }

  if (progress >= 80) {
    return {
      label: "Почти лимит",
      textClass: "text-orange-300",
      bgClass: "bg-orange-400",
      cardClass: "border-orange-400/20 bg-orange-400/10",
    };
  }

  return {
    label: "В норме",
    textClass: "text-emerald-300",
    bgClass: "bg-emerald-400",
    cardClass: "border-emerald-400/20 bg-emerald-400/10",
  };
}

export default function BudgetPage() {
  const { budgets } = useFinance();

  const totalLimit = budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalLimit - totalSpent;

  const totalProgress =
    totalLimit > 0 ? Math.min(100, Math.round((totalSpent / totalLimit) * 100)) : 0;

  const normalBudgets = budgets.filter((budget) => budget.spent <= budget.limit);
  const exceededBudgets = budgets.filter((budget) => budget.spent > budget.limit);

  const totalStatus = getBudgetStatus(totalProgress, totalRemaining);

  return (
    <main className="min-h-screen bg-[#080A12] text-white p-4 pb-24">
      <section className="mx-auto w-full max-w-md space-y-6 sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <header className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Мои финансы</p>
              <h1 className="mt-1 text-3xl font-bold">Бюджет</h1>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
              {budgets.length} шт.
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-orange-400/20 via-emerald-400/10 to-blue-400/10 p-5 shadow-2xl shadow-black/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">Лимиты на месяц</p>
              <p className="mt-2 text-4xl font-bold tracking-tight">
                {formatMoney(totalLimit)}
              </p>
            </div>

            <div
              className={`rounded-2xl px-3 py-2 text-sm font-semibold ${totalStatus.cardClass} ${totalStatus.textClass}`}
            >
              {totalStatus.label}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Потрачено</p>
              <p className="mt-1 text-xl font-semibold">
                {formatMoney(totalSpent)}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Осталось</p>
              <p
                className={`mt-1 text-xl font-semibold ${
                  totalRemaining >= 0 ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {formatMoney(totalRemaining)}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">В норме</p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">
                {normalBudgets.length}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Превышено</p>
              <p className="mt-1 text-xl font-semibold text-rose-300">
                {exceededBudgets.length}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-400">Использовано</span>
              <span className={totalStatus.textClass}>{totalProgress}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className={`h-full rounded-full ${totalStatus.bgClass}`}
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-400">Категорий</p>
            <p className="mt-2 text-xl font-bold">{budgets.length}</p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-sm text-emerald-200/80">В норме</p>
            <p className="mt-2 text-xl font-bold text-emerald-300">
              {normalBudgets.length}
            </p>
          </div>

          <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4">
            <p className="text-sm text-rose-200/80">Превышено</p>
            <p className="mt-2 text-xl font-bold text-rose-300">
              {exceededBudgets.length}
            </p>
          </div>
        </section>

        <Link
          href="/profile/budgets"
          className="app-primary-button block w-full rounded-3xl p-4 text-center font-bold transition hover:opacity-90"
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
              const progress =
                budget.limit > 0
                  ? Math.min(100, Math.round((budget.spent / budget.limit) * 100))
                  : 0;

              const remaining = budget.limit - budget.spent;
              const status = getBudgetStatus(progress, remaining);

              return (
                <article
                  key={budget.id}
                  className={`rounded-3xl border p-4 ${status.cardClass}`}
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">{budget.category}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatMoney(budget.spent)} из {formatMoney(budget.limit)}
                      </p>
                    </div>

                    <div className={`rounded-2xl px-3 py-2 text-sm font-semibold ${status.textClass}`}>
                      {status.label}
                    </div>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/[0.12]">
                    <div
                      className={`h-full rounded-full ${status.bgClass}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Использовано</span>
                    <span className={status.textClass}>{progress}%</span>
                  </div>

                  <div className="mt-3 rounded-2xl bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-slate-400">
                        {remaining >= 0 ? "Осталось" : "Превышение"}
                      </span>
                      <span
                        className={`font-semibold ${
                          remaining >= 0 ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {formatMoney(Math.abs(remaining))}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}