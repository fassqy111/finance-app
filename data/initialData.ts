import type { FinanceState } from "@/types/finance";

export const initialFinanceState: FinanceState = {
  accounts: [
    {
      id: "account-1",
      name: "Основной счет",
      balance: 0,
      currency: "₽",
    },
  ],

  goals: [],

  capitalSnapshots: [],

  operations: [],

  budgets: [],

  categories: [
    {
      id: "category-expense-1",
      name: "Еда",
      type: "expense",
    },
    {
      id: "category-expense-2",
      name: "Транспорт",
      type: "expense",
    },
    {
      id: "category-expense-3",
      name: "Развлечения",
      type: "expense",
    },
    {
      id: "category-expense-4",
      name: "Здоровье",
      type: "expense",
    },
    {
      id: "category-expense-5",
      name: "Подписки",
      type: "expense",
    },
    {
      id: "category-expense-6",
      name: "Жилье",
      type: "expense",
    },
    {
      id: "category-income-1",
      name: "Зарплата",
      type: "income",
    },
    {
      id: "category-income-2",
      name: "Подарки",
      type: "income",
    },
    {
      id: "category-income-3",
      name: "Возврат",
      type: "income",
    },
  ],

  recurringTemplates: [],

  trashItems: [],
};