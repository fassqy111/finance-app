"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney } from "@/lib/format";
import type { CapitalSnapshot } from "@/types/finance";

const historicalSnapshots = [
  { month: "2025-04-01", capitalAmount: 68589, netIncomeAmount: -1734 },
  { month: "2025-05-01", capitalAmount: 135854, netIncomeAmount: 67265 },
  { month: "2025-06-01", capitalAmount: 151565, netIncomeAmount: 15711 },
  { month: "2025-07-01", capitalAmount: 88996, netIncomeAmount: -62967 },
  { month: "2025-08-01", capitalAmount: 112314, netIncomeAmount: 23318 },
  { month: "2025-09-01", capitalAmount: 110972, netIncomeAmount: -613 },
  { month: "2025-10-01", capitalAmount: 24397, netIncomeAmount: -72621 },
  { month: "2025-11-01", capitalAmount: 59973, netIncomeAmount: 35577 },
  { month: "2025-12-01", capitalAmount: 269422, netIncomeAmount: 200784 },
  { month: "2026-01-01", capitalAmount: 253182, netIncomeAmount: -16240 },
  { month: "2026-02-01", capitalAmount: 349207, netIncomeAmount: 96025 },
  { month: "2026-03-01", capitalAmount: 392213, netIncomeAmount: 39762 },
  { month: "2026-04-01", capitalAmount: 543762, netIncomeAmount: 149148 },
  { month: "2026-05-01", capitalAmount: 594338, netIncomeAmount: 50576 },
];

const monthLabels = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];

function getMonthLabel(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return `${monthLabels[parsedDate.getMonth()]} ${parsedDate.getFullYear()}`;
}

function getShortMonthLabel(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return monthLabels[parsedDate.getMonth()].slice(0, 3).toUpperCase();
}

function getPath(points: { x: number; y: number }[]) {
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

function CapitalLineChart({
  snapshots,
}: {
  snapshots: CapitalSnapshot[];
}) {
  const sortedSnapshots = [...snapshots].sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  if (sortedSnapshots.length === 0) {
    return (
      <div className="rounded-3xl bg-black/20 p-4 text-slate-400">
        Данных пока нет
      </div>
    );
  }

  const width = Math.max(760, sortedSnapshots.length * 90);
  const height = 380;
  const paddingX = 42;
  const paddingTop = 48;
  const paddingBottom = 58;

  const allValues = sortedSnapshots.flatMap((snapshot) => [
    snapshot.capitalAmount,
    snapshot.netIncomeAmount,
  ]);

  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues, 1);
  const valueRange = maxValue - minValue || 1;

  function getX(index: number) {
    if (sortedSnapshots.length === 1) {
      return width / 2;
    }

    return (
      paddingX +
      (index * (width - paddingX * 2)) / (sortedSnapshots.length - 1)
    );
  }

  function getY(value: number) {
    return (
      paddingTop +
      ((maxValue - value) / valueRange) *
        (height - paddingTop - paddingBottom)
    );
  }

  const capitalPoints = sortedSnapshots.map((snapshot, index) => ({
    x: getX(index),
    y: getY(snapshot.capitalAmount),
  }));

  const incomePoints = sortedSnapshots.map((snapshot, index) => ({
    x: getX(index),
    y: getY(snapshot.netIncomeAmount),
  }));

  const zeroY = getY(0);

  return (
    <div className="overflow-x-auto rounded-[2rem] bg-black/20 p-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="block"
      >
        <line
          x1={paddingX}
          y1={zeroY}
          x2={width - paddingX}
          y2={zeroY}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />

        <path
          d={getPath(capitalPoints)}
          fill="none"
          stroke="#34d399"
          strokeWidth="8"
          strokeLinecap="round"
        />

        <path
          d={getPath(incomePoints)}
          fill="none"
          stroke="#60a5fa"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {capitalPoints.map((point, index) => {
          const snapshot = sortedSnapshots[index];

          return (
            <g key={`capital-${snapshot.id}`}>
              <circle cx={point.x} cy={point.y} r="7" fill="#34d399" />

              <text
                x={point.x}
                y={point.y - 14}
                textAnchor="middle"
                fontSize="16"
                fontWeight="700"
                fill="#6ee7b7"
              >
                {formatMoney(snapshot.capitalAmount)}
              </text>
            </g>
          );
        })}

        {incomePoints.map((point, index) => {
          const snapshot = sortedSnapshots[index];

          return (
            <g key={`income-${snapshot.id}`}>
              <circle cx={point.x} cy={point.y} r="7" fill="#60a5fa" />

              <text
                x={point.x}
                y={point.y - 14}
                textAnchor="middle"
                fontSize="16"
                fontWeight="700"
                fill={
                  snapshot.netIncomeAmount >= 0 ? "#93c5fd" : "#fda4af"
                }
              >
                {formatMoney(snapshot.netIncomeAmount)}
              </text>
            </g>
          );
        })}

        {sortedSnapshots.map((snapshot, index) => (
          <text
            key={`month-${snapshot.id}`}
            x={getX(index)}
            y={height - 20}
            textAnchor="middle"
            fontSize="15"
            fontWeight="700"
            fill="#94a3b8"
          >
            {getShortMonthLabel(snapshot.month)}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function CapitalPage() {
  const {
    capitalSnapshots,
    addCapitalSnapshot,
    updateCapitalSnapshot,
    deleteCapitalSnapshot,
  } = useFinance();

  const [month, setMonth] = useState("2025-04-01");
  const [capitalAmount, setCapitalAmount] = useState("");
  const [netIncomeAmount, setNetIncomeAmount] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const sortedSnapshots = [...capitalSnapshots].sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  const latestSnapshot = sortedSnapshots[sortedSnapshots.length - 1];
  const previousSnapshot = sortedSnapshots[sortedSnapshots.length - 2];

  const capitalChange =
    latestSnapshot && previousSnapshot
      ? latestSnapshot.capitalAmount - previousSnapshot.capitalAmount
      : 0;

  const totalNetIncome = sortedSnapshots.reduce(
    (sum, snapshot) => sum + snapshot.netIncomeAmount,
    0
  );

  function resetForm() {
    setMonth("2025-04-01");
    setCapitalAmount("");
    setNetIncomeAmount("");
    setNote("");
    setEditingId(null);
  }

  async function saveSnapshot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericCapital = Number(capitalAmount);
    const numericNetIncome = Number(netIncomeAmount);

    if (
      !month ||
      Number.isNaN(numericCapital) ||
      Number.isNaN(numericNetIncome)
    ) {
      alert("Заполни месяц, капитал и чистый доход");
      return;
    }

    if (editingId) {
      await updateCapitalSnapshot({
        id: editingId,
        month,
        capitalAmount: numericCapital,
        netIncomeAmount: numericNetIncome,
        note: note.trim(),
      });
    } else {
      await addCapitalSnapshot({
        month,
        capitalAmount: numericCapital,
        netIncomeAmount: numericNetIncome,
        note: note.trim(),
      });
    }

    resetForm();
  }

  function startEdit(snapshot: CapitalSnapshot) {
    setEditingId(snapshot.id);
    setMonth(snapshot.month);
    setCapitalAmount(String(snapshot.capitalAmount));
    setNetIncomeAmount(String(snapshot.netIncomeAmount));
    setNote(snapshot.note ?? "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function seedHistoricalData() {
    const confirmed = window.confirm(
      "Добавить исторические данные капитала с фото?\n\nЕсли месяцы уже есть, они будут обновлены."
    );

    if (!confirmed) return;

    setIsSeeding(true);

    for (const snapshot of historicalSnapshots) {
      await addCapitalSnapshot({
        ...snapshot,
        note: "Импортировано с фото статистики",
      });
    }

    setIsSeeding(false);
  }

  return (
    <main className="min-h-screen bg-[#080A12] text-white p-4 pb-24">
      <section className="mx-auto w-full max-w-md space-y-6 sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <header className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Профиль</p>
              <h1 className="mt-1 text-3xl font-bold">Капитал</h1>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
              {capitalSnapshots.length} мес.
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-400/20 via-blue-400/10 to-white/[0.04] p-5 shadow-2xl shadow-black/30">
          <p className="text-sm text-slate-300">Последний капитал</p>

          <p className="mt-2 text-4xl font-bold tracking-tight">
            {formatMoney(latestSnapshot?.capitalAmount ?? 0)}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Последний доход</p>
              <p
                className={`mt-1 text-xl font-semibold ${
                  (latestSnapshot?.netIncomeAmount ?? 0) >= 0
                    ? "text-blue-300"
                    : "text-rose-300"
                }`}
              >
                {formatMoney(latestSnapshot?.netIncomeAmount ?? 0)}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Изменение капитала</p>
              <p
                className={`mt-1 text-xl font-semibold ${
                  capitalChange >= 0 ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {formatMoney(capitalChange)}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Сумма дохода</p>
              <p
                className={`mt-1 text-xl font-semibold ${
                  totalNetIncome >= 0 ? "text-blue-300" : "text-rose-300"
                }`}
              >
                {formatMoney(totalNetIncome)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">График капитала</h2>
            <p className="mt-1 text-sm text-slate-500">
              Зеленый — капитал, синий — чистый доход
            </p>
          </div>

          <CapitalLineChart snapshots={sortedSnapshots} />

          {latestSnapshot && (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-emerald-400/10 p-4">
                <p className="text-sm text-emerald-200/80">Капитал</p>
                <p className="mt-1 text-2xl font-bold text-emerald-300">
                  {formatMoney(latestSnapshot.capitalAmount)}
                </p>
              </div>

              <div className="rounded-3xl bg-blue-400/10 p-4">
                <p className="text-sm text-blue-200/80">Чистый доход</p>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    latestSnapshot.netIncomeAmount >= 0
                      ? "text-blue-300"
                      : "text-rose-300"
                  }`}
                >
                  {formatMoney(latestSnapshot.netIncomeAmount)}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={saveSnapshot}
            className="space-y-4 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-5 shadow-2xl shadow-black/30"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">
                {editingId ? "Редактировать месяц" : "Добавить месяц"}
              </h2>

              {editingId && (
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
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              type="date"
              className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-emerald-400/60"
            />

            <input
              value={capitalAmount}
              onChange={(event) => setCapitalAmount(event.target.value)}
              placeholder="Капитал"
              type="number"
              className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
            />

            <input
              value={netIncomeAmount}
              onChange={(event) => setNetIncomeAmount(event.target.value)}
              placeholder="Чистый доход"
              type="number"
              className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-400/60"
            />

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Заметка"
              rows={3}
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
            />

            <button
              type="submit"
              className="w-full rounded-3xl bg-white p-4 font-bold text-neutral-950 transition hover:bg-slate-200"
            >
              {editingId ? "Сохранить изменения" : "Добавить месяц"}
            </button>

            <button
              type="button"
              onClick={seedHistoricalData}
              disabled={isSeeding}
              className="w-full rounded-3xl bg-emerald-400/15 p-4 font-bold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-50"
            >
              {isSeeding ? "Добавляю..." : "Добавить данные с фото"}
            </button>
          </form>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-semibold">Как читать график</h2>

            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
              <p>
                Зеленая линия показывает общий капитал на конец каждого месяца.
              </p>

              <p>
                Синяя линия показывает чистый доход за месяц. Если значение
                отрицательное, подпись будет красной.
              </p>

              <p>
                График можно прокручивать горизонтально, как в приложении со
                скриншота.
              </p>
            </div>
          </section>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">История</h2>

            <p className="text-sm text-slate-500">
              {sortedSnapshots.length} записей
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {sortedSnapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {getMonthLabel(snapshot.month)}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Капитал: {formatMoney(snapshot.capitalAmount)}
                    </p>
                  </div>

                  <p
                    className={`text-lg font-bold ${
                      snapshot.netIncomeAmount >= 0
                        ? "text-blue-300"
                        : "text-rose-300"
                    }`}
                  >
                    {formatMoney(snapshot.netIncomeAmount)}
                  </p>
                </div>

                {snapshot.note && (
                  <p className="mt-3 rounded-2xl bg-black/20 p-3 text-sm text-slate-400">
                    {snapshot.note}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(snapshot)}
                    className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.1]"
                  >
                    Редактировать
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteCapitalSnapshot(snapshot.id)}
                    className="rounded-xl bg-rose-400/10 px-4 py-2 text-sm text-rose-300 hover:bg-rose-400/15"
                  >
                    Удалить
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