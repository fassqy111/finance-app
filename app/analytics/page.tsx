"use client";

import { useMemo, useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney } from "@/lib/format";
import type { CapitalSnapshot, Operation, OperationType } from "@/types/finance";

type AnalyticsMode = "overview" | "expenses" | "income" | "capital";

const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

function getMonthKey(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Без даты";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getMonthLabel(monthKey: string) {
  if (monthKey === "Без даты") return monthKey;

  const [year, month] = monthKey.split("-");
  const monthIndex = Number(month) - 1;

  return `${monthNames[monthIndex] ?? month} ${year}`;
}

function getSnapshotMonthLabel(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return `${monthNames[parsedDate.getMonth()]} ${parsedDate.getFullYear()}`;
}

function getShortSnapshotMonthLabel(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return monthNames[parsedDate.getMonth()].slice(0, 3).toUpperCase();
}

function getOperationSource(operation: Operation) {
  if (operation.type !== "transfer") {
    return operation.account || "Без счета";
  }

  const from =
    operation.fromTargetType === "goal"
      ? `Цель: ${operation.goal ?? "Не выбрано"}`
      : `Счет: ${operation.account || "Не выбрано"}`;

  const to =
    operation.toTargetType === "goal"
      ? `Цель: ${operation.toGoal ?? "Не выбрано"}`
      : `Счет: ${operation.toAccount ?? "Не выбрано"}`;

  return `${from} → ${to}`;
}

function getModeLabel(mode: AnalyticsMode) {
  if (mode === "overview") return "Обзор";
  if (mode === "expenses") return "Расходы";
  if (mode === "income") return "Доходы";
  return "Капитал";
}

function getOperationTypeLabel(type: OperationType) {
  if (type === "expense") return "Расход";
  if (type === "income") return "Доход";
  return "Перевод";
}

function getOperationColor(type: OperationType) {
  if (type === "expense") return "text-rose-300";
  if (type === "income") return "text-emerald-300";
  return "text-blue-300";
}

function getOperationBg(type: OperationType) {
  if (type === "expense") return "bg-rose-400";
  if (type === "income") return "bg-emerald-400";
  return "bg-blue-400";
}

function getSnapshotChange(
  snapshot: CapitalSnapshot,
  previousSnapshot?: CapitalSnapshot
) {
  if (!previousSnapshot) return 0;

  return snapshot.capitalAmount - previousSnapshot.capitalAmount;
}

function formatChartMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value);
}

function getLinePath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";

  return points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }

      const previous = points[index - 1];
      const controlX = (previous.x + point.x) / 2;

      return `C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(" ");
}

function CapitalLineChart({ snapshots }: { snapshots: CapitalSnapshot[] }) {
  const sortedSnapshots = [...snapshots].sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  if (sortedSnapshots.length === 0) {
    return (
      <div className="rounded-3xl bg-black/20 p-4 text-slate-400">
        История капитала пока не добавлена. Открой Профиль → Капитал и добавь
        данные с фото.
      </div>
    );
  }

  const width = Math.max(1280, sortedSnapshots.length * 125);
  const height = 460;

  const paddingX = 70;
  const capitalTop = 42;
  const capitalBottom = 190;
  const incomeTop = 235;
  const incomeBottom = 370;
  const monthY = 425;

  const maxCapital = Math.max(
    ...sortedSnapshots.map((snapshot) => snapshot.capitalAmount),
    1
  );

  const minCapital = Math.min(
    ...sortedSnapshots.map((snapshot) => snapshot.capitalAmount),
    0
  );

  const maxIncomeAbs = Math.max(
    ...sortedSnapshots.map((snapshot) => Math.abs(snapshot.netIncomeAmount)),
    1
  );

  function getX(index: number) {
    if (sortedSnapshots.length === 1) {
      return width / 2;
    }

    return (
      paddingX +
      (index * (width - paddingX * 2)) / (sortedSnapshots.length - 1)
    );
  }

  function getCapitalY(value: number) {
    const range = maxCapital - minCapital || 1;

    return (
      capitalTop +
      ((maxCapital - value) / range) * (capitalBottom - capitalTop)
    );
  }

  function getIncomeY(value: number) {
    const zeroY = (incomeTop + incomeBottom) / 2;
    const maxHeight = (incomeBottom - incomeTop) / 2;

    return zeroY - (value / maxIncomeAbs) * maxHeight;
  }

  const capitalPoints = sortedSnapshots.map((snapshot, index) => ({
    x: getX(index),
    y: getCapitalY(snapshot.capitalAmount),
  }));

  const incomePoints = sortedSnapshots.map((snapshot, index) => ({
    x: getX(index),
    y: getIncomeY(snapshot.netIncomeAmount),
  }));

  const incomeZeroY = getIncomeY(0);

  return (
    <div className="capital-chart-scroll overflow-x-auto rounded-[2rem] bg-black/20 p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="block"
      >
        <defs>
          <linearGradient
            id="analyticsCapitalGradient"
            x1="0"
            x2="1"
            y1="0"
            y2="0"
          >
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>

          <linearGradient
            id="analyticsIncomeGradient"
            x1="0"
            x2="1"
            y1="0"
            y2="0"
          >
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
        </defs>

        <line
          x1={paddingX}
          y1={incomeZeroY}
          x2={width - paddingX}
          y2={incomeZeroY}
          stroke="rgba(148, 163, 184, 0.16)"
          strokeWidth="1"
        />

        <path
          d={getLinePath(capitalPoints)}
          fill="none"
          stroke="url(#analyticsCapitalGradient)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d={getLinePath(incomePoints)}
          fill="none"
          stroke="url(#analyticsIncomeGradient)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {capitalPoints.map((point, index) => {
          const snapshot = sortedSnapshots[index];

          return (
            <g key={`capital-${snapshot.id}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="#34d399"
                stroke="#080A12"
                strokeWidth="3"
              />

              <text
                x={point.x}
                y={point.y - 13}
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill="#10b981"
              >
                {formatChartMoney(snapshot.capitalAmount)} ₽
              </text>
            </g>
          );
        })}

        {incomePoints.map((point, index) => {
          const snapshot = sortedSnapshots[index];
          const labelOffset = snapshot.netIncomeAmount >= 0 ? -13 : 24;

          return (
            <g key={`income-${snapshot.id}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill={snapshot.netIncomeAmount >= 0 ? "#60a5fa" : "#fb7185"}
                stroke="#080A12"
                strokeWidth="3"
              />

              <text
                x={point.x}
                y={point.y + labelOffset}
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill={snapshot.netIncomeAmount >= 0 ? "#3b82f6" : "#e11d48"}
              >
                {formatChartMoney(snapshot.netIncomeAmount)} ₽
              </text>
            </g>
          );
        })}

        {sortedSnapshots.map((snapshot, index) => (
          <text
            key={`month-${snapshot.id}`}
            x={getX(index)}
            y={monthY}
            textAnchor="middle"
            fontSize="14"
            fontWeight="800"
            fill="#64748b"
            letterSpacing="1"
          >
            {getShortSnapshotMonthLabel(snapshot.month)}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function AnalyticsPage() {
  const {
    accounts,
    goals,
    capitalSnapshots,
    operations,
    budgets,
    categories,
  } = useFinance();

  const [mode, setMode] = useState<AnalyticsMode>("overview");

  const sortedCapitalSnapshots = [...capitalSnapshots].sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  const latestSnapshot =
    sortedCapitalSnapshots[sortedCapitalSnapshots.length - 1];

  const previousSnapshot =
    sortedCapitalSnapshots[sortedCapitalSnapshots.length - 2];

  const latestCapitalFromSnapshots = latestSnapshot?.capitalAmount ?? 0;
  const latestNetIncomeFromSnapshots = latestSnapshot?.netIncomeAmount ?? 0;

  const latestCapitalChange =
    latestSnapshot && previousSnapshot
      ? latestSnapshot.capitalAmount - previousSnapshot.capitalAmount
      : 0;

  const totalHistoricalNetIncome = sortedCapitalSnapshots.reduce(
    (sum, snapshot) => sum + snapshot.netIncomeAmount,
    0
  );

  const accountsTotal = accounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );

  const goalsTotal = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  const currentCapitalTotal = accountsTotal + goalsTotal;

  const capitalTotal =
    sortedCapitalSnapshots.length > 0
      ? latestCapitalFromSnapshots
      : currentCapitalTotal;

  const incomeTotal = operations
    .filter((operation) => operation.type === "income")
    .reduce((sum, operation) => sum + operation.amount, 0);

  const expenseTotal = operations
    .filter((operation) => operation.type === "expense")
    .reduce((sum, operation) => sum + operation.amount, 0);

  const netResult = incomeTotal - expenseTotal;

  const totalBudgetLimit = budgets.reduce(
    (sum, budget) => sum + budget.limit,
    0
  );

  const totalBudgetSpent = budgets.reduce(
    (sum, budget) => sum + budget.spent,
    0
  );

  const budgetProgress =
    totalBudgetLimit > 0
      ? Math.min(100, Math.round((totalBudgetSpent / totalBudgetLimit) * 100))
      : 0;

  const savingsRate =
    incomeTotal > 0 ? Math.round((netResult / incomeTotal) * 100) : 0;

  const historicalSavingsRate =
    latestNetIncomeFromSnapshots > 0 && latestCapitalFromSnapshots > 0
      ? Math.round(
          (latestNetIncomeFromSnapshots / latestCapitalFromSnapshots) * 100
        )
      : 0;

  const monthlyData = useMemo(() => {
    const map = new Map<
      string,
      {
        month: string;
        income: number;
        expense: number;
        transfer: number;
      }
    >();

    operations.forEach((operation) => {
      const monthKey = getMonthKey(operation.date);

      const current = map.get(monthKey) ?? {
        month: monthKey,
        income: 0,
        expense: 0,
        transfer: 0,
      };

      if (operation.type === "income") {
        current.income += operation.amount;
      }

      if (operation.type === "expense") {
        current.expense += operation.amount;
      }

      if (operation.type === "transfer") {
        current.transfer += operation.amount;
      }

      map.set(monthKey, current);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }, [operations]);

  const categoryExpenseData = useMemo(() => {
    const map = new Map<string, number>();

    operations
      .filter((operation) => operation.type === "expense")
      .forEach((operation) => {
        const currentAmount = map.get(operation.category) ?? 0;
        map.set(operation.category, currentAmount + operation.amount);
      });

    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [operations]);

  const categoryIncomeData = useMemo(() => {
    const map = new Map<string, number>();

    operations
      .filter((operation) => operation.type === "income")
      .forEach((operation) => {
        const currentAmount = map.get(operation.category) ?? 0;
        map.set(operation.category, currentAmount + operation.amount);
      });

    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [operations]);

  const accountData = accounts
    .map((account) => ({
      name: account.name,
      amount: account.balance,
      percent: currentCapitalTotal
        ? Math.round((account.balance / currentCapitalTotal) * 100)
        : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const goalData = goals
    .map((goal) => ({
      name: goal.name,
      amount: goal.currentAmount,
      target: goal.targetAmount,
      progress: goal.targetAmount
        ? Math.min(
            100,
            Math.round((goal.currentAmount / goal.targetAmount) * 100)
          )
        : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const budgetData = budgets
    .map((budget) => {
      const progress = budget.limit
        ? Math.min(100, Math.round((budget.spent / budget.limit) * 100))
        : 0;

      return {
        category: budget.category,
        spent: budget.spent,
        limit: budget.limit,
        progress,
        remaining: budget.limit - budget.spent,
      };
    })
    .sort((a, b) => b.spent - a.spent);

  const recentOperations = operations.slice(0, 6);

  const maxMonthlyAmount = Math.max(
    ...monthlyData.map((item) => Math.max(item.income, item.expense)),
    1
  );

  const maxExpenseCategoryAmount = Math.max(
    ...categoryExpenseData.map((item) => item.amount),
    1
  );

  const maxIncomeCategoryAmount = Math.max(
    ...categoryIncomeData.map((item) => item.amount),
    1
  );

  const hasAnyData =
    accounts.length > 0 ||
    goals.length > 0 ||
    capitalSnapshots.length > 0 ||
    operations.length > 0 ||
    budgets.length > 0 ||
    categories.length > 0;

  return (
    <main className="min-h-screen bg-[#080A12] text-white p-4 pb-24">
      <section className="mx-auto w-full max-w-md space-y-6 sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <header className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Мои финансы</p>
              <h1 className="mt-1 text-3xl font-bold">Аналитика</h1>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
              {operations.length} операций
            </div>
          </div>
        </header>

        {!hasAnyData && (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-slate-400">
            Данных пока нет. Добавь счета, цели, бюджеты, операции или историю
            капитала, чтобы здесь появилась аналитика.
          </section>
        )}

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-400/20 via-emerald-400/10 to-white/[0.04] p-5 shadow-2xl shadow-black/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">
                {sortedCapitalSnapshots.length > 0
                  ? "Исторический капитал"
                  : "Текущий капитал"}
              </p>

              <p className="mt-2 text-4xl font-bold tracking-tight">
                {formatMoney(capitalTotal)}
              </p>
            </div>

            <div
              className={`rounded-2xl px-3 py-2 text-sm font-semibold ${
                latestCapitalChange >= 0
                  ? "bg-emerald-400/15 text-emerald-300"
                  : "bg-rose-400/15 text-rose-300"
              }`}
            >
              {latestCapitalChange >= 0 ? "Рост" : "Минус"}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
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

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Последний доход</p>
              <p
                className={`mt-1 text-xl font-semibold ${
                  latestNetIncomeFromSnapshots >= 0
                    ? "text-blue-300"
                    : "text-rose-300"
                }`}
              >
                {formatMoney(
                  sortedCapitalSnapshots.length > 0
                    ? latestNetIncomeFromSnapshots
                    : netResult
                )}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Норма сбережений</p>
              <p
                className={`mt-1 text-xl font-semibold ${
                  sortedCapitalSnapshots.length > 0
                    ? historicalSavingsRate >= 0
                      ? "text-emerald-300"
                      : "text-rose-300"
                    : savingsRate >= 0
                      ? "text-emerald-300"
                      : "text-rose-300"
                }`}
              >
                {sortedCapitalSnapshots.length > 0
                  ? historicalSavingsRate
                  : savingsRate}
                %
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 rounded-3xl bg-white/[0.04] p-1 sm:grid-cols-4">
          {(["overview", "expenses", "income", "capital"] as AnalyticsMode[]).map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                  mode === item
                    ? "bg-white text-neutral-950"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {getModeLabel(item)}
              </button>
            )
          )}
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-xs text-emerald-200/80">Доходы по операциям</p>
            <p className="mt-2 text-lg font-bold text-emerald-300">
              {formatMoney(incomeTotal)}
            </p>
          </div>

          <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4">
            <p className="text-xs text-rose-200/80">Расходы по операциям</p>
            <p className="mt-2 text-lg font-bold text-rose-300">
              {formatMoney(expenseTotal)}
            </p>
          </div>

          <div className="rounded-3xl border border-blue-400/20 bg-blue-400/10 p-4">
            <p className="text-xs text-blue-200/80">Исторический доход</p>
            <p
              className={`mt-2 text-lg font-bold ${
                totalHistoricalNetIncome >= 0
                  ? "text-blue-300"
                  : "text-rose-300"
              }`}
            >
              {formatMoney(totalHistoricalNetIncome)}
            </p>
          </div>
        </section>

        {(mode === "overview" || mode === "capital") && (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">История капитала</h2>
              <p className="mt-1 text-sm text-slate-500">
                Зеленый — капитал, синий — чистый доход, красный —
                отрицательный чистый доход.
              </p>
            </div>

            {sortedCapitalSnapshots.length === 0 && (
              <div className="rounded-3xl bg-black/20 p-4 text-slate-400">
                История капитала пока не добавлена. Открой Профиль → Капитал и
                добавь данные с фото.
              </div>
            )}

            {sortedCapitalSnapshots.length > 0 && (
              <>
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl bg-black/20 p-4">
                    <p className="text-sm text-slate-400">Последний капитал</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-300">
                      {formatMoney(latestCapitalFromSnapshots)}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-black/20 p-4">
                    <p className="text-sm text-slate-400">Последний доход</p>
                    <p
                      className={`mt-1 text-xl font-semibold ${
                        latestNetIncomeFromSnapshots >= 0
                          ? "text-blue-300"
                          : "text-rose-300"
                      }`}
                    >
                      {formatMoney(latestNetIncomeFromSnapshots)}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-black/20 p-4">
                    <p className="text-sm text-slate-400">Изменение</p>
                    <p
                      className={`mt-1 text-xl font-semibold ${
                        latestCapitalChange >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {formatMoney(latestCapitalChange)}
                    </p>
                  </div>
                </div>

                <CapitalLineChart snapshots={sortedCapitalSnapshots} />

                <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {sortedCapitalSnapshots.map((snapshot, index) => {
                    const previous = sortedCapitalSnapshots[index - 1];
                    const change = getSnapshotChange(snapshot, previous);

                    return (
                      <div
                        key={snapshot.id}
                        className="rounded-3xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">
                              {getSnapshotMonthLabel(snapshot.month)}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Чистый доход:{" "}
                              <span
                                className={
                                  snapshot.netIncomeAmount >= 0
                                    ? "text-blue-300"
                                    : "text-rose-300"
                                }
                              >
                                {formatMoney(snapshot.netIncomeAmount)}
                              </span>
                            </p>
                          </div>

                          <p className="text-lg font-bold text-emerald-300">
                            {formatMoney(snapshot.capitalAmount)}
                          </p>
                        </div>

                        {previous && (
                          <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/[0.04] px-3 py-2 text-sm">
                            <span className="text-slate-500">
                              К прошлому месяцу
                            </span>
                            <span
                              className={
                                change >= 0
                                  ? "font-semibold text-emerald-300"
                                  : "font-semibold text-rose-300"
                              }
                            >
                              {formatMoney(change)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {(mode === "overview" || mode === "capital") && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Структура капитала</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Текущие счета и накопления в целях
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-400">Счета</span>
                    <span className="text-blue-300">
                      {currentCapitalTotal
                        ? Math.round((accountsTotal / currentCapitalTotal) * 100)
                        : 0}
                      %
                    </span>
                  </div>

                  <div className="h-3 rounded-full bg-white/[0.06]">
                    <div
                      className="h-3 rounded-full bg-blue-400"
                      style={{
                        width: `${
                          currentCapitalTotal
                            ? Math.round(
                                (accountsTotal / currentCapitalTotal) * 100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-400">Цели</span>
                    <span className="text-emerald-300">
                      {currentCapitalTotal
                        ? Math.round((goalsTotal / currentCapitalTotal) * 100)
                        : 0}
                      %
                    </span>
                  </div>

                  <div className="h-3 rounded-full bg-white/[0.06]">
                    <div
                      className="h-3 rounded-full bg-emerald-400"
                      style={{
                        width: `${
                          currentCapitalTotal
                            ? Math.round((goalsTotal / currentCapitalTotal) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-5">
                <h2 className="text-xl font-semibold">Бюджеты</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Использование лимитов
                </p>
              </div>

              <div className="mb-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-400">Потрачено</span>
                  <span
                    className={
                      budgetProgress >= 100
                        ? "text-rose-300"
                        : budgetProgress >= 80
                          ? "text-orange-300"
                          : "text-emerald-300"
                    }
                  >
                    {budgetProgress}%
                  </span>
                </div>

                <div className="h-3 rounded-full bg-white/[0.06]">
                  <div
                    className={`h-3 rounded-full ${
                      budgetProgress >= 100
                        ? "bg-rose-400"
                        : budgetProgress >= 80
                          ? "bg-orange-400"
                          : "bg-emerald-400"
                    }`}
                    style={{ width: `${budgetProgress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-black/20 p-4">
                  <p className="text-sm text-slate-400">Лимит</p>
                  <p className="mt-1 font-semibold">
                    {formatMoney(totalBudgetLimit)}
                  </p>
                </div>

                <div className="rounded-3xl bg-black/20 p-4">
                  <p className="text-sm text-slate-400">Потрачено</p>
                  <p className="mt-1 font-semibold">
                    {formatMoney(totalBudgetSpent)}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {(mode === "overview" || mode === "expenses" || mode === "income") && (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Динамика по месяцам</h2>
              <p className="mt-1 text-sm text-slate-500">
                Доходы, расходы и переводы по операциям
              </p>
            </div>

            {monthlyData.length === 0 && (
              <div className="rounded-3xl bg-black/20 p-4 text-slate-400">
                Операций пока нет
              </div>
            )}

            <div className="space-y-5">
              {monthlyData.map((item) => (
                <div key={item.month} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold">{getMonthLabel(item.month)}</p>
                    <p className="text-sm text-slate-500">
                      {formatMoney(item.income - item.expense)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-emerald-300">Доходы</span>
                        <span className="text-slate-500">
                          {formatMoney(item.income)}
                        </span>
                      </div>

                      <div className="h-2 rounded-full bg-white/[0.06]">
                        <div
                          className="h-2 rounded-full bg-emerald-400"
                          style={{
                            width: `${Math.round(
                              (item.income / maxMonthlyAmount) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-rose-300">Расходы</span>
                        <span className="text-slate-500">
                          {formatMoney(item.expense)}
                        </span>
                      </div>

                      <div className="h-2 rounded-full bg-white/[0.06]">
                        <div
                          className="h-2 rounded-full bg-rose-400"
                          style={{
                            width: `${Math.round(
                              (item.expense / maxMonthlyAmount) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {item.transfer > 0 && (
                      <div>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-blue-300">Переводы</span>
                          <span className="text-slate-500">
                            {formatMoney(item.transfer)}
                          </span>
                        </div>

                        <div className="h-2 rounded-full bg-white/[0.06]">
                          <div
                            className="h-2 rounded-full bg-blue-400"
                            style={{
                              width: `${Math.round(
                                (item.transfer / maxMonthlyAmount) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(mode === "overview" || mode === "expenses" || mode === "income") && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {(mode === "overview" || mode === "expenses") && (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-5">
                  <h2 className="text-xl font-semibold">
                    Расходы по категориям
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Где уходит больше всего
                  </p>
                </div>

                {categoryExpenseData.length === 0 && (
                  <div className="rounded-3xl bg-black/20 p-4 text-slate-400">
                    Расходов пока нет
                  </div>
                )}

                <div className="space-y-4">
                  {categoryExpenseData.map((item) => {
                    const percent = expenseTotal
                      ? Math.round((item.amount / expenseTotal) * 100)
                      : 0;

                    return (
                      <div key={item.category}>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">{item.category}</p>
                            <p className="text-sm text-slate-500">
                              {percent}% от расходов
                            </p>
                          </div>

                          <p className="font-semibold text-rose-300">
                            {formatMoney(item.amount)}
                          </p>
                        </div>

                        <div className="h-3 rounded-full bg-white/[0.06]">
                          <div
                            className="h-3 rounded-full bg-rose-400"
                            style={{
                              width: `${Math.round(
                                (item.amount / maxExpenseCategoryAmount) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(mode === "overview" || mode === "income") && (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-5">
                  <h2 className="text-xl font-semibold">
                    Доходы по категориям
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Основные источники поступлений
                  </p>
                </div>

                {categoryIncomeData.length === 0 && (
                  <div className="rounded-3xl bg-black/20 p-4 text-slate-400">
                    Доходов пока нет
                  </div>
                )}

                <div className="space-y-4">
                  {categoryIncomeData.map((item) => {
                    const percent = incomeTotal
                      ? Math.round((item.amount / incomeTotal) * 100)
                      : 0;

                    return (
                      <div key={item.category}>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">{item.category}</p>
                            <p className="text-sm text-slate-500">
                              {percent}% от доходов
                            </p>
                          </div>

                          <p className="font-semibold text-emerald-300">
                            {formatMoney(item.amount)}
                          </p>
                        </div>

                        <div className="h-3 rounded-full bg-white/[0.06]">
                          <div
                            className="h-3 rounded-full bg-emerald-400"
                            style={{
                              width: `${Math.round(
                                (item.amount / maxIncomeCategoryAmount) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {mode === "capital" && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-5">
                <h2 className="text-xl font-semibold">Счета</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Распределение текущих денег по счетам
                </p>
              </div>

              {accountData.length === 0 && (
                <div className="rounded-3xl bg-black/20 p-4 text-slate-400">
                  Счетов пока нет
                </div>
              )}

              <div className="space-y-4">
                {accountData.map((item) => (
                  <div key={item.name}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-slate-500">
                          {item.percent}% от текущего капитала
                        </p>
                      </div>

                      <p className="font-semibold text-blue-300">
                        {formatMoney(item.amount)}
                      </p>
                    </div>

                    <div className="h-3 rounded-full bg-white/[0.06]">
                      <div
                        className="h-3 rounded-full bg-blue-400"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-5">
                <h2 className="text-xl font-semibold">Цели</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Прогресс накоплений
                </p>
              </div>

              {goalData.length === 0 && (
                <div className="rounded-3xl bg-black/20 p-4 text-slate-400">
                  Целей пока нет
                </div>
              )}

              <div className="space-y-4">
                {goalData.map((item) => (
                  <div key={item.name}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-slate-500">
                          {formatMoney(item.amount)} из{" "}
                          {formatMoney(item.target)}
                        </p>
                      </div>

                      <p className="font-semibold text-emerald-300">
                        {item.progress}%
                      </p>
                    </div>

                    <div className="h-3 rounded-full bg-white/[0.06]">
                      <div
                        className="h-3 rounded-full bg-emerald-400"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {(mode === "overview" || mode === "expenses") && (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Лимиты</h2>
              <p className="mt-1 text-sm text-slate-500">
                Состояние бюджетов по категориям
              </p>
            </div>

            {budgetData.length === 0 && (
              <div className="rounded-3xl bg-black/20 p-4 text-slate-400">
                Бюджетов пока нет
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {budgetData.map((item) => (
                <div
                  key={item.category}
                  className="rounded-3xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{item.category}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatMoney(item.spent)} из {formatMoney(item.limit)}
                      </p>
                    </div>

                    <p
                      className={`font-semibold ${
                        item.remaining < 0
                          ? "text-rose-300"
                          : item.progress >= 80
                            ? "text-orange-300"
                            : "text-emerald-300"
                      }`}
                    >
                      {item.remaining < 0 ? "Превышен" : `${item.progress}%`}
                    </p>
                  </div>

                  <div className="h-3 rounded-full bg-white/[0.06]">
                    <div
                      className={`h-3 rounded-full ${
                        item.remaining < 0
                          ? "bg-rose-400"
                          : item.progress >= 80
                            ? "bg-orange-400"
                            : "bg-emerald-400"
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>

                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-slate-500">
                      {item.remaining < 0 ? "Превышение" : "Осталось"}
                    </span>
                    <span
                      className={
                        item.remaining < 0 ? "text-rose-300" : "text-slate-300"
                      }
                    >
                      {formatMoney(Math.abs(item.remaining))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Последние операции</h2>
            <p className="mt-1 text-sm text-slate-500">
              Быстрый обзор активности
            </p>
          </div>

          {recentOperations.length === 0 && (
            <div className="rounded-3xl bg-black/20 p-4 text-slate-400">
              Операций пока нет
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {recentOperations.map((operation) => (
              <div
                key={operation.id}
                className="rounded-3xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{operation.title}</p>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {getOperationTypeLabel(operation.type)} ·{" "}
                      {getOperationSource(operation)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-bold ${getOperationColor(
                        operation.type
                      )}`}
                    >
                      {formatMoney(operation.amount)}
                    </p>

                    <div
                      className={`ml-auto mt-2 h-2 w-12 rounded-full ${getOperationBg(
                        operation.type
                      )}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}