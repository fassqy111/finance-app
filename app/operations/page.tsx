"use client";

import { useMemo, useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney } from "@/lib/format";
import type { Operation, OperationType } from "@/types/finance";

type OperationFilter = "all" | OperationType;
type TransferTargetType = "account" | "goal";

const operationTypes: { value: OperationType; label: string }[] = [
  { value: "expense", label: "Расход" },
  { value: "income", label: "Доход" },
  { value: "transfer", label: "Перевод" },
];

const filters: { value: OperationFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "expense", label: "Расходы" },
  { value: "income", label: "Доходы" },
  { value: "transfer", label: "Переводы" },
];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateForInput(date: string) {
  if (!date) return getTodayDate();

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return getTodayDate();
  }

  return parsedDate.toISOString().slice(0, 10);
}

function formatDateLabel(date: string) {
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

function getOperationTypeLabel(type: OperationType) {
  if (type === "expense") return "Расход";
  if (type === "income") return "Доход";
  return "Перевод";
}

function getOperationAmountClass(type: OperationType) {
  if (type === "expense") return "text-rose-300";
  if (type === "income") return "text-emerald-300";
  return "text-blue-300";
}

function getOperationCardClass(type: OperationType) {
  if (type === "expense") {
    return "border-rose-400/20 bg-rose-400/10";
  }

  if (type === "income") {
    return "border-emerald-400/20 bg-emerald-400/10";
  }

  return "border-blue-400/20 bg-blue-400/10";
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

export default function OperationsPage() {
  const {
    accounts,
    goals,
    operations,
    categories,
    addOperation,
    deleteOperation,
  } = useFinance();

  const expenseCategories = categories.filter(
    (category) => category.type === "expense"
  );

  const incomeCategories = categories.filter(
    (category) => category.type === "income"
  );

  const [operationType, setOperationType] =
    useState<OperationType>("expense");

  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState(accounts[0]?.name ?? "");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [note, setNote] = useState("");

  const [fromTargetType, setFromTargetType] =
    useState<TransferTargetType>("account");
  const [toTargetType, setToTargetType] =
    useState<TransferTargetType>("goal");

  const [fromAccount, setFromAccount] = useState(accounts[0]?.name ?? "");
  const [toAccount, setToAccount] = useState(accounts[1]?.name ?? "");
  const [fromGoal, setFromGoal] = useState(goals[0]?.name ?? "");
  const [toGoal, setToGoal] = useState(goals[0]?.name ?? "");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OperationFilter>("all");

  const incomeTotal = operations
    .filter((operation) => operation.type === "income")
    .reduce((sum, operation) => sum + operation.amount, 0);

  const expenseTotal = operations
    .filter((operation) => operation.type === "expense")
    .reduce((sum, operation) => sum + operation.amount, 0);

  const transferTotal = operations
    .filter((operation) => operation.type === "transfer")
    .reduce((sum, operation) => sum + operation.amount, 0);

  const filteredOperations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return operations.filter((operation) => {
      const matchesFilter =
        filter === "all" ? true : operation.type === filter;

      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          operation.title,
          operation.account,
          operation.toAccount,
          operation.goal,
          operation.toGoal,
          operation.category,
          operation.note,
          String(operation.amount),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [filter, operations, search]);

  function resetForm() {
    setTitle("");
    setAmount("");
    setAccount(accounts[0]?.name ?? "");
    setCategory("");
    setDate(getTodayDate());
    setNote("");

    setFromTargetType("account");
    setToTargetType("goal");
    setFromAccount(accounts[0]?.name ?? "");
    setToAccount(accounts[1]?.name ?? "");
    setFromGoal(goals[0]?.name ?? "");
    setToGoal(goals[0]?.name ?? "");
  }

  function getCurrentCategoryOptions() {
    if (operationType === "income") return incomeCategories;
    if (operationType === "expense") return expenseCategories;
    return [];
  }

  async function saveOperation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) return;

    const numericAmount = Number(String(amount).replace(",", "."));

    if (!title.trim()) {
      alert("Укажи название операции");
      return;
    }

    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      alert("Укажи корректную сумму");
      return;
    }

    if (operationType !== "transfer" && !account) {
      alert("Выбери счет");
      return;
    }

    if (operationType !== "transfer" && !category) {
      alert("Выбери категорию");
      return;
    }

    setIsSaving(true);

    try {
      if (operationType === "transfer") {
        const selectedFromAccount =
          fromTargetType === "account" ? fromAccount : "";
        const selectedFromGoal = fromTargetType === "goal" ? fromGoal : "";

        const selectedToAccount = toTargetType === "account" ? toAccount : "";
        const selectedToGoal = toTargetType === "goal" ? toGoal : "";

        if (fromTargetType === "account" && !selectedFromAccount) {
          alert("Выбери счет списания");
          return;
        }

        if (fromTargetType === "goal" && !selectedFromGoal) {
          alert("Выбери цель списания");
          return;
        }

        if (toTargetType === "account" && !selectedToAccount) {
          alert("Выбери счет зачисления");
          return;
        }

        if (toTargetType === "goal" && !selectedToGoal) {
          alert("Выбери цель зачисления");
          return;
        }

        await addOperation({
          title: title.trim(),
          type: "transfer",
          amount: numericAmount,
          account: selectedFromAccount,
          goal: selectedFromGoal,
          toAccount: selectedToAccount,
          toGoal: selectedToGoal,
          fromTargetType,
          toTargetType,
          category: "Перевод",
          date,
          note: note.trim(),
        });

        resetForm();
        return;
      }

      await addOperation({
        title: title.trim(),
        type: operationType,
        amount: numericAmount,
        account,
        category,
        date,
        note: note.trim(),
      });

      resetForm();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080A12] text-white p-4 pb-24">
      <section className="mx-auto w-full max-w-md space-y-6 sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <header className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Мои финансы</p>
              <h1 className="mt-1 text-3xl font-bold">Операции</h1>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
              {operations.length} шт.
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-xs text-emerald-200/80">Доходы</p>
            <p className="mt-2 text-lg font-bold text-emerald-300">
              {formatMoney(incomeTotal)}
            </p>
          </div>

          <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4">
            <p className="text-xs text-rose-200/80">Расходы</p>
            <p className="mt-2 text-lg font-bold text-rose-300">
              {formatMoney(expenseTotal)}
            </p>
          </div>

          <div className="rounded-3xl border border-blue-400/20 bg-blue-400/10 p-4">
            <p className="text-xs text-blue-200/80">Переводы</p>
            <p className="mt-2 text-lg font-bold text-blue-300">
              {formatMoney(transferTotal)}
            </p>
          </div>
        </section>

        <form
          onSubmit={saveOperation}
          className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30"
        >
          <h2 className="text-xl font-semibold">Новая операция</h2>

          <div className="grid grid-cols-3 gap-1 rounded-3xl bg-black/20 p-1">
            {operationTypes.map((item) => (
              <button
                key={item.value}
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setOperationType(item.value);
                  setCategory("");
                }}
                className={`rounded-2xl px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  operationType === item.value
                    ? item.value === "expense"
                      ? "bg-rose-400/15 text-rose-300"
                      : item.value === "income"
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-blue-400/15 text-blue-300"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Название операции"
            disabled={isSaving}
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Сумма"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            disabled={isSaving}
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {operationType !== "transfer" && (
            <>
              <select
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                disabled={isSaving}
                className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {accounts.length === 0 && <option value="">Нет счетов</option>}

                {accounts.map((item) => (
                  <option key={item.id} value={item.name}>
                    Со счета: {item.name}
                  </option>
                ))}
              </select>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                disabled={isSaving}
                className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Выбери категорию</option>

                {getCurrentCategoryOptions().map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {operationType === "transfer" && (
            <section className="space-y-5 rounded-3xl border border-blue-400/20 bg-blue-400/10 p-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-300">
                  Откуда переводить
                </h3>

                <div className="grid grid-cols-2 gap-1 rounded-3xl bg-black/20 p-1">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setFromTargetType("account")}
                    className={`rounded-2xl px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      fromTargetType === "account"
                        ? "bg-white text-neutral-950"
                        : "text-slate-500 hover:text-white"
                    }`}
                  >
                    Со счета
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setFromTargetType("goal")}
                    className={`rounded-2xl px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      fromTargetType === "goal"
                        ? "bg-white text-neutral-950"
                        : "text-slate-500 hover:text-white"
                    }`}
                  >
                    С цели
                  </button>
                </div>

                {fromTargetType === "account" ? (
                  <select
                    value={fromAccount}
                    onChange={(event) => setFromAccount(event.target.value)}
                    disabled={isSaving}
                    className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {accounts.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={fromGoal}
                    onChange={(event) => setFromGoal(event.target.value)}
                    disabled={isSaving}
                    className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {goals.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-300">
                  Куда переводить
                </h3>

                <div className="grid grid-cols-2 gap-1 rounded-3xl bg-black/20 p-1">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setToTargetType("account")}
                    className={`rounded-2xl px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      toTargetType === "account"
                        ? "bg-white text-neutral-950"
                        : "text-slate-500 hover:text-white"
                    }`}
                  >
                    На счет
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setToTargetType("goal")}
                    className={`rounded-2xl px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      toTargetType === "goal"
                        ? "bg-white text-neutral-950"
                        : "text-slate-500 hover:text-white"
                    }`}
                  >
                    На цель
                  </button>
                </div>

                {toTargetType === "account" ? (
                  <select
                    value={toAccount}
                    onChange={(event) => setToAccount(event.target.value)}
                    disabled={isSaving}
                    className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {accounts.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={toGoal}
                    onChange={(event) => setToGoal(event.target.value)}
                    disabled={isSaving}
                    className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {goals.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </section>
          )}

          <input
            value={date}
            onChange={(event) => setDate(event.target.value)}
            type="date"
            disabled={isSaving}
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Заметка"
            rows={3}
            disabled={isSaving}
            className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={isSaving}
            className="app-primary-button w-full rounded-3xl p-4 font-bold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Сохраняю..." : "Сохранить операцию"}
          </button>
        </form>

        <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-xl font-semibold">Поиск и фильтры</h2>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по сумме, заметке, счету, цели или категории"
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
          />

          <div className="grid grid-cols-4 gap-1 rounded-3xl bg-black/20 p-1">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                  filter === item.value ? "app-filter-active" : "app-filter-idle"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Список операций</h2>
            <p className="text-sm text-slate-500">
              {filteredOperations.length} найдено
            </p>
          </div>

          {filteredOperations.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-400">
              Операции не найдены
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filteredOperations.map((operation) => (
              <article
                key={operation.id}
                className={`rounded-3xl border p-4 ${getOperationCardClass(
                  operation.type
                )}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">
                      {operation.title}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {getOperationTypeLabel(operation.type)} ·{" "}
                      {getOperationSource(operation)}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatDateLabel(formatDateForInput(operation.date))}
                    </p>

                    {operation.category && (
                      <p className="mt-2 inline-flex rounded-full bg-white/[0.08] px-3 py-1 text-xs text-slate-300">
                        {operation.category}
                      </p>
                    )}

                    {operation.note && (
                      <p className="mt-3 rounded-2xl bg-black/20 p-3 text-sm text-slate-400">
                        {operation.note}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p
                      className={`whitespace-nowrap text-lg font-bold ${getOperationAmountClass(
                        operation.type
                      )}`}
                    >
                      {formatMoney(operation.amount)}
                    </p>

                    <button
                      type="button"
                      onClick={() => deleteOperation(operation.id)}
                      className="mt-3 rounded-xl bg-rose-400/10 px-3 py-2 text-sm text-rose-300 transition hover:bg-rose-400/15"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}