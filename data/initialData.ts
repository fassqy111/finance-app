import type { FinanceState } from "@/types/finance";

export const initialFinanceState: FinanceState = {
  accounts: [
    {
      id: "1",
      name: "Тинькофф",
      balance: 120000,
      currency: "₽",
    },
    {
      id: "2",
      name: "Сбер",
      balance: 45000,
      currency: "₽",
    },
    {
      id: "3",
      name: "Наличные",
      balance: 15000,
      currency: "₽",
    },
  ],

  goals: [
    {
      id: "1",
      name: "Отпуск",
      currentAmount: 50000,
      targetAmount: 200000,
      currency: "₽",
    },
  ],

  operations: [
    {
      id: "1",
      type: "expense",
      title: "Продукты",
      amount: 1200,
      account: "Тинькофф",
      category: "Еда",
      note: "Покупка продуктов",
      date: "2026-05-25",
    },
    {
      id: "2",
      type: "income",
      title: "Зарплата",
      amount: 95000,
      account: "Сбер",
      category: "Зарплата",
      note: "Основная зарплата",
      date: "2026-05-25",
    },
    {
      id: "3",
      type: "expense",
      title: "Такси",
      amount: 850,
      account: "Тинькофф",
      category: "Транспорт",
      note: "Поездка вечером",
      date: "2026-05-25",
    },
  ],

  budgets: [
    {
      id: "1",
      category: "Еда",
      limit: 40000,
      spent: 30000,
      currency: "₽",
    },
    {
      id: "2",
      category: "Транспорт",
      limit: 10000,
      spent: 4500,
      currency: "₽",
    },
  ],

  categories: [
    {
      id: "1",
      name: "Еда",
      type: "expense",
    },
    {
      id: "2",
      name: "Транспорт",
      type: "expense",
    },
    {
      id: "3",
      name: "Развлечения",
      type: "expense",
    },
    {
      id: "4",
      name: "Зарплата",
      type: "income",
    },
    {
      id: "5",
      name: "Подарки",
      type: "income",
    },
  ],

  recurringTemplates: [
    {
      id: "1",
      type: "income",
      title: "Зарплата",
      amount: 95000,
      fromAccount: "Сбер",
      category: "Зарплата",
      frequency: "monthly",
      dayOfMonth: 5,
    },
    {
      id: "2",
      type: "expense",
      title: "Подписка",
      amount: 499,
      fromAccount: "Тинькофф",
      category: "Развлечения",
      frequency: "monthly",
      dayOfMonth: 15,
    },
    {
      id: "3",
      type: "transfer",
      title: "Накопления",
      amount: 10000,
      fromAccount: "Тинькофф",
      toAccount: "Сбер",
      category: "Перевод",
      frequency: "monthly",
      dayOfMonth: 10,
    },
  ],

  trashItems: [],
};