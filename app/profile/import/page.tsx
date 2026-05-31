"use client";

import { useMemo, useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import type {
  Account,
  Category,
  Goal,
  Operation,
} from "@/types/finance";

type ImportData = {
  version?: number;
  source?: string;
  mode?: string;
  accounts?: Omit<Account, "id">[];
  goals?: Omit<Goal, "id">[];
  categories?: Omit<Category, "id">[];
  operations?: Omit<Operation, "id">[];
};

export default function ImportExportPage() {
  const {
    accounts,
    goals,
    categories,
    operations,
    addAccount,
    addGoal,
    addCategory,
    addOperation,
  } = useFinance();

  const [rawJson, setRawJson] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState("");

  const parsedData = useMemo(() => {
    if (!rawJson.trim()) return null;

    try {
      return JSON.parse(rawJson) as ImportData;
    } catch {
      return null;
    }
  }, [rawJson]);

  const accountsToImport = parsedData?.accounts ?? [];
  const goalsToImport = parsedData?.goals ?? [];
  const categoriesToImport = parsedData?.categories ?? [];
  const operationsToImport = parsedData?.operations ?? [];

  const isValidJson = Boolean(parsedData);

  function exportData() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      accounts,
      goals,
      categories,
      operations,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `finance-export-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  async function importData() {
    if (!parsedData) {
      alert("Вставь корректный JSON");
      return;
    }

    const confirmImport = window.confirm(
      "Начать импорт?\n\nВажно: импорт добавит данные к текущим данным приложения. Если ты уже очистила счета, цели и операции — можно продолжать."
    );

    if (!confirmImport) return;

    setIsImporting(true);
    setStatus("Начинаем импорт...");

    try {
      const existingAccountNames = new Set(accounts.map((item) => item.name));
      const existingGoalNames = new Set(goals.map((item) => item.name));
      const existingCategoryKeys = new Set(
        categories.map((item) => `${item.type}:${item.name}`)
      );

      let createdAccounts = 0;
      let createdGoals = 0;
      let createdCategories = 0;
      let createdOperations = 0;

      for (const account of accountsToImport) {
        if (!account.name || existingAccountNames.has(account.name)) continue;

        setStatus(`Создаем счет: ${account.name}`);

        await addAccount({
          name: account.name,
          balance: Number(account.balance ?? 0),
          currency: "₽",
        });

        existingAccountNames.add(account.name);
        createdAccounts += 1;
      }

      for (const goal of goalsToImport) {
        if (!goal.name || existingGoalNames.has(goal.name)) continue;

        setStatus(`Создаем цель: ${goal.name}`);

        await addGoal({
          name: goal.name,
          currentAmount: Number(goal.currentAmount ?? 0),
          targetAmount: Number(goal.targetAmount ?? 0),
          currency: "₽",
        });

        existingGoalNames.add(goal.name);
        createdGoals += 1;
      }

      for (const category of categoriesToImport) {
        if (!category.name) continue;

        const key = `${category.type}:${category.name}`;

        if (existingCategoryKeys.has(key)) continue;

        setStatus(`Создаем категорию: ${category.name}`);

        await addCategory({
          name: category.name,
          type: category.type,
        });

        existingCategoryKeys.add(key);
        createdCategories += 1;
      }

      for (let index = 0; index < operationsToImport.length; index += 1) {
        const operation = operationsToImport[index];

        setStatus(
          `Импорт операций: ${index + 1} из ${operationsToImport.length}`
        );

        await addOperation({
          type: operation.type,
          title: operation.title,
          amount: Number(operation.amount ?? 0),
          account: operation.account,
          toAccount: operation.toAccount,
          fromTargetType: operation.fromTargetType ?? "account",
          toTargetType: operation.toTargetType ?? "account",
          goal: operation.goal,
          toGoal: operation.toGoal,
          category: operation.category,
          note: operation.note ?? "",
          date: operation.date,
        });

        createdOperations += 1;
      }

      setStatus(
        `Готово. Создано: счетов ${createdAccounts}, целей ${createdGoals}, категорий ${createdCategories}, операций ${createdOperations}.`
      );

      setRawJson("");
    } catch (error) {
      console.error(error);
      setStatus("Ошибка импорта. Открой Console и пришли скриншот ошибки.");
      alert("Ошибка импорта. Проверь консоль браузера.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080A12] text-white p-4 pb-24">
      <section className="mx-auto w-full max-w-md space-y-6 sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <header className="pt-4">
          <p className="text-sm text-slate-400">Профиль</p>
          <h1 className="mt-1 text-3xl font-bold">Импорт / Экспорт</h1>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-400/20 via-blue-400/10 to-white/[0.04] p-5 shadow-2xl shadow-black/30">
          <p className="text-sm text-slate-300">Перенос данных</p>

          <p className="mt-2 text-4xl font-bold tracking-tight">JSON</p>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Счета</p>
              <p className="mt-1 text-xl font-semibold">{accounts.length}</p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Цели</p>
              <p className="mt-1 text-xl font-semibold">{goals.length}</p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Категории</p>
              <p className="mt-1 text-xl font-semibold">
                {categories.length}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Операции</p>
              <p className="mt-1 text-xl font-semibold">
                {operations.length}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-semibold">Экспорт</h2>

            <p className="text-sm leading-6 text-slate-400">
              Скачивает текущие данные приложения в JSON-файл. Это можно
              использовать как резервную копию.
            </p>

            <button
              type="button"
              onClick={exportData}
              className="w-full rounded-3xl bg-white p-4 font-bold text-neutral-950 transition hover:bg-slate-200"
            >
              Скачать экспорт
            </button>
          </section>

          <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-semibold">Импорт</h2>

            <p className="text-sm leading-6 text-slate-400">
              Вставь содержимое JSON-файла импорта. Приложение создаст счета,
              категории и операции. Балансы восстановятся по операциям.
            </p>

            <textarea
              value={rawJson}
              onChange={(event) => setRawJson(event.target.value)}
              placeholder="Вставь JSON сюда"
              rows={12}
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-4 font-mono text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/60"
            />

            {rawJson.trim() && !isValidJson && (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">
                JSON пока некорректный. Проверь, что ты вставила весь файл
                целиком.
              </div>
            )}

            {parsedData && (
              <div className="grid grid-cols-2 gap-3 rounded-3xl bg-black/20 p-4">
                <div>
                  <p className="text-xs text-slate-500">Счета</p>
                  <p className="mt-1 font-semibold">
                    {accountsToImport.length}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Цели</p>
                  <p className="mt-1 font-semibold">{goalsToImport.length}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Категории</p>
                  <p className="mt-1 font-semibold">
                    {categoriesToImport.length}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Операции</p>
                  <p className="mt-1 font-semibold">
                    {operationsToImport.length}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={importData}
              disabled={!isValidJson || isImporting}
              className="w-full rounded-3xl bg-white p-4 font-bold text-neutral-950 transition hover:bg-slate-200 disabled:opacity-50"
            >
              {isImporting ? "Импорт идет..." : "Импортировать"}
            </button>

            {status && (
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-slate-300">
                {status}
              </div>
            )}
          </section>
        </section>

        <section className="rounded-[2rem] border border-orange-400/20 bg-orange-400/10 p-5">
          <h2 className="text-xl font-semibold text-orange-200">Важно</h2>

          <p className="mt-3 text-sm leading-6 text-orange-100/80">
            Перед большим импортом лучше убедиться, что текущие тестовые счета,
            цели и операции удалены. Иначе импорт добавится поверх текущих
            данных.
          </p>
        </section>
      </section>
    </main>
  );
}