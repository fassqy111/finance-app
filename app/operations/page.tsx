"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney, getTodayDate } from "@/lib/format";
import type { Operation, OperationType } from "@/types/finance";

function getOperationSign(type: OperationType) {
  if (type === "expense") return "−";
  if (type === "income") return "+";
  return "";
}

function getOperationColor(type: OperationType) {
  if (type === "expense") return "text-rose-300";
  if (type === "income") return "text-emerald-300";
  return "text-blue-300";
}

function getOperationBg(type: OperationType) {
  if (type === "expense") return "bg-rose-400/15";
  if (type === "income") return "bg-emerald-400/15";
  return "bg-blue-400/15";
}

function getOperationIcon(type: OperationType) {
  if (type === "expense") return "↓";
  if (type === "income") return "↑";
  return "↔";
}

function getOperationLabel(type: OperationType) {
  if (type === "expense") return "Расход";
  if (type === "income") return "Доход";
  return "Перевод";
}

export default function OperationsPage() {
  const {
    accounts,
    categories,
    operations,
    addOperation,
    updateOperation,
    deleteOperation,
  } = useFinance();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | OperationType>("all");
  const [editingOperationId, setEditingOperationId] = useState<string | null>(
    null
  );

  const [type, setType] = useState<OperationType>("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState(accounts[0]?.name ?? "");
  const [toAccount, setToAccount] = useState(accounts[1]?.name ?? "");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getTodayDate());

  const availableCategories = categories.filter(
    (categoryItem) => categoryItem.type === type
  );

  const incomeTotal = operations
    .filter((operation) => operation.type === "income")
    .reduce((sum, operation) => sum + operation.amount, 0);

  const expenseTotal = operations
    .filter((operation) => operation.type === "expense")
    .reduce((sum, operation) => sum + operation.amount, 0);

  const transferTotal = operations
    .filter((operation) => operation.type === "transfer")
    .reduce((sum, operation) => sum + operation.amount, 0);

  const filteredOperations = operations.filter((operation) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      operation.title.toLowerCase().includes(searchText) ||
      operation.account.toLowerCase().includes(searchText) ||
      operation.category.toLowerCase().includes(searchText) ||
      operation.note?.toLowerCase().includes(searchText) ||
      String(operation.amount).includes(searchText);

    const matchesType =
      filterType === "all" ? true : operation.type === filterType;

    return matchesSearch && matchesType;
  });

  function resetForm() {
    setEditingOperationId(null);
    setType("expense");
    setTitle("");
    setAmount("");
    setAccount(accounts[0]?.name ?? "");
    setToAccount(accounts[1]?.name ?? "");
    setCategory("");
    setNote("");
    setDate(getTodayDate());
  }

  function changeType(nextType: OperationType) {
    setType(nextType);
    setCategory("");
  }

  async function saveOperation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (
      !title.trim() ||
      !account ||
      numericAmount <= 0 ||
      (type === "transfer" && !toAccount) ||
      (type !== "transfer" && !category.trim())
    ) {
      alert("Заполни название, сумму, счет и категорию");
      return;
    }

    const operationData = {
      type,
      title: title.trim(),
      amount: numericAmount,
      account,
      toAccount: type === "transfer" ? toAccount : undefined,
      category: type === "transfer" ? "Перевод" : category.trim(),
      note: note.trim(),
      date,
    };

    if (editingOperationId) {
      await updateOperation({
        id: editingOperationId,
        ...operationData,
      });
    } else {
      await addOperation(operationData);
    }

    resetForm();
  }

  function startEditOperation(operation: Operation) {
    setEditingOperationId(operation.id);
    setType(operation.type);
    setTitle(operation.title);
    setAmount(String(operation.amount));
    setAccount(operation.account);
    setToAccount(operation.toAccount ?? accounts[1]?.name ?? "");
    setCategory(operation.type === "transfer" ? "" : operation.category);
    setNote(operation.note ?? "");
    setDate(operation.date);

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
              <p className="text-sm text-slate-400">Мои финансы</p>
              <h1 className="mt-1 text-3xl font-bold">Операции</h1>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
              {operations.length} шт.
            </div>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-3">
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
          className="space-y-4 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-5 shadow-2xl shadow-black/30"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              {editingOperationId ? "Редактировать" : "Новая операция"}
            </h2>

            {editingOperationId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl bg-white/[0.06] px-3 py-2 text-sm text-slate-300"
              >
                Отмена
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-3xl bg-black/25 p-1">
            {(["expense", "income", "transfer"] as OperationType[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeType(item)}
                  className={`rounded-2xl px-3 py-3 text-sm font-medium transition ${
                    type === item
                      ? `${getOperationBg(item)} ${getOperationColor(item)}`
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  {getOperationLabel(item)}
                </button>
              )
            )}
          </div>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Название операции"
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
          />

          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Сумма"
            type="number"
            min="0"
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
          />

          <select
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-emerald-400/60"
          >
            {accounts.map((accountItem) => (
              <option key={accountItem.id} value={accountItem.name}>
                {type === "income" ? "На счет: " : "Со счета: "}
                {accountItem.name}
              </option>
            ))}
          </select>

          {type === "transfer" && (
            <select
              value={toAccount}
              onChange={(event) => setToAccount(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-emerald-400/60"
            >
              {accounts.map((accountItem) => (
                <option key={accountItem.id} value={accountItem.name}>
                  На счет: {accountItem.name}
                </option>
              ))}
            </select>
          )}

          {type !== "transfer" && (
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-emerald-400/60"
            >
              <option value="">Выбери категорию</option>

              {availableCategories.map((categoryItem) => (
                <option key={categoryItem.id} value={categoryItem.name}>
                  {categoryItem.name}
                </option>
              ))}
            </select>
          )}

          <input
            value={date}
            onChange={(event) => setDate(event.target.value)}
            type="date"
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-emerald-400/60"
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
            {editingOperationId ? "Сохранить изменения" : "Сохранить операцию"}
          </button>
        </form>

        <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-xl font-semibold">Поиск и фильтры</h2>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по сумме, заметке, счету или категории"
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
          />

          <div className="grid grid-cols-4 gap-2 rounded-3xl bg-black/25 p-1">
            {[
              { value: "all", label: "Все" },
              { value: "expense", label: "Расходы" },
              { value: "income", label: "Доходы" },
              { value: "transfer", label: "Переводы" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  setFilterType(item.value as "all" | OperationType)
                }
                className={`rounded-2xl px-2 py-3 text-xs font-medium transition ${
                  filterType === item.value
                    ? "bg-white text-neutral-950"
                    : "text-slate-500 hover:text-white"
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

          {filteredOperations.map((operation) => (
            <div
              key={operation.id}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${getOperationBg(
                      operation.type
                    )} ${getOperationColor(operation.type)}`}
                  >
                    {getOperationIcon(operation.type)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold">{operation.title}</p>

                    <p className="truncate text-sm text-slate-400">
                      {operation.account}
                      {operation.toAccount ? ` → ${operation.toAccount}` : ""} ·{" "}
                      {operation.category}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {operation.date}
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

              {operation.note && (
                <p className="mt-4 rounded-2xl bg-black/20 p-3 text-sm text-slate-400">
                  {operation.note}
                </p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => startEditOperation(operation)}
                  className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.1]"
                >
                  Редактировать
                </button>

                <button
                  type="button"
                  onClick={() => deleteOperation(operation.id)}
                  className="rounded-xl bg-rose-400/10 px-4 py-2 text-sm text-rose-300 hover:bg-rose-400/15"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}