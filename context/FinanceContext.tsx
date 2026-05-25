"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { getTodayDate } from "@/lib/format";
import type {
  Account,
  Budget,
  Category,
  FinanceState,
  Goal,
  Operation,
  RecurringTemplate,
  TrashItem,
} from "@/types/finance";

type FinanceContextValue = FinanceState & {
  isDataLoading: boolean;

  addAccount: (account: Omit<Account, "id">) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  addGoal: (goal: Omit<Goal, "id">) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  addOperation: (operation: Omit<Operation, "id">) => Promise<void>;
  updateOperation: (operation: Operation) => Promise<void>;
  deleteOperation: (id: string) => Promise<void>;

  addBudget: (budget: Omit<Budget, "id">) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  addCategory: (category: Omit<Category, "id">) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addTemplate: (template: Omit<RecurringTemplate, "id">) => Promise<void>;
  updateTemplate: (template: RecurringTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

  restoreTrashItem: (id: string) => Promise<void>;
  deleteTrashItemForever: (id: string) => Promise<void>;
  clearTrash: () => Promise<void>;

  reloadData: () => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

const emptyState: FinanceState = {
  accounts: [],
  goals: [],
  operations: [],
  budgets: [],
  categories: [],
  recurringTemplates: [],
  trashItems: [],
};

const defaultCategories = [
  { name: "Еда", type: "expense" },
  { name: "Транспорт", type: "expense" },
  { name: "Развлечения", type: "expense" },
  { name: "Здоровье", type: "expense" },
  { name: "Подписки", type: "expense" },
  { name: "Жилье", type: "expense" },
  { name: "Зарплата", type: "income" },
  { name: "Подарки", type: "income" },
  { name: "Возврат", type: "income" },
] as const;

function mapAccount(row: any): Account {
  return {
    id: row.id,
    name: row.name,
    balance: Number(row.balance ?? 0),
    currency: row.currency === "RUB" ? "₽" : row.currency ?? "₽",
  };
}

function mapGoal(row: any): Goal {
  return {
    id: row.id,
    name: row.name,
    currentAmount: Number(row.current_amount ?? 0),
    targetAmount: Number(row.target_amount ?? 0),
    currency: row.currency === "RUB" ? "₽" : row.currency ?? "₽",
  };
}

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
  };
}

function mapBudget(row: any, categories: Category[]): Budget {
  const category = categories.find((item) => item.id === row.category_id);

  return {
    id: row.id,
    category: category?.name ?? "Без категории",
    limit: Number(row.limit_amount ?? 0),
    spent: Number(row.spent_amount ?? 0),
    currency: row.currency === "RUB" ? "₽" : row.currency ?? "₽",
  };
}

function mapOperation(
  row: any,
  accounts: Account[],
  categories: Category[]
): Operation {
  const account = accounts.find((item) => item.id === row.account_id);
  const toAccount = accounts.find((item) => item.id === row.to_account_id);
  const category = categories.find((item) => item.id === row.category_id);

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    amount: Number(row.amount ?? 0),
    account: account?.name ?? "Без счета",
    toAccount: toAccount?.name,
    category:
      row.type === "transfer" ? "Перевод" : category?.name ?? "Без категории",
    note: row.note ?? "",
    date: row.operation_date,
  };
}

function mapTemplate(
  row: any,
  accounts: Account[],
  categories: Category[]
): RecurringTemplate {
  const fromAccount = accounts.find((item) => item.id === row.from_account_id);
  const toAccount = accounts.find((item) => item.id === row.to_account_id);
  const category = categories.find((item) => item.id === row.category_id);

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    amount: Number(row.amount ?? 0),
    fromAccount: fromAccount?.name ?? "Без счета",
    toAccount: toAccount?.name,
    category: row.type === "transfer" ? "Перевод" : category?.name,
    note: row.note ?? "",
    frequency: row.frequency,
    dayOfWeek: row.day_of_week ?? undefined,
    dayOfMonth: row.day_of_month ?? undefined,
  };
}

function findAccountId(accounts: Account[], name: string) {
  return accounts.find((account) => account.name === name)?.id ?? null;
}

function findCategoryId(categories: Category[], name: string) {
  return categories.find((category) => category.name === name)?.id ?? null;
}

function getTrashDeletedAt(row: any) {
  return row.deleted_at ? String(row.deleted_at).slice(0, 10) : getTodayDate();
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);

  const [state, setState] = useState<FinanceState>(emptyState);
  const [isDataLoading, setIsDataLoading] = useState(true);

  async function ensureDefaultCategories() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return;
    }

    const { data: existingCategories } = await supabase
      .from("categories")
      .select("id")
      .limit(1);

    if (existingCategories && existingCategories.length > 0) {
      return;
    }

    await supabase.from("categories").insert(
      defaultCategories.map((category) => ({
        name: category.name,
        type: category.type,
      }))
    );
  }

  async function loadData() {
    setIsDataLoading(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setState(emptyState);
      setIsDataLoading(false);
      return;
    }

    await ensureDefaultCategories();

    const [
      accountsResult,
      goalsResult,
      categoriesResult,
      operationsResult,
      budgetsResult,
      templatesResult,
    ] = await Promise.all([
      supabase.from("accounts").select("*").order("created_at", {
        ascending: false,
      }),
      supabase.from("goals").select("*").order("created_at", {
        ascending: false,
      }),
      supabase.from("categories").select("*").order("created_at", {
        ascending: false,
      }),
      supabase.from("operations").select("*").order("operation_date", {
        ascending: false,
      }),
      supabase.from("budgets").select("*").order("created_at", {
        ascending: false,
      }),
      supabase.from("recurring_templates").select("*").order("created_at", {
        ascending: false,
      }),
    ]);

    const allAccountRows = accountsResult.data ?? [];
    const allGoalRows = goalsResult.data ?? [];
    const allCategoryRows = categoriesResult.data ?? [];
    const allOperationRows = operationsResult.data ?? [];
    const allBudgetRows = budgetsResult.data ?? [];
    const allTemplateRows = templatesResult.data ?? [];

    const allAccounts = allAccountRows.map(mapAccount);
    const allCategories = allCategoryRows.map(mapCategory);

    const activeAccounts = allAccountRows
      .filter((row: any) => !row.is_deleted)
      .map(mapAccount);

    const activeGoals = allGoalRows
      .filter((row: any) => !row.is_deleted)
      .map(mapGoal);

    const activeCategories = allCategoryRows
      .filter((row: any) => !row.is_deleted)
      .map(mapCategory);

    const activeOperations = allOperationRows
      .filter((row: any) => !row.is_deleted)
      .map((row: any) => mapOperation(row, allAccounts, allCategories));

    const activeBudgets = allBudgetRows
      .filter((row: any) => !row.is_deleted)
      .map((row: any) => mapBudget(row, allCategories));

    const activeTemplates = allTemplateRows
      .filter((row: any) => !row.is_deleted)
      .map((row: any) => mapTemplate(row, allAccounts, allCategories));

    const trashItems: TrashItem[] = [
      ...allAccountRows
        .filter((row: any) => row.is_deleted)
        .map((row: any) => ({
          id: row.id,
          type: "account" as const,
          title: row.name,
          deletedAt: getTrashDeletedAt(row),
          data: mapAccount(row),
        })),

      ...allGoalRows
        .filter((row: any) => row.is_deleted)
        .map((row: any) => ({
          id: row.id,
          type: "goal" as const,
          title: row.name,
          deletedAt: getTrashDeletedAt(row),
          data: mapGoal(row),
        })),

      ...allCategoryRows
        .filter((row: any) => row.is_deleted)
        .map((row: any) => ({
          id: row.id,
          type: "category" as const,
          title: row.name,
          deletedAt: getTrashDeletedAt(row),
          data: mapCategory(row),
        })),

      ...allOperationRows
        .filter((row: any) => row.is_deleted)
        .map((row: any) => {
          const operation = mapOperation(row, allAccounts, allCategories);

          return {
            id: row.id,
            type: "operation" as const,
            title: operation.title,
            deletedAt: getTrashDeletedAt(row),
            data: operation,
          };
        }),

      ...allBudgetRows
        .filter((row: any) => row.is_deleted)
        .map((row: any) => {
          const budget = mapBudget(row, allCategories);

          return {
            id: row.id,
            type: "budget" as const,
            title: budget.category,
            deletedAt: getTrashDeletedAt(row),
            data: budget,
          };
        }),

      ...allTemplateRows
        .filter((row: any) => row.is_deleted)
        .map((row: any) => {
          const template = mapTemplate(row, allAccounts, allCategories);

          return {
            id: row.id,
            type: "template" as const,
            title: template.title,
            deletedAt: getTrashDeletedAt(row),
            data: template,
          };
        }),
    ];

    setState({
      accounts: activeAccounts,
      goals: activeGoals,
      operations: activeOperations,
      budgets: activeBudgets,
      categories: activeCategories,
      recurringTemplates: activeTemplates,
      trashItems,
    });

    setIsDataLoading(false);
  }

  useEffect(() => {
    loadData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadData();
      } else {
        setState(emptyState);
        setIsDataLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value: FinanceContextValue = {
    ...state,
    isDataLoading,

    async reloadData() {
      await loadData();
    },

    async addAccount(account) {
      await supabase.from("accounts").insert({
        name: account.name,
        balance: account.balance,
        currency: "RUB",
      });

      await loadData();
    },

    async updateAccount(account) {
      await supabase
        .from("accounts")
        .update({
          name: account.name,
          balance: account.balance,
          currency: "RUB",
        })
        .eq("id", account.id);

      await loadData();
    },

    async deleteAccount(id) {
      await supabase
        .from("accounts")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      await loadData();
    },

    async addGoal(goal) {
      await supabase.from("goals").insert({
        name: goal.name,
        current_amount: goal.currentAmount,
        target_amount: goal.targetAmount,
        currency: "RUB",
      });

      await loadData();
    },

    async updateGoal(goal) {
      await supabase
        .from("goals")
        .update({
          name: goal.name,
          current_amount: goal.currentAmount,
          target_amount: goal.targetAmount,
          currency: "RUB",
        })
        .eq("id", goal.id);

      await loadData();
    },

    async deleteGoal(id) {
      await supabase
        .from("goals")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      await loadData();
    },

    async addCategory(category) {
      await supabase.from("categories").insert({
        name: category.name,
        type: category.type,
      });

      await loadData();
    },

    async updateCategory(category) {
      await supabase
        .from("categories")
        .update({
          name: category.name,
          type: category.type,
        })
        .eq("id", category.id);

      await loadData();
    },

    async deleteCategory(id) {
      await supabase
        .from("categories")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      await loadData();
    },

    async addOperation(operation) {
      const accountId = findAccountId(state.accounts, operation.account);
      const toAccountId = operation.toAccount
        ? findAccountId(state.accounts, operation.toAccount)
        : null;

      const categoryId =
        operation.type === "transfer"
          ? null
          : findCategoryId(state.categories, operation.category);

      await supabase.from("operations").insert({
        type: operation.type,
        title: operation.title,
        amount: operation.amount,
        currency: "RUB",
        account_id: accountId,
        to_account_id: toAccountId,
        category_id: categoryId,
        note: operation.note,
        operation_date: operation.date,
      });

      await loadData();
    },

    async updateOperation(operation) {
      const accountId = findAccountId(state.accounts, operation.account);
      const toAccountId = operation.toAccount
        ? findAccountId(state.accounts, operation.toAccount)
        : null;

      const categoryId =
        operation.type === "transfer"
          ? null
          : findCategoryId(state.categories, operation.category);

      await supabase
        .from("operations")
        .update({
          type: operation.type,
          title: operation.title,
          amount: operation.amount,
          currency: "RUB",
          account_id: accountId,
          to_account_id: toAccountId,
          category_id: categoryId,
          note: operation.note,
          operation_date: operation.date,
        })
        .eq("id", operation.id);

      await loadData();
    },

    async deleteOperation(id) {
      await supabase
        .from("operations")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      await loadData();
    },

    async addBudget(budget) {
      const categoryId = findCategoryId(state.categories, budget.category);

      const now = new Date();
      const month = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-01`;

      await supabase.from("budgets").insert({
        category_id: categoryId,
        month,
        limit_amount: budget.limit,
        spent_amount: budget.spent,
        currency: "RUB",
      });

      await loadData();
    },

    async updateBudget(budget) {
      const categoryId = findCategoryId(state.categories, budget.category);

      await supabase
        .from("budgets")
        .update({
          category_id: categoryId,
          limit_amount: budget.limit,
          spent_amount: budget.spent,
          currency: "RUB",
        })
        .eq("id", budget.id);

      await loadData();
    },

    async deleteBudget(id) {
      await supabase
        .from("budgets")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      await loadData();
    },

    async addTemplate(template) {
      const fromAccountId = findAccountId(state.accounts, template.fromAccount);
      const toAccountId = template.toAccount
        ? findAccountId(state.accounts, template.toAccount)
        : null;

      const categoryId =
        template.type === "transfer" || !template.category
          ? null
          : findCategoryId(state.categories, template.category);

      await supabase.from("recurring_templates").insert({
        type: template.type,
        title: template.title,
        amount: template.amount,
        currency: "RUB",
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        category_id: categoryId,
        note: template.note,
        frequency: template.frequency,
        day_of_week: template.dayOfWeek,
        day_of_month: template.dayOfMonth,
      });

      await loadData();
    },

    async updateTemplate(template) {
      const fromAccountId = findAccountId(state.accounts, template.fromAccount);
      const toAccountId = template.toAccount
        ? findAccountId(state.accounts, template.toAccount)
        : null;

      const categoryId =
        template.type === "transfer" || !template.category
          ? null
          : findCategoryId(state.categories, template.category);

      await supabase
        .from("recurring_templates")
        .update({
          type: template.type,
          title: template.title,
          amount: template.amount,
          currency: "RUB",
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          category_id: categoryId,
          note: template.note,
          frequency: template.frequency,
          day_of_week: template.dayOfWeek,
          day_of_month: template.dayOfMonth,
        })
        .eq("id", template.id);

      await loadData();
    },

    async deleteTemplate(id) {
      await supabase
        .from("recurring_templates")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      await loadData();
    },

    async restoreTrashItem(id) {
      const trashItem = state.trashItems.find((item) => item.id === id);

      if (!trashItem) return;

      const tableByType = {
        account: "accounts",
        goal: "goals",
        operation: "operations",
        budget: "budgets",
        category: "categories",
        template: "recurring_templates",
      } as const;

      await supabase
        .from(tableByType[trashItem.type])
        .update({
          is_deleted: false,
          deleted_at: null,
        })
        .eq("id", id);

      await loadData();
    },

    async deleteTrashItemForever(id) {
      const trashItem = state.trashItems.find((item) => item.id === id);

      if (!trashItem) return;

      const tableByType = {
        account: "accounts",
        goal: "goals",
        operation: "operations",
        budget: "budgets",
        category: "categories",
        template: "recurring_templates",
      } as const;

      await supabase.from(tableByType[trashItem.type]).delete().eq("id", id);

      await loadData();
    },

    async clearTrash() {
      await Promise.all([
        supabase.from("accounts").delete().eq("is_deleted", true),
        supabase.from("goals").delete().eq("is_deleted", true),
        supabase.from("operations").delete().eq("is_deleted", true),
        supabase.from("budgets").delete().eq("is_deleted", true),
        supabase.from("categories").delete().eq("is_deleted", true),
        supabase.from("recurring_templates").delete().eq("is_deleted", true),
      ]);

      await loadData();
    },
  };

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error("useFinance must be used inside FinanceProvider");
  }

  return context;
}