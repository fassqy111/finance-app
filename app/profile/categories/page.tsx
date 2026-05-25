"use client";

import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import type { Category, CategoryType } from "@/types/finance";

function getCategoryTypeLabel(type: CategoryType) {
  if (type === "expense") return "Расход";
  return "Доход";
}

function getCategoryStyle(type: CategoryType) {
  if (type === "expense") {
    return {
      card: "border-rose-400/20 bg-rose-400/10",
      badge: "bg-rose-400/15 text-rose-300",
      icon: "↓",
    };
  }

  return {
    card: "border-emerald-400/20 bg-emerald-400/10",
    badge: "bg-emerald-400/15 text-emerald-300",
    icon: "↑",
  };
}

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } =
    useFinance();

  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<CategoryType>("expense");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );

  const expenseCategories = categories.filter(
    (category) => category.type === "expense"
  );

  const incomeCategories = categories.filter(
    (category) => category.type === "income"
  );

  function resetForm() {
    setCategoryName("");
    setCategoryType("expense");
    setEditingCategoryId(null);
  }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!categoryName.trim()) {
      alert("Заполни название категории");
      return;
    }

    if (editingCategoryId) {
      await updateCategory({
        id: editingCategoryId,
        name: categoryName.trim(),
        type: categoryType,
      });
    } else {
      await addCategory({
        name: categoryName.trim(),
        type: categoryType,
      });
    }

    resetForm();
  }

  function startEditCategory(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryType(category.type);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function renderCategoryCard(category: Category) {
    const style = getCategoryStyle(category.type);

    return (
      <div
        key={category.id}
        className={`rounded-3xl border p-4 ${style.card}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${style.badge}`}
            >
              {style.icon}
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold">{category.name}</p>
              <p className="mt-1 text-sm text-slate-400">
                {getCategoryTypeLabel(category.type)}
              </p>
            </div>
          </div>

          <div className={`rounded-2xl px-3 py-2 text-sm font-semibold ${style.badge}`}>
            {getCategoryTypeLabel(category.type)}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => startEditCategory(category)}
            className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.1]"
          >
            Редактировать
          </button>

          <button
            type="button"
            onClick={() => deleteCategory(category.id)}
            className="rounded-xl bg-rose-400/10 px-4 py-2 text-sm text-rose-300 hover:bg-rose-400/15"
          >
            Удалить
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#080A12] text-white p-4 pb-24">
      <section className="mx-auto max-w-md space-y-6">
        <header className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Профиль</p>
              <h1 className="mt-1 text-3xl font-bold">Категории</h1>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
              {categories.length} шт.
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-pink-400/20 via-purple-400/10 to-white/[0.04] p-5 shadow-2xl shadow-black/30">
          <p className="text-sm text-slate-300">Категории операций</p>

          <p className="mt-2 text-4xl font-bold tracking-tight">
            {categories.length}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Расходы</p>
              <p className="mt-1 text-xl font-semibold text-rose-300">
                {expenseCategories.length}
              </p>
            </div>

            <div className="rounded-3xl bg-black/20 p-4">
              <p className="text-sm text-slate-400">Доходы</p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">
                {incomeCategories.length}
              </p>
            </div>
          </div>
        </section>

        <form
          onSubmit={saveCategory}
          className="space-y-4 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-5 shadow-2xl shadow-black/30"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              {editingCategoryId ? "Редактировать категорию" : "Добавить категорию"}
            </h2>

            {editingCategoryId && (
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
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="Название категории"
            className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-slate-500 focus:border-pink-400/60"
          />

          <div className="grid grid-cols-2 gap-2 rounded-3xl bg-black/25 p-1">
            <button
              type="button"
              onClick={() => setCategoryType("expense")}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                categoryType === "expense"
                  ? "bg-rose-400/15 text-rose-300"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              Расход
            </button>

            <button
              type="button"
              onClick={() => setCategoryType("income")}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                categoryType === "income"
                  ? "bg-emerald-400/15 text-emerald-300"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              Доход
            </button>
          </div>

          <button
            type="submit"
            className="w-full rounded-3xl bg-white p-4 font-bold text-neutral-950 transition hover:bg-slate-200"
          >
            {editingCategoryId ? "Сохранить изменения" : "Добавить категорию"}
          </button>
        </form>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Расходы</h2>

            <p className="text-sm text-slate-500">
              {expenseCategories.length} шт.
            </p>
          </div>

          {expenseCategories.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-400">
              Категорий расходов пока нет
            </div>
          )}

          {expenseCategories.map(renderCategoryCard)}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Доходы</h2>

            <p className="text-sm text-slate-500">
              {incomeCategories.length} шт.
            </p>
          </div>

          {incomeCategories.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-400">
              Категорий доходов пока нет
            </div>
          )}

          {incomeCategories.map(renderCategoryCard)}
        </section>
      </section>
    </main>
  );
}