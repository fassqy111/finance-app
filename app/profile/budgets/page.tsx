"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney } from "@/lib/format";
import type { Budget } from "@/types/finance";

function getProgressColor(progress: number, isOverLimit: boolean) {
  if (isOverLimit) return "bg-rose-400";
  if (progress >= 80) return "bg-orange-400";
  return "bg-emerald-400";
}

function getBadgeStyle(progress: number, isOverLimit: boolean) {
  if (isOverLimit) return "bg-rose-400/15 text-rose-300";
  if (progress >= 80) return "bg-orange-400/15 text-orange-300";
  return "bg-emerald-400/15 text-emerald-300";
}

export default function BudgetsManagementPage() {
  const { budgets, categories, addBudget, updateBudget, deleteBudget } =
    useFinance();

  const expenseCategories = categories.filter(
    (category) => category.type === "expense"
  );

  const [category, setCategory] = useState(expenseCategories[0]?.name ?? "");
  const [limit, setLimit] = useState("");
  const [spent, setSpent] = useState("");
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

  const totalLimit = budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalLimit - totalSpent;

  const totalProgress =
    totalLimit > 0
      ? Math.min(100, Math.round((totalSpent / totalLimit) * 100))
      : 0;

  const overLimitCount = budgets.filter(
    (budget) => budget.spent > budget.limit
  ).length;

  const normalCount = budgets.filter(
    (budget) => budget.spent <= budget.limit
  ).length;

  const isTotalOverLimit = totalRemaining < 0;

  function resetForm() {
    setCategory(expenseCategories[0]?.name ?? "");
    setLimit("");
    setSpent("");
    setEditingBudgetId(null);
  }

  async function saveBudget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericLimit = Number(limit);
    const numericSpent = Number(spent || 0);

    if (!category || numericLimit <= 0 || Number.isNaN(numericLimit)) {
      alert("Выбери категорию и укажи лимит");
      return;
    }

    if (Number.isNaN(numericSpent)) {
      alert("Потрачено должно быть числом");
      return;
    }

    if (editingBudgetId) {
      await updateBudget({
        id: editingBudgetId,
        category,
        limit: numericLimit,
        spent: numericSpent,
        currency: "₽",
      });
    } else {
      await addBudget({
        category,
        limit: numericLimit,
        spent: numericSpent,
        currency: "₽",
      });
    }

    resetForm();
  }

  function startEditBudget(budget: Budget) {
    setEditingBudgetId(budget.id);
    setCategory(budget.category);
    setLimit(String(budget.limit));
    setSpent(String(budget.spent));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="min-h-screen bg-[#080A12] text-white p-4 pb-24">
      <section className="mx-auto max-w-md space-y-6">
        <header className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Профиль</p>
              <h1 className="mt-1 text-3xl font-bold">Бюджеты</h1>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
              {budgets.length} шт.
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-orange-400/20 via-emerald-400/10 to-white/[0.04] p-5 shadow-2xl shadow-black/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">Общий лимит</p>
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

          <div className="mt-6 grid grid-cols-2 gap-3">
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
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-400">Использовано</span>
              <span
                className={
                  isTotalOverLimit
                    ? "text-rose-300"
                    : totalProgress >= 80
                      ? "text-orange-300"
                      : "text-emerald-300"
                }
              >
                {totalProgress}%
              </span>
            </div>

            <div className="h-3 rounded-full bg-black/25">
              <div
                className={getProgressColor(totalProgress, isTotalOverLimit)}
                style={{
                  width: `${totalProgress}%`,
                  height: "0.75rem",
                  borderRadius: "9999px",
                }}
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-slate-400">Всего</p>
            <p className="mt-2 text-2xl font-bold">{budgets.length}</p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-xs text-emerald-200/80">В норме</p>
            <p className="mt-2 text-2xl font-bold text-emerald-300">
              {normalCount}
            </p>
          </div>

          <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4">
            <p className="text-xs text-rose-200/80">Превышено</p>
            <p className="mt-2 text-2xl font-bold text-rose-300">
              {overLimitCount}
            </p>
          </div>
        </section>

        <form
          onSubmit={saveBudget}
          className="space-y-4 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-5 shadow-2xl shadow-black/30"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              {editingBudgetId ? "Редактировать лимит" : "Добавить лимит"}
            </h2>

            {editingBudgetId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl bg-white/[0.06] px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.1]"
              >
                Отмена
              </button>
            )}
          </div>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-orange-400/60"
          >
            {expenseCategories.length === 0 && (
              <option value="">Нет категорий расходов</option>
            )}

            {expenseCategories.map((categoryItem) => (
              <option key={categoryItem.id} value={categoryItem.name}>
                {categoryItem.name}
              </option>
            ))}
          </select>

          <input
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            placeholder="Лимит на месяц"
            type="number"
            min="0"
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-orange-400/60"
          />

          <input
            value={spent}
            onChange={(event) => setSpent(event.target.value)}
            placeholder="Потрачено сейчас"
            type="number"
            min="0"
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-orange-400/60"
          />

          <button
            type="submit"
            className="w-full rounded-3xl bg-white p-4 font-bold text-neutral-950 transition hover:bg-slate-200"
          >
            {editingBudgetId ? "Сохранить изменения" : "Добавить лимит"}
          </button>
        </form>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Список лимитов</h2>

            <p className="text-sm text-slate-500">{formatMoney(totalLimit)}</p>
          </div>

          {budgets.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-400">
              Лимитов пока нет
            </div>
          )}

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
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{budget.category}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatMoney(budget.spent)} из {formatMoney(budget.limit)}
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl px-3 py-2 text-sm font-semibold ${getBadgeStyle(
                      progress,
                      isOverLimit
                    )}`}
                  >
                    {isOverLimit ? "Превышен" : `${progress}%`}
                  </div>
                </div>

                <div className="mt-4 h-3 rounded-full bg-white/[0.06]">
                  <div
                    className={getProgressColor(progress, isOverLimit)}
                    style={{
                      width: `${progress}%`,
                      height: "0.75rem",
                      borderRadius: "9999px",
                    }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                  <p className="text-slate-400">
                    {isOverLimit ? "Превышение" : "Осталось"}
                  </p>

                  <p
                    className={`font-semibold ${
                      isOverLimit ? "text-rose-300" : "text-emerald-300"
                    }`}
                  >
                    {formatMoney(Math.abs(remaining))}
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEditBudget(budget)}
                    className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.1]"
                  >
                    Редактировать
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteBudget(budget.id)}
                    className="rounded-xl bg-rose-400/10 px-4 py-2 text-sm text-rose-300 hover:bg-rose-400/15"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </section>
    </main>
  );
}