"use client";

import { useMemo, useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney } from "@/lib/format";
import type { TrashItem } from "@/types/finance";

function getTrashTypeLabel(type: TrashItem["type"]) {
  if (type === "account") return "Счет";
  if (type === "goal") return "Цель";
  if (type === "operation") return "Операция";
  if (type === "budget") return "Бюджет";
  if (type === "category") return "Категория";
  if (type === "template") return "Шаблон";
  return "Элемент";
}

function getTrashTypeClass(type: TrashItem["type"]) {
  if (type === "account") return "border-blue-400/20 bg-blue-400/10 text-blue-300";
  if (type === "goal") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  if (type === "operation") return "border-purple-400/20 bg-purple-400/10 text-purple-300";
  if (type === "budget") return "border-orange-400/20 bg-orange-400/10 text-orange-300";
  if (type === "category") return "border-pink-400/20 bg-pink-400/10 text-pink-300";
  return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
}

function getTrashDescription(item: TrashItem) {
  const data = item.data as any;

  if (item.type === "account") {
    return `Баланс: ${formatMoney(Number(data.balance ?? 0))}`;
  }

  if (item.type === "goal") {
    return `Накоплено: ${formatMoney(Number(data.currentAmount ?? 0))} из ${formatMoney(
      Number(data.targetAmount ?? 0)
    )}`;
  }

  if (item.type === "operation") {
    return `${data.type ?? "Операция"} · ${formatMoney(Number(data.amount ?? 0))}`;
  }

  if (item.type === "budget") {
    return `Лимит: ${formatMoney(Number(data.limit ?? 0))}`;
  }

  if (item.type === "category") {
    return data.type === "income" ? "Категория доходов" : "Категория расходов";
  }

  if (item.type === "template") {
    return `${data.frequency ?? "Шаблон"} · ${formatMoney(Number(data.amount ?? 0))}`;
  }

  return "Удаленный элемент";
}

function formatDeletedDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function TrashPage() {
  const {
    trashItems,
    restoreTrashItem,
    deleteTrashItemForever,
    clearTrash,
  } = useFinance();

  const [isProcessing, setIsProcessing] = useState(false);

  const sortedTrashItems = useMemo(
    () =>
      [...trashItems].sort((a, b) =>
        String(b.deletedAt).localeCompare(String(a.deletedAt))
      ),
    [trashItems]
  );

  const groupedCounts = useMemo(() => {
    return trashItems.reduce<Record<string, number>>((result, item) => {
      result[item.type] = (result[item.type] ?? 0) + 1;
      return result;
    }, {});
  }, [trashItems]);

  async function restoreItem(id: string) {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      await restoreTrashItem(id);
    } finally {
      setIsProcessing(false);
    }
  }

  async function deleteForever(id: string) {
    if (isProcessing) return;

    const confirmed = window.confirm(
      "Удалить элемент навсегда?\n\nЭто действие нельзя будет отменить."
    );

    if (!confirmed) return;

    setIsProcessing(true);

    try {
      await deleteTrashItemForever(id);
    } finally {
      setIsProcessing(false);
    }
  }

  async function clearAllTrash() {
    if (isProcessing) return;

    const confirmed = window.confirm(
      "Очистить всю корзину?\n\nВсе элементы будут удалены навсегда."
    );

    if (!confirmed) return;

    setIsProcessing(true);

    try {
      await clearTrash();
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080A12] p-4 pb-24 text-white">
      <section className="mx-auto w-full max-w-md space-y-6 sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <header className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Профиль</p>
              <h1 className="mt-1 text-3xl font-bold">Корзина</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Здесь хранятся удаленные счета, цели, операции, бюджеты,
                категории и шаблоны.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
              {trashItems.length} шт.
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-rose-400/20 via-orange-400/10 to-white/[0.04] p-5 shadow-2xl shadow-black/30">
          <p className="text-sm text-slate-300">Удаленные элементы</p>

          <p className="mt-2 text-4xl font-bold tracking-tight">
            {trashItems.length}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Счета</p>
              <p className="mt-1 text-xl font-semibold">
                {groupedCounts.account ?? 0}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Операции</p>
              <p className="mt-1 text-xl font-semibold">
                {groupedCounts.operation ?? 0}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Цели</p>
              <p className="mt-1 text-xl font-semibold">
                {groupedCounts.goal ?? 0}
              </p>
            </div>
          </div>
        </section>

        {trashItems.length > 0 && (
          <button
            type="button"
            onClick={clearAllTrash}
            disabled={isProcessing}
            className="w-full rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4 font-bold text-rose-300 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? "Обрабатываю..." : "Очистить корзину"}
          </button>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Список</h2>

            <p className="text-sm text-slate-500">
              {sortedTrashItems.length} найдено
            </p>
          </div>

          {sortedTrashItems.length === 0 && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-slate-400">
              Корзина пустая.
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {sortedTrashItems.map((item) => (
              <article
                key={`${item.type}-${item.id}`}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div
                      className={`mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getTrashTypeClass(
                        item.type
                      )}`}
                    >
                      {getTrashTypeLabel(item.type)}
                    </div>

                    <p className="truncate text-lg font-semibold">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {getTrashDescription(item)}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Удалено: {formatDeletedDate(item.deletedAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => restoreItem(item.id)}
                    className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Восстановить
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => deleteForever(item.id)}
                    className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Удалить навсегда
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}