"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatMoney } from "@/lib/format";
import type { Account } from "@/types/finance";

export default function AccountsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useFinance();

  const [accountName, setAccountName] = useState("");
  const [accountBalance, setAccountBalance] = useState("");
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const accountsTotal = accounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );

  const biggestAccount = accounts.reduce<Account | null>((max, account) => {
    if (!max) return account;
    return account.balance > max.balance ? account : max;
  }, null);

  function resetForm() {
    setAccountName("");
    setAccountBalance("");
    setEditingAccountId(null);
  }

  async function saveAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericBalance = Number(accountBalance);

    if (!accountName.trim() || Number.isNaN(numericBalance)) {
      alert("Заполни название счета и баланс");
      return;
    }

    if (editingAccountId) {
      await updateAccount({
        id: editingAccountId,
        name: accountName.trim(),
        balance: numericBalance,
        currency: "₽",
      });
    } else {
      await addAccount({
        name: accountName.trim(),
        balance: numericBalance,
        currency: "₽",
      });
    }

    resetForm();
  }

  function startEditAccount(account: Account) {
    setEditingAccountId(account.id);
    setAccountName(account.name);
    setAccountBalance(String(account.balance));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="min-h-screen bg-[#080A12] text-white p-4 pb-24">
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

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-400/20 via-blue-400/10 to-white/[0.04] p-5 shadow-2xl shadow-black/30">
            <p className="text-sm text-slate-300">Всего на счетах</p>

            <p className="mt-2 text-4xl font-bold tracking-tight">
              {formatMoney(accountsTotal)}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-black/20 p-4">
                <p className="text-sm text-slate-400">Количество</p>
                <p className="mt-1 text-xl font-semibold">{accounts.length}</p>
              </div>

              <div className="rounded-3xl bg-black/20 p-4">
                <p className="text-sm text-slate-400">Крупнейший</p>
                <p className="mt-1 truncate text-xl font-semibold">
                  {biggestAccount ? biggestAccount.name : "Нет"}
                </p>
              </div>
            </div>
          </section>

          <form
            onSubmit={saveAccount}
            className="space-y-4 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-5 shadow-2xl shadow-black/30"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">
                {editingAccountId ? "Редактировать счет" : "Добавить счет"}
              </h2>

              {editingAccountId && (
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
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="Название счета, например Тинькофф"
              className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
            />

            <input
              value={accountBalance}
              onChange={(event) => setAccountBalance(event.target.value)}
              placeholder="Баланс"
              type="number"
              className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
            />

            <button
              type="submit"
              className="w-full rounded-3xl bg-white p-4 font-bold text-neutral-950 transition hover:bg-slate-200"
            >
              {editingAccountId ? "Сохранить изменения" : "Добавить счет"}
            </button>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Список счетов</h2>

            <p className="text-sm text-slate-500">
              {formatMoney(accountsTotal)}
            </p>
          </div>

          {accounts.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-400">
              Счетов пока нет
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {accounts.map((account) => {
              const percent = accountsTotal
                ? Math.round((account.balance / accountsTotal) * 100)
                : 0;

              return (
                <div
                  key={account.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{account.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {percent}% от суммы на счетах
                      </p>
                    </div>

                    <p className="shrink-0 text-lg font-bold">
                      {formatMoney(account.balance)}
                    </p>
                  </div>

                  <div className="mt-4 h-3 rounded-full bg-white/[0.06]">
                    <div
                      className="h-3 rounded-full bg-emerald-400"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEditAccount(account)}
                      className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.1]"
                    >
                      Редактировать
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteAccount(account.id)}
                      className="rounded-xl bg-rose-400/10 px-4 py-2 text-sm text-rose-300 hover:bg-rose-400/15"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}