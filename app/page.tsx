"use client";

import Link from "next/link";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney } from "@/lib/format";
import type { Operation } from "@/types/finance";

function getOperationSign(type: string) {
  if (type === "expense") return "−";
  if (type === "income") return "+";
  return "";
}

function getOperationColor(type: string) {
  if (type === "expense") return "text-rose-300";
  if (type === "income") return "text-emerald-300";
  return "text-blue-300";
}

function getOperationIcon(type: string) {
  if (type === "expense") return "↓";
  if (type === "income") return "↑";
  return "↔";
}

function getOperationSource(operation: Operation) {
  if (operation.type !== "transfer") {
    return operation.account;
  }

  const from =
    operation.fromTargetType === "goal"
      ? `Цель: ${operation.goal ?? "Не выбрано"}`
      : `Счет: ${operation.account}`;

  const to =
    operation.toTargetType === "goal"
      ? `Цель: ${operation.toGoal ?? "Не выбрано"}`
      : `Счет: ${operation.toAccount ?? "Не выбрано"}`;

  return `${from} → ${to}`;
}

export default function HomePage() {
  const { accounts, goals, operations, budgets } = useFinance();

  const accountsTotal = accounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );

  const goalsTotal = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const capitalTotal = accountsTotal + goalsTotal;

  const expenseTotal = operations
    .filter((operation) => operation.type === "expense")
    .reduce((sum, operation) => sum + operation.amount, 0);

  const incomeTotal = operations
    .filter((operation) => operation.type === "income")
    .reduce((sum, operation) => sum + operation.amount, 0);

  const totalBudgetLimit = budgets.reduce(
    (sum, budget) => sum + budget.limit,
    0
  );

  const totalBudgetSpent = budgets.reduce(
    (sum, budget) => sum + budget.spent,
    0
  );

  const budgetRemaining = totalBudgetLimit - totalBudgetSpent;

  const lastOperations = operations.slice(0, 5);

  return (
    <main className="min-h-screen bg-[#080A12] text-white p-4 pb-24">
      <section className="mx-auto w-full max-w-md space-y-6 sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <header className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Добро пожаловать</p>
              <h1 className="mt-1 text-3xl font-bold">Мои финансы</h1>
            </div>

            <Link
              href="/profile"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-lg font-semibold"
            >
              А
            </Link>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-400/20 via-blue-400/10 to-white/[0.04] p-5 shadow-2xl shadow-black/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">Общий капитал</p>
              <p className="mt-2 text-4xl font-bold tracking-tight">
                {formatMoney(capitalTotal)}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-400/15 px-3 py-2 text-sm font-semibold text-emerald-300">
              Активно
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">На счетах</p>
              <p className="mt-1 text-xl font-semibold">
                {formatMoney(accountsTotal)}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">В целях</p>
              <p className="mt-1 text-xl font-semibold">
                {formatMoney(goalsTotal)}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href="/operations"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-3 text-center hover:bg-white/[0.08]"
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-xl text-emerald-300">
              +
            </div>
            <p className="mt-2 text-xs text-slate-300">Операция</p>
          </Link>

          <Link
            href="/profile/accounts"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-3 text-center hover:bg-white/[0.08]"
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-400/15 text-xl text-blue-300">
              ◼
            </div>
            <p className="mt-2 text-xs text-slate-300">Счет</p>
          </Link>

          <Link
            href="/profile/goals"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-3 text-center hover:bg-white/[0.08]"
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-400/15 text-xl text-purple-300">
              ★
            </div>
            <p className="mt-2 text-xs text-slate-300">Цель</p>
          </Link>

          <Link
            href="/profile/budgets"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-3 text-center hover:bg-white/[0.08]"
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-400/15 text-xl text-orange-300">
              %
            </div>
            <p className="mt-2 text-xs text-slate-300">Лимит</p>
          </Link>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-slate-400">Доходы</p>
            <p className="mt-2 text-lg font-bold text-emerald-300">
              {formatMoney(incomeTotal)}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-slate-400">Расходы</p>
            <p className="mt-2 text-lg font-bold text-rose-300">
              {formatMoney(expenseTotal)}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-slate-400">
              {budgetRemaining < 0 ? "Превышение" : "Осталось"}
            </p>
            <p className="mt-2 text-lg font-bold text-blue-300">
              {formatMoney(Math.abs(budgetRemaining))}
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Счета</h2>

            <Link
              href="/profile/accounts"
              className="text-sm text-slate-400 hover:text-white"
            >
              Все
            </Link>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max gap-3">
              {accounts.length === 0 && (
                <div className="w-64 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-slate-400">
                  Счетов пока нет
                </div>
              )}

              {accounts.map((account) => {
                const percent = capitalTotal
                  ? Math.round((account.balance / capitalTotal) * 100)
                  : 0;

                return (
                  <div
                    key={account.id}
                    className="w-64 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Счет</p>
                        <p className="mt-1 text-lg font-semibold">
                          {account.name}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-blue-400/15 px-3 py-2 text-xs text-blue-300">
                        {percent}%
                      </div>
                    </div>

                    <p className="mt-6 text-2xl font-bold">
                      {formatMoney(account.balance)}
                    </p>

                    <div className="mt-4 h-2 rounded-full bg-white/[0.06]">
                      <div
                        className="h-2 rounded-full bg-blue-400"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Цели</h2>

            <Link
              href="/profile/goals"
              className="text-sm text-slate-400 hover:text-white"
            >
              Все
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {goals.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-slate-400">
                Целей пока нет
              </div>
            )}

            {goals.map((goal) => {
              const progress = Math.min(
                100,
                Math.round((goal.currentAmount / goal.targetAmount) * 100)
              );

              return (
                <div
                  key={goal.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{goal.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatMoney(goal.currentAmount)} из{" "}
                        {formatMoney(goal.targetAmount)}
                      </p>
                    </div>

                    <p className="font-bold text-emerald-300">{progress}%</p>
                  </div>

                  <div className="mt-4 h-2 rounded-full bg-white/[0.06]">
                    <div
                      className="h-2 rounded-full bg-emerald-400"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Последние операции</h2>

            <Link
              href="/operations"
              className="text-sm text-slate-400 hover:text-white"
            >
              Все
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {lastOperations.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-slate-400">
                Операций пока нет
              </div>
            )}

            {lastOperations.map((operation) => (
              <div
                key={operation.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-xl ${getOperationColor(
                        operation.type
                      )}`}
                    >
                      {getOperationIcon(operation.type)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {operation.title}
                      </p>
                      <p className="truncate text-sm text-slate-400">
                        {getOperationSource(operation)} · {operation.category}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`shrink-0 font-bold ${getOperationColor(
                      operation.type
                    )}`}
                  >
                    {getOperationSign(operation.type)}
                    {formatMoney(operation.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}