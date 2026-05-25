"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney } from "@/lib/format";
import type {
  OperationType,
  RecurringFrequency,
  RecurringTemplate,
} from "@/types/finance";

function getFrequencyLabel(template: RecurringTemplate) {
  if (template.frequency === "daily") {
    return "Каждый день";
  }

  if (template.frequency === "weekly") {
    const days: Record<number, string> = {
      0: "Воскресенье",
      1: "Понедельник",
      2: "Вторник",
      3: "Среда",
      4: "Четверг",
      5: "Пятница",
      6: "Суббота",
    };

    return `Каждую неделю · ${days[template.dayOfWeek ?? 1]}`;
  }

  return `Каждый месяц · ${template.dayOfMonth ?? 1} число`;
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
  if (type === "expense") return "bg-rose-400/15";
  if (type === "income") return "bg-emerald-400/15";
  return "bg-blue-400/15";
}

function getOperationBorder(type: OperationType) {
  if (type === "expense") return "border-rose-400/20";
  if (type === "income") return "border-emerald-400/20";
  return "border-blue-400/20";
}

function getOperationIcon(type: OperationType) {
  if (type === "expense") return "↓";
  if (type === "income") return "↑";
  return "↔";
}

function getFrequencyShortLabel(frequency: RecurringFrequency) {
  if (frequency === "daily") return "День";
  if (frequency === "weekly") return "Неделя";
  return "Месяц";
}

export default function TemplatesPage() {
  const {
    accounts,
    categories,
    recurringTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  } = useFinance();

  const [type, setType] = useState<OperationType>("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [fromAccount, setFromAccount] = useState(accounts[0]?.name ?? "");
  const [toAccount, setToAccount] = useState(accounts[1]?.name ?? "");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [note, setNote] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );

  const availableCategories = categories.filter(
    (categoryItem) => categoryItem.type === type
  );

  const incomeTemplates = recurringTemplates.filter(
    (template) => template.type === "income"
  );

  const expenseTemplates = recurringTemplates.filter(
    (template) => template.type === "expense"
  );

  const transferTemplates = recurringTemplates.filter(
    (template) => template.type === "transfer"
  );

  const templatesTotal = recurringTemplates.reduce(
    (sum, template) => sum + template.amount,
    0
  );

  const monthlyTemplates = recurringTemplates.filter(
    (template) => template.frequency === "monthly"
  ).length;

  function resetForm() {
    setType("expense");
    setTitle("");
    setAmount("");
    setFromAccount(accounts[0]?.name ?? "");
    setToAccount(accounts[1]?.name ?? "");
    setCategory("");
    setFrequency("monthly");
    setDayOfWeek("1");
    setDayOfMonth("1");
    setNote("");
    setEditingTemplateId(null);
  }

  function changeType(nextType: OperationType) {
    setType(nextType);
    setCategory("");
  }

  async function saveTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (
      !title.trim() ||
      !fromAccount ||
      numericAmount <= 0 ||
      (type !== "transfer" && !category.trim()) ||
      (type === "transfer" && !toAccount)
    ) {
      alert("Заполни название, сумму, счет и категорию");
      return;
    }

    const templateData = {
      type,
      title: title.trim(),
      amount: numericAmount,
      fromAccount,
      toAccount: type === "transfer" ? toAccount : undefined,
      category: type === "transfer" ? "Перевод" : category.trim(),
      note: note.trim(),
      frequency,
      dayOfWeek: frequency === "weekly" ? Number(dayOfWeek) : undefined,
      dayOfMonth: frequency === "monthly" ? Number(dayOfMonth) : undefined,
    };

    if (editingTemplateId) {
      await updateTemplate({
        id: editingTemplateId,
        ...templateData,
      });
    } else {
      await addTemplate(templateData);
    }

    resetForm();
  }

  function startEditTemplate(template: RecurringTemplate) {
    setEditingTemplateId(template.id);
    setType(template.type);
    setTitle(template.title);
    setAmount(String(template.amount));
    setFromAccount(template.fromAccount);
    setToAccount(template.toAccount ?? accounts[1]?.name ?? "");
    setCategory(template.type === "transfer" ? "" : template.category ?? "");
    setFrequency(template.frequency);
    setDayOfWeek(String(template.dayOfWeek ?? 1));
    setDayOfMonth(String(template.dayOfMonth ?? 1));
    setNote(template.note ?? "");

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
              <h1 className="mt-1 text-3xl font-bold">Шаблоны</h1>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
              {recurringTemplates.length} шт.
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-400/20 via-cyan-400/10 to-white/[0.04] p-5 shadow-2xl shadow-black/30">
          <p className="text-sm text-slate-300">Регулярные операции</p>

          <p className="mt-2 text-4xl font-bold tracking-tight">
            {formatMoney(templatesTotal)}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Расходы</p>
              <p className="mt-1 text-xl font-semibold text-rose-300">
                {expenseTemplates.length}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Доходы</p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">
                {incomeTemplates.length}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Переводы</p>
              <p className="mt-1 text-xl font-semibold text-blue-300">
                {transferTemplates.length}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-3xl bg-black/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-slate-400">Ежемесячных шаблонов</p>
              <p className="font-semibold text-cyan-300">{monthlyTemplates}</p>
            </div>
          </div>
        </section>

        <form
          onSubmit={saveTemplate}
          className="space-y-4 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-5 shadow-2xl shadow-black/30"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              {editingTemplateId ? "Редактировать шаблон" : "Добавить шаблон"}
            </h2>

            {editingTemplateId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl bg-white/[0.06] px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.1]"
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
                  {getOperationTypeLabel(item)}
                </button>
              )
            )}
          </div>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Название шаблона"
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-400/60"
          />

          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            type="number"
            min="0"
            placeholder="Сумма"
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-400/60"
          />

          <select
            value={fromAccount}
            onChange={(event) => setFromAccount(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-blue-400/60"
          >
            {accounts.length === 0 && <option value="">Нет счетов</option>}

            {accounts.map((account) => (
              <option key={account.id} value={account.name}>
                {type === "income" ? "На счет: " : "Со счета: "}
                {account.name}
              </option>
            ))}
          </select>

          {type === "transfer" && (
            <select
              value={toAccount}
              onChange={(event) => setToAccount(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-blue-400/60"
            >
              {accounts.length === 0 && <option value="">Нет счетов</option>}

              {accounts.map((account) => (
                <option key={account.id} value={account.name}>
                  На счет: {account.name}
                </option>
              ))}
            </select>
          )}

          {type !== "transfer" && (
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-blue-400/60"
            >
              <option value="">Выбери категорию</option>

              {availableCategories.map((categoryItem) => (
                <option key={categoryItem.id} value={categoryItem.name}>
                  {categoryItem.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={frequency}
            onChange={(event) =>
              setFrequency(event.target.value as RecurringFrequency)
            }
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-blue-400/60"
          >
            <option value="daily">Каждый день</option>
            <option value="weekly">Каждую неделю</option>
            <option value="monthly">Каждый месяц</option>
          </select>

          {frequency === "weekly" && (
            <select
              value={dayOfWeek}
              onChange={(event) => setDayOfWeek(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-blue-400/60"
            >
              <option value="1">Понедельник</option>
              <option value="2">Вторник</option>
              <option value="3">Среда</option>
              <option value="4">Четверг</option>
              <option value="5">Пятница</option>
              <option value="6">Суббота</option>
              <option value="0">Воскресенье</option>
            </select>
          )}

          {frequency === "monthly" && (
            <input
              value={dayOfMonth}
              onChange={(event) => setDayOfMonth(event.target.value)}
              type="number"
              min="1"
              max="31"
              placeholder="День месяца"
              className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-400/60"
            />
          )}

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Заметка"
            rows={3}
            className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-400/60"
          />

          <button
            type="submit"
            className="w-full rounded-3xl bg-white p-4 font-bold text-neutral-950 transition hover:bg-slate-200"
          >
            {editingTemplateId ? "Сохранить изменения" : "Добавить шаблон"}
          </button>
        </form>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Список шаблонов</h2>

            <p className="text-sm text-slate-500">
              {recurringTemplates.length} шт.
            </p>
          </div>

          {recurringTemplates.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-400">
              Шаблонов пока нет
            </div>
          )}

          {recurringTemplates.map((template) => (
            <div
              key={template.id}
              className={`rounded-3xl border bg-white/[0.04] p-4 ${getOperationBorder(
                template.type
              )}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${getOperationBg(
                      template.type
                    )} ${getOperationColor(template.type)}`}
                  >
                    {getOperationIcon(template.type)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold">{template.title}</p>

                    <p className="mt-1 text-sm text-slate-400">
                      {getOperationTypeLabel(template.type)} ·{" "}
                      {getFrequencyLabel(template)}
                    </p>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {template.fromAccount}
                      {template.toAccount ? ` → ${template.toAccount}` : ""}
                      {template.category ? ` · ${template.category}` : ""}
                    </p>
                  </div>
                </div>

                <p
                  className={`shrink-0 text-lg font-bold ${getOperationColor(
                    template.type
                  )}`}
                >
                  {formatMoney(template.amount)}
                </p>
              </div>

              {template.note && (
                <p className="mt-4 rounded-2xl bg-black/20 p-3 text-sm text-slate-400">
                  {template.note}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="rounded-2xl bg-white/[0.04] px-3 py-2 text-xs text-slate-400">
                  {getFrequencyShortLabel(template.frequency)}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEditTemplate(template)}
                    className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.1]"
                  >
                    Редактировать
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTemplate(template.id)}
                    className="rounded-xl bg-rose-400/10 px-4 py-2 text-sm text-rose-300 hover:bg-rose-400/15"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}