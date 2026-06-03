"use client";

import { useMemo, useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney } from "@/lib/format";
import type { Account } from "@/types/finance";

function getLargestAccountName(accounts: Account[]) {
  if (accounts.length === 0) return "Нет счетов";

  const sortedAccounts = [...accounts].sort(
    (a, b) => Math.abs(b.balance) - Math.abs(a.balance)
  );

  return sortedAccounts[0]?.name ?? "Нет счетов";
}

function getAccountProgress(balance: number, maxAccountAbsBalance: number) {
  if (!maxAccountAbsBalance || maxAccountAbsBalance <= 0) return 0;

  return Math.min(
    100,
    Math.max(0, Math.round((Math.abs(balance) / maxAccountAbsBalance) * 100))
  );
}

function getAccountDisplayPercent(balance: number, totalBalance: number) {
  if (!totalBalance) return 0;

  return Math.round((balance / totalBalance) * 100);
}

export default function ProfileAccountsPage() {
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    recalculateBalancesFromOperations,
  } = useFinance();

  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts]
  );

  const maxAccountAbsBalance = useMemo(
    () =>
      Math.max(
        ...accounts.map((account) => Math.abs(account.balance)),
        1
      ),
    [accounts]
  );

  const largestAccountName = getLargestAccountName(accounts);

  function resetForm() {
    setName("");
    setBalance("");
    setEditingAccount(null);
  }

  function startEdit(account: Account) {
    setEditingAccount(account);
    setName(account.name);
    setBalance(String(account.balance));
  }

  async function saveAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) return;

    const normalizedName = name.trim();
    const numericBalance = Number(String(balance).replace(",", "."));

    if (!normalizedName) {
      alert("Укажи название счета");
      return;
    }

    if (Number.isNaN(numericBalance)) {
      alert("Укажи корректный баланс");
      return;
    }

    setIsSaving(true);

    try {
      if (editingAccount) {
        await updateAccount({
          ...editingAccount,
          name: normalizedName,
          balance: numericBalance,
          currency: "₽",
        });
      } else {
        await addAccount({
          name: normalizedName,
          balance: numericBalance,
          currency: "₽",
        });
      }

      resetForm();
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteOnlyAccount(account: Account) {
    setIsSaving(true);

    try {
      await deleteAccount(account.id, "keep_operations");
      setDeletingAccount(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteAccountWithOperations(account: Account) {
    setIsSaving(true);

    try {
      await deleteAccount(account.id, "delete_operations");
      setDeletingAccount(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function recalculateBalances() {
    if (isSaving) return;

    setIsSaving(true);

    try {
      await recalculateBalancesFromOperations();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080A12] p-4 pb-24 text-white">
      <section className="mx-auto w-full max-w-md space-y-6 sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <header className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Профиль</p>
              <h1 className="mt-1 text-3xl font-bold">Счета</h1>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
              {accounts.length} шт.
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-400/20 via-blue-400/10 to-white/[0.04] p-5 shadow-2xl shadow-black/30">
          <p className="text-sm text-slate-300">Всего на счетах</p>

          <p
            className={`mt-2 text-4xl font-bold tracking-tight ${
              totalBalance < 0 ? "text-rose-300" : ""
            }`}
          >
            {formatMoney(totalBalance)}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Количество</p>
              <p className="mt-1 text-xl font-semibold">{accounts.length}</p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Крупнейший</p>
              <p className="mt-1 text-xl font-semibold">
                {largestAccountName}
              </p>
            </div>
          </div>
        </section>

        <form
          onSubmit={saveAccount}
          className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              {editingAccount ? "Редактировать счет" : "Добавить счет"}
            </h2>

            {editingAccount && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300 transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Отмена
              </button>
            )}
          </div>

          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Название счета, например Тинькофф"
            disabled={isSaving}
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <input
            value={balance}
            onChange={(event) => setBalance(event.target.value)}
            placeholder="Баланс"
            type="number"
            inputMode="decimal"
            step="0.01"
            disabled={isSaving}
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={isSaving}
            className="app-primary-button w-full rounded-3xl p-4 font-bold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving
              ? "Сохраняю..."
              : editingAccount
                ? "Сохранить изменения"
                : "Добавить счет"}
          </button>
        </form>

        <button
          type="button"
          onClick={recalculateBalances}
          disabled={isSaving}
          className="w-full rounded-3xl border border-blue-400/20 bg-blue-400/10 p-4 font-bold text-blue-300 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Пересчитываю..." : "Пересчитать балансы по операциям"}
        </button>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Список счетов</h2>

            <p
              className={`text-sm ${
                totalBalance < 0 ? "text-rose-300" : "text-slate-500"
              }`}
            >
              {formatMoney(totalBalance)}
            </p>
          </div>

          {accounts.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-400">
              Счетов пока нет
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {accounts.map((account) => {
              const progress = getAccountProgress(
                account.balance,
                maxAccountAbsBalance
              );

              const displayPercent = getAccountDisplayPercent(
                account.balance,
                totalBalance
              );

              return (
                <article
                  key={account.id}
                  className={`rounded-3xl border p-4 ${
                    account.balance < 0
                      ? "border-rose-400/20 bg-rose-400/10"
                      : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold">
                        {account.name}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {displayPercent}% от суммы на счетах
                      </p>
                    </div>

                    <p
                      className={`whitespace-nowrap text-lg font-bold ${
                        account.balance < 0
                          ? "text-rose-300"
                          : "text-emerald-300"
                      }`}
                    >
                      {formatMoney(account.balance)}
                    </p>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className={`h-full rounded-full ${
                        account.balance < 0 ? "bg-rose-400" : "bg-emerald-400"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(account)}
                      disabled={isSaving}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-300 transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Редактировать
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingAccount(account)}
                      disabled={isSaving}
                      className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Удалить
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {deletingAccount && (
          <section className="fixed inset-0 z-50 flex items-end bg-black/50 p-4 sm:items-center sm:justify-center">
            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#080A12] p-5 text-white shadow-2xl">
              <h2 className="text-xl font-semibold">Удалить счет?</h2>

              <p className="mt-2 text-sm text-slate-400">
                Счет “{deletingAccount.name}” можно удалить отдельно, оставив
                операции в истории, или удалить вместе со связанными операциями.
              </p>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => deleteOnlyAccount(deletingAccount)}
                  className="app-primary-button w-full rounded-3xl p-4 font-bold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Удалить только счет
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => deleteAccountWithOperations(deletingAccount)}
                  className="w-full rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4 font-bold text-rose-300 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Удалить счет и операции
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setDeletingAccount(null)}
                  className="w-full rounded-3xl border border-white/10 bg-black/20 p-4 font-bold text-slate-300 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Отмена
                </button>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}