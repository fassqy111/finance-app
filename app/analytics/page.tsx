"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney } from "@/lib/format";
import type { Operation } from "@/types/finance";

type ChartPoint = {
  label: string;
  capital: number;
  income: number;
  expense: number;
};

type CategoryStat = {
  name: string;
  amount: number;
  percent: number;
  color: string;
};

const chartColors = {
  green: "#34d399",
  blue: "#60a5fa",
  pink: "#fb7185",
  orange: "#fb923c",
  purple: "#a78bfa",
  yellow: "#facc15",
  mint: "#2dd4bf",
};

const categoryColors = [
  chartColors.green,
  chartColors.blue,
  chartColors.pink,
  chartColors.orange,
  chartColors.purple,
  chartColors.yellow,
  chartColors.mint,
];

function buildLinePath(
  values: number[],
  width: number,
  height: number,
  padding = 16
) {
  if (values.length === 0) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x =
        padding +
        (index * (width - padding * 2)) / Math.max(values.length - 1, 1);

      const y =
        height -
        padding -
        ((value - min) / range) * (height - padding * 2);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function getMonthLabel(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Без даты";
  }

  return date.toLocaleDateString("ru-RU", {
    month: "short",
  });
}

function getCategoryStats(operations: Operation[], type: "income" | "expense") {
  const filteredOperations = operations.filter(
    (operation) => operation.type === type
  );

  const total = filteredOperations.reduce(
    (sum: number, operation: Operation) => sum + operation.amount,
    0
  );

  const grouped = filteredOperations.reduce<Record<string, number>>(
    (acc, operation) => {
      const category = operation.category || "Без категории";

      acc[category] = (acc[category] ?? 0) + operation.amount;

      return acc;
    },
    {}
  );

  return Object.entries(grouped)
    .map(([name, amount], index) => ({
      name,
      amount,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: categoryColors[index % categoryColors.length],
    }))
    .sort((a, b) => b.amount - a.amount);
}

function getDonutGradient(stats: CategoryStat[]) {
  if (stats.length === 0) {
    return "conic-gradient(#27272a 0deg 360deg)";
  }

  let currentDegree = 0;

  const parts = stats.map((item) => {
    const size = item.percent * 3.6;
    const start = currentDegree;
    const end = currentDegree + size;

    currentDegree = end;

    return `${item.color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${parts.join(", ")})`;
}

function buildChartData(operations: Operation[], capitalTotal: number) {
  const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"];

  const currentIncome = operations
    .filter((operation) => operation.type === "income")
    .reduce((sum: number, operation: Operation) => sum + operation.amount, 0);

  const currentExpense = operations
    .filter((operation) => operation.type === "expense")
    .reduce((sum: number, operation: Operation) => sum + operation.amount, 0);

  const baseCapital = Math.max(capitalTotal - currentIncome + currentExpense, 0);

  return months.map((month, index) => {
    const ratio = (index + 1) / months.length;

    return {
      label: month,
      capital: Math.round(baseCapital + (capitalTotal - baseCapital) * ratio),
      income: Math.round(currentIncome * (0.55 + ratio * 0.45)),
      expense: Math.round(currentExpense * (0.45 + ratio * 0.55)),
    };
  });
}

export default function AnalyticsPage() {
  const { accounts, goals, operations, budgets } = useFinance();

  const [selectedMetric, setSelectedMetric] = useState<
    "capital" | "income-expense" | "categories"
  >("capital");

  const [selectedCategoryType, setSelectedCategoryType] = useState<
    "expense" | "income"
  >("expense");

  const accountsTotal = accounts.reduce(
    (sum: number, account) => sum + account.balance,
    0
  );

  const goalsTotal = goals.reduce(
    (sum: number, goal) => sum + goal.currentAmount,
    0
  );

  const capitalTotal = accountsTotal + goalsTotal;

  const incomeTotal = operations
    .filter((operation: Operation) => operation.type === "income")
    .reduce((sum: number, operation: Operation) => sum + operation.amount, 0);

  const expenseTotal = operations
    .filter((operation: Operation) => operation.type === "expense")
    .reduce((sum: number, operation: Operation) => sum + operation.amount, 0);

  const profit = incomeTotal - expenseTotal;

  const totalBudgetLimit = budgets.reduce(
    (sum: number, budget) => sum + budget.limit,
    0
  );

  const totalBudgetSpent = budgets.reduce(
    (sum: number, budget) => sum + budget.spent,
    0
  );

  const budgetRemaining = totalBudgetLimit - totalBudgetSpent;

  const savingRate =
    incomeTotal > 0 ? Math.round((profit / incomeTotal) * 100) : 0;

  const chartData: ChartPoint[] = buildChartData(operations, capitalTotal);

  const capitalPath = buildLinePath(
    chartData.map((item) => item.capital),
    340,
    210
  );

  const incomePath = buildLinePath(
    chartData.map((item) => item.income),
    340,
    210
  );

  const expensePath = buildLinePath(
    chartData.map((item) => item.expense),
    340,
    210
  );

  const categoryStats = getCategoryStats(operations, selectedCategoryType);
  const donutGradient = getDonutGradient(categoryStats);

  const selectedTotal =
    selectedCategoryType === "expense" ? expenseTotal : incomeTotal;

  return (
    <main className="min-h-screen bg-[#080A12] text-white p-4 pb-24">
      <section className="mx-auto max-w-md space-y-6">
        <header className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Мои финансы</p>
              <h1 className="mt-1 text-3xl font-bold">Аналитика</h1>
            </div>

            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300"
            >
              Настроить
            </button>
          </div>
        </header>

        <section className="overflow-x-auto pb-1">
          <div className="flex min-w-max gap-3">
            <button
              type="button"
              onClick={() => setSelectedMetric("capital")}
              className={`w-44 rounded-3xl border p-4 text-left transition ${
                selectedMetric === "capital"
                  ? "border-emerald-400 bg-emerald-400/10"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <div className="mb-4 text-2xl">📈</div>
              <p className="text-xl font-bold">{formatMoney(capitalTotal)}</p>
              <p className="mt-1 text-sm text-slate-400">Капитал</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMetric("income-expense")}
              className={`w-44 rounded-3xl border p-4 text-left transition ${
                selectedMetric === "income-expense"
                  ? "border-blue-400 bg-blue-400/10"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <div className="mb-4 text-2xl">〽️</div>
              <p className="text-xl font-bold">{formatMoney(profit)}</p>
              <p className="mt-1 text-sm text-slate-400">Чистый доход</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMetric("categories")}
              className={`w-44 rounded-3xl border p-4 text-left transition ${
                selectedMetric === "categories"
                  ? "border-pink-400 bg-pink-400/10"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <div className="mb-4 text-2xl">◌</div>
              <p className="text-xl font-bold">{formatMoney(expenseTotal)}</p>
              <p className="mt-1 text-sm text-slate-400">Расходы</p>
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-5 shadow-2xl shadow-black/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Капитал</p>
              <p className="mt-1 text-3xl font-bold">
                {formatMoney(capitalTotal)}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-300">
              {savingRate > 0 ? "+" : ""}
              {savingRate}%
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl bg-black/20 p-3">
            <svg viewBox="0 0 340 210" className="h-64 w-full">
              <defs>
                <linearGradient id="capitalGradient" x1="0" x2="1">
                  <stop offset="0%" stopColor={chartColors.green} />
                  <stop offset="100%" stopColor={chartColors.mint} />
                </linearGradient>

                <linearGradient id="incomeGradient" x1="0" x2="1">
                  <stop offset="0%" stopColor={chartColors.blue} />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>

                <linearGradient id="expenseGradient" x1="0" x2="1">
                  <stop offset="0%" stopColor={chartColors.pink} />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>

              {[40, 80, 120, 160].map((line) => (
                <line
                  key={line}
                  x1="16"
                  x2="324"
                  y1={line}
                  y2={line}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
              ))}

              <path
                d={capitalPath}
                fill="none"
                stroke="url(#capitalGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d={incomePath}
                fill="none"
                stroke="url(#incomeGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />

              <path
                d={expensePath}
                fill="none"
                stroke="url(#expenseGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />

              {chartData.map((item, index) => {
                const x = 16 + (index * (340 - 32)) / (chartData.length - 1);

                return (
                  <text
                    key={item.label}
                    x={x}
                    y="202"
                    textAnchor="middle"
                    fontSize="11"
                    fill="rgba(255,255,255,0.45)"
                  >
                    {item.label}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-2xl bg-white/[0.04] p-3">
              <p className="text-slate-400">Капитал</p>
              <p className="mt-1 font-semibold text-emerald-300">
                {formatMoney(capitalTotal)}
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.04] p-3">
              <p className="text-slate-400">Доходы</p>
              <p className="mt-1 font-semibold text-blue-300">
                {formatMoney(incomeTotal)}
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.04] p-3">
              <p className="text-slate-400">Расходы</p>
              <p className="mt-1 font-semibold text-rose-300">
                {formatMoney(expenseTotal)}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-400">Лимиты</p>
            <p className="mt-2 text-xl font-bold">
              {formatMoney(totalBudgetLimit)}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-400">
              {budgetRemaining < 0 ? "Превышение" : "Осталось"}
            </p>
            <p className="mt-2 text-xl font-bold">
              {formatMoney(Math.abs(budgetRemaining))}
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">
                {selectedCategoryType === "expense" ? "Расходы" : "Доходы"}
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {formatMoney(selectedTotal)}
              </h2>
            </div>

            <div className="flex rounded-2xl bg-black/30 p-1">
              <button
                type="button"
                onClick={() => setSelectedCategoryType("expense")}
                className={`rounded-xl px-4 py-2 text-sm ${
                  selectedCategoryType === "expense"
                    ? "bg-white text-neutral-950"
                    : "text-slate-400"
                }`}
              >
                Расходы
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategoryType("income")}
                className={`rounded-xl px-4 py-2 text-sm ${
                  selectedCategoryType === "income"
                    ? "bg-white text-neutral-950"
                    : "text-slate-400"
                }`}
              >
                Доходы
              </button>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <div
              className="relative h-56 w-56 rounded-full"
              style={{ background: donutGradient }}
            >
              <div className="absolute inset-12 rounded-full bg-[#080A12]" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-slate-400">Всего</p>
                  <p className="mt-1 text-xl font-bold">
                    {formatMoney(selectedTotal)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {categoryStats.length === 0 && (
              <div className="rounded-2xl bg-white/[0.04] p-4 text-slate-400">
                Данных пока нет
              </div>
            )}

            {categoryStats.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-slate-400">{item.percent}%</p>
                    </div>
                  </div>

                  <p className="font-semibold">{formatMoney(item.amount)}</p>
                </div>

                <div className="h-2 rounded-full bg-white/[0.06]">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-xl font-semibold">Структура капитала</h2>

          <div className="mt-4 space-y-4">
            {accounts.map((account) => {
              const percent = capitalTotal
                ? Math.round((account.balance / capitalTotal) * 100)
                : 0;

              return (
                <div key={account.id}>
                  <div className="mb-2 flex justify-between gap-4">
                    <p className="font-medium">{account.name}</p>
                    <p className="font-semibold">
                      {formatMoney(account.balance)}
                    </p>
                  </div>

                  <div className="h-2 rounded-full bg-white/[0.06]">
                    <div
                      className="h-2 rounded-full bg-emerald-400"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <p className="mt-1 text-sm text-slate-400">
                    {percent}% капитала
                  </p>
                </div>
              );
            })}

            {goals.map((goal) => {
              const percent = capitalTotal
                ? Math.round((goal.currentAmount / capitalTotal) * 100)
                : 0;

              return (
                <div key={goal.id}>
                  <div className="mb-2 flex justify-between gap-4">
                    <p className="font-medium">Цель: {goal.name}</p>
                    <p className="font-semibold">
                      {formatMoney(goal.currentAmount)}
                    </p>
                  </div>

                  <div className="h-2 rounded-full bg-white/[0.06]">
                    <div
                      className="h-2 rounded-full bg-blue-400"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <p className="mt-1 text-sm text-slate-400">
                    {percent}% капитала
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}