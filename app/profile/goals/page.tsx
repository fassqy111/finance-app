"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney } from "@/lib/format";
import type { Goal } from "@/types/finance";

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal } = useFinance();

  const [goalName, setGoalName] = useState("");
  const [goalCurrentAmount, setGoalCurrentAmount] = useState("");
  const [goalTargetAmount, setGoalTargetAmount] = useState("");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const goalsTotal = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  const completedGoals = goals.filter(
    (goal) => goal.currentAmount >= goal.targetAmount
  ).length;

  const averageProgress =
    goals.length > 0
      ? Math.round(
          goals.reduce((sum, goal) => {
            const progress = goal.targetAmount
              ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
              : 0;

            return sum + progress;
          }, 0) / goals.length
        )
      : 0;

  function resetForm() {
    setGoalName("");
    setGoalCurrentAmount("");
    setGoalTargetAmount("");
    setEditingGoalId(null);
  }

  async function saveGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericCurrentAmount = Number(goalCurrentAmount);
    const numericTargetAmount = Number(goalTargetAmount);

    if (
      !goalName.trim() ||
      Number.isNaN(numericCurrentAmount) ||
      Number.isNaN(numericTargetAmount) ||
      numericTargetAmount <= 0
    ) {
      alert("Заполни название цели, текущую сумму и сумму цели");
      return;
    }

    if (editingGoalId) {
      await updateGoal({
        id: editingGoalId,
        name: goalName.trim(),
        currentAmount: numericCurrentAmount,
        targetAmount: numericTargetAmount,
        currency: "₽",
      });
    } else {
      await addGoal({
        name: goalName.trim(),
        currentAmount: numericCurrentAmount,
        targetAmount: numericTargetAmount,
        currency: "₽",
      });
    }

    resetForm();
  }

  function startEditGoal(goal: Goal) {
    setEditingGoalId(goal.id);
    setGoalName(goal.name);
    setGoalCurrentAmount(String(goal.currentAmount));
    setGoalTargetAmount(String(goal.targetAmount));

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
              <h1 className="mt-1 text-3xl font-bold">Цели</h1>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
              {goals.length} шт.
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-400/20 via-blue-400/10 to-white/[0.04] p-5 shadow-2xl shadow-black/30">
          <p className="text-sm text-slate-300">Всего в целях</p>

          <p className="mt-2 text-4xl font-bold tracking-tight">
            {formatMoney(goalsTotal)}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Средний прогресс</p>
              <p className="mt-1 text-xl font-semibold text-purple-300">
                {averageProgress}%
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Завершено</p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">
                {completedGoals}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-400">Общий прогресс</span>
              <span className="text-purple-300">{averageProgress}%</span>
            </div>

            <div className="h-3 rounded-full bg-black/25">
              <div
                className="h-3 rounded-full bg-purple-400"
                style={{ width: `${averageProgress}%` }}
              />
            </div>
          </div>
        </section>

        <form
          onSubmit={saveGoal}
          className="space-y-4 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-5 shadow-2xl shadow-black/30"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              {editingGoalId ? "Редактировать цель" : "Добавить цель"}
            </h2>

            {editingGoalId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl bg-white/[0.06] px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.1]"
              >
                Отмена
              </button>
            )}
          </div>

          <input
            value={goalName}
            onChange={(event) => setGoalName(event.target.value)}
            placeholder="Название цели, например Отпуск"
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-purple-400/60"
          />

          <input
            value={goalCurrentAmount}
            onChange={(event) => setGoalCurrentAmount(event.target.value)}
            placeholder="Текущая сумма"
            type="number"
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-purple-400/60"
          />

          <input
            value={goalTargetAmount}
            onChange={(event) => setGoalTargetAmount(event.target.value)}
            placeholder="Сумма цели"
            type="number"
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-purple-400/60"
          />

          <button
            type="submit"
            className="w-full rounded-3xl bg-white p-4 font-bold text-neutral-950 transition hover:bg-slate-200"
          >
            {editingGoalId ? "Сохранить изменения" : "Добавить цель"}
          </button>
        </form>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Список целей</h2>

            <p className="text-sm text-slate-500">{formatMoney(goalsTotal)}</p>
          </div>

          {goals.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-400">
              Целей пока нет
            </div>
          )}

          {goals.map((goal) => {
            const progress = goal.targetAmount
              ? Math.min(
                  100,
                  Math.round((goal.currentAmount / goal.targetAmount) * 100)
                )
              : 0;

            const remaining = goal.targetAmount - goal.currentAmount;
            const isCompleted = remaining <= 0;

            return (
              <div
                key={goal.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{goal.name}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatMoney(goal.currentAmount)} из{" "}
                      {formatMoney(goal.targetAmount)}
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl px-3 py-2 text-sm font-semibold ${
                      isCompleted
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-purple-400/15 text-purple-300"
                    }`}
                  >
                    {isCompleted ? "Готово" : `${progress}%`}
                  </div>
                </div>

                <div className="mt-4 h-3 rounded-full bg-white/[0.06]">
                  <div
                    className={`h-3 rounded-full ${
                      isCompleted ? "bg-emerald-400" : "bg-purple-400"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                  <p className="text-slate-400">
                    {isCompleted ? "Цель достигнута" : "Осталось"}
                  </p>

                  <p
                    className={`font-semibold ${
                      isCompleted ? "text-emerald-300" : "text-purple-300"
                    }`}
                  >
                    {isCompleted
                      ? formatMoney(goal.currentAmount)
                      : formatMoney(Math.max(remaining, 0))}
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEditGoal(goal)}
                    className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.1]"
                  >
                    Редактировать
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteGoal(goal.id)}
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