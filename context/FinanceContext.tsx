/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */

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
  CapitalSnapshot,
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
  deleteAccount: (
    id: string,
    mode?: "keep_operations" | "delete_operations"
  ) => Promise<void>;

  addGoal: (goal: Omit<Goal, "id">) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  addCapitalSnapshot: (
    snapshot: Omit<CapitalSnapshot, "id">
  ) => Promise<void>;
  updateCapitalSnapshot: (snapshot: CapitalSnapshot) => Promise<void>;
  deleteCapitalSnapshot: (id: string) => Promise<void>;

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
  capitalSnapshots: [],
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

function mapCapitalSnapshot(row: any): CapitalSnapshot {
  return {
    id: row.id,
    month: row.month,
    capitalAmount: Number(row.capital_amount ?? 0),
    netIncomeAmount: Number(row.net_income_amount ?? 0),
    note: row.note ?? "",
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
  goals: Goal[],
  categories: Category[]
): Operation {
  const account = accounts.find((item) => item.id === row.account_id);
  const toAccount = accounts.find((item) => item.id === row.to_account_id);
  const goal = goals.find((item) => item.id === row.goal_id);
  const toGoal = goals.find((item) => item.id === row.to_goal_id);
  const category = categories.find((item) => item.id === row.category_id);

  const fromTargetType = row.from_target_type ?? "account";
  const toTargetType = row.to_target_type ?? "account";

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    amount: Number(row.amount ?? 0),

    account: account?.name ?? "",
    toAccount: toAccount?.name,

    fromTargetType,
    toTargetType,

    goal: goal?.name,
    toGoal: toGoal?.name,

    category:
      row.type === "transfer" ? "Перевод" : category?.name ?? "Без категории",

    note: row.note ?? "",
    date: row.operation_date,
  };
}

function mapTemplate(
  row: any,
  accounts: Account[],
  goals: Goal[],
  categories: Category[]
): RecurringTemplate {
  const fromAccount = accounts.find((item) => item.id === row.from_account_id);
  const toAccount = accounts.find((item) => item.id === row.to_account_id);
  const fromGoal = goals.find((item) => item.id === row.goal_id);
  const toGoal = goals.find((item) => item.id === row.to_goal_id);
  const category = categories.find((item) => item.id === row.category_id);

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    amount: Number(row.amount ?? 0),

    fromAccount: fromAccount?.name ?? "",
    toAccount: toAccount?.name,

    fromTargetType: row.from_target_type ?? "account",
    toTargetType: row.to_target_type ?? "account",

    fromGoal: fromGoal?.name,
    toGoal: toGoal?.name,

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

function findGoalId(goals: Goal[], name: string) {
  return goals.find((goal) => goal.name === name)?.id ?? null;
}

function findCategoryId(categories: Category[], name: string) {
  return categories.find((category) => category.name === name)?.id ?? null;
}

function getTrashDeletedAt(row: any) {
  return row.deleted_at ? String(row.deleted_at).slice(0, 10) : getTodayDate();
}

function getCurrentMonthStartDate() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-01`;
}

function getPreviousMonthStartDate(monthDate: string) {
  const date = new Date(monthDate);
  date.setMonth(date.getMonth() - 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-01`;
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);

  const [state, setState] = useState<FinanceState>(emptyState);
  const [isDataLoading, setIsDataLoading] = useState(true);

  async function getCurrentUserId() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      alert("Сначала войди в аккаунт");
      return null;
    }

    return data.user.id;
  }

  async function syncCurrentMonthCapitalSnapshot() {
    const userId = await getCurrentUserId();

    if (!userId) return;

    const currentMonth = getCurrentMonthStartDate();
    const previousMonth = getPreviousMonthStartDate(currentMonth);

    const [accountsResult, goalsResult, previousSnapshotResult] =
      await Promise.all([
        supabase
          .from("accounts")
          .select("balance")
          .eq("is_deleted", false),

        supabase
          .from("goals")
          .select("current_amount")
          .eq("is_deleted", false),

        supabase
          .from("capital_snapshots")
          .select("capital_amount")
          .eq("month", previousMonth)
          .eq("is_deleted", false)
          .maybeSingle(),
      ]);

    if (accountsResult.error) {
      console.error("Ошибка чтения счетов для капитала:", accountsResult.error);
      return;
    }

    if (goalsResult.error) {
      console.error("Ошибка чтения целей для капитала:", goalsResult.error);
      return;
    }

    const accountsTotal = (accountsResult.data ?? []).reduce(
      (sum: number, account: any) => sum + Number(account.balance ?? 0),
      0
    );

    const goalsTotal = (goalsResult.data ?? []).reduce(
      (sum: number, goal: any) => sum + Number(goal.current_amount ?? 0),
      0
    );

    const capitalAmount = accountsTotal + goalsTotal;

    const previousCapitalAmount = Number(
      previousSnapshotResult.data?.capital_amount ?? 0
    );

    const netIncomeAmount = capitalAmount - previousCapitalAmount;

    const { error } = await supabase.from("capital_snapshots").upsert(
      {
        user_id: userId,
        month: currentMonth,
        capital_amount: capitalAmount,
        net_income_amount: netIncomeAmount,
        note: "Автоматический расчет текущего месяца",
        is_deleted: false,
        deleted_at: null,
      },
      {
        onConflict: "user_id,month",
      }
    );

    if (error) {
      console.error("Ошибка автопересчета капитала:", error);
    }
  }

  async function changeAccountBalance(accountId: string | null, delta: number) {
    if (!accountId || delta === 0) return;

    const { data, error } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", accountId)
      .single();

    if (error) {
      console.error("Ошибка чтения баланса счета:", error);
      alert(error.message);
      return;
    }

    const currentBalance = Number(data?.balance ?? 0);
    const nextBalance = currentBalance + delta;

    const { error: updateError } = await supabase
      .from("accounts")
      .update({
        balance: nextBalance,
      })
      .eq("id", accountId);

    if (updateError) {
      console.error("Ошибка обновления баланса счета:", updateError);
      alert(updateError.message);
    }
  }

  async function changeGoalBalance(goalId: string | null, delta: number) {
    if (!goalId || delta === 0) return;

    const { data, error } = await supabase
      .from("goals")
      .select("current_amount")
      .eq("id", goalId)
      .single();

    if (error) {
      console.error("Ошибка чтения баланса цели:", error);
      alert(error.message);
      return;
    }

    const currentAmount = Number(data?.current_amount ?? 0);
    const nextAmount = currentAmount + delta;

    const { error: updateError } = await supabase
      .from("goals")
      .update({
        current_amount: nextAmount,
      })
      .eq("id", goalId);

    if (updateError) {
      console.error("Ошибка обновления баланса цели:", updateError);
      alert(updateError.message);
    }
  }

  async function changeBudgetSpent(categoryId: string | null, delta: number) {
    if (!categoryId || delta === 0) return;

    const { data, error } = await supabase
      .from("budgets")
      .select("id, spent_amount")
      .eq("category_id", categoryId)
      .eq("is_deleted", false)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Ошибка чтения бюджета:", error);
      alert(error.message);
      return;
    }

    if (!data) return;

    const currentSpent = Number(data.spent_amount ?? 0);
    const nextSpent = Math.max(0, currentSpent + delta);

    const { error: updateError } = await supabase
      .from("budgets")
      .update({
        spent_amount: nextSpent,
      })
      .eq("id", data.id);

    if (updateError) {
      console.error("Ошибка обновления бюджета:", updateError);
      alert(updateError.message);
    }
  }

  async function applyOperationBalance(operationRow: any, direction: 1 | -1) {
    const amount = Number(operationRow.amount ?? 0);

    if (operationRow.type === "expense") {
      await changeAccountBalance(operationRow.account_id, -amount * direction);
      await changeBudgetSpent(operationRow.category_id, amount * direction);
      return;
    }

    if (operationRow.type === "income") {
      await changeAccountBalance(operationRow.account_id, amount * direction);
      return;
    }

    if (operationRow.type === "transfer") {
      const fromTargetType = operationRow.from_target_type ?? "account";
      const toTargetType = operationRow.to_target_type ?? "account";

      if (fromTargetType === "account") {
        await changeAccountBalance(operationRow.account_id, -amount * direction);
      }

      if (fromTargetType === "goal") {
        await changeGoalBalance(operationRow.goal_id, -amount * direction);
      }

      if (toTargetType === "account") {
        await changeAccountBalance(
          operationRow.to_account_id,
          amount * direction
        );
      }

      if (toTargetType === "goal") {
        await changeGoalBalance(operationRow.to_goal_id, amount * direction);
      }
    }
  }

  async function ensureDefaultCategories() {
    const userId = await getCurrentUserId();

    if (!userId) {
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
        user_id: userId,
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
      capitalSnapshotsResult,
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
      supabase.from("capital_snapshots").select("*").order("month", {
        ascending: true,
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
    const allCapitalSnapshotRows = capitalSnapshotsResult.data ?? [];
    const allCategoryRows = categoriesResult.data ?? [];
    const allOperationRows = operationsResult.data ?? [];
    const allBudgetRows = budgetsResult.data ?? [];
    const allTemplateRows = templatesResult.data ?? [];

    const allAccounts = allAccountRows.map(mapAccount);
    const allGoals = allGoalRows.map(mapGoal);
    const allCategories = allCategoryRows.map(mapCategory);

    const activeAccounts = allAccountRows
      .filter((row: any) => !row.is_deleted)
      .map(mapAccount);

    const activeGoals = allGoalRows
      .filter((row: any) => !row.is_deleted)
      .map(mapGoal);

    const activeCapitalSnapshots = allCapitalSnapshotRows
      .filter((row: any) => !row.is_deleted)
      .map(mapCapitalSnapshot);

    const activeCategories = allCategoryRows
      .filter((row: any) => !row.is_deleted)
      .map(mapCategory);

    const activeOperations = allOperationRows
      .filter((row: any) => !row.is_deleted)
      .map((row: any) =>
        mapOperation(row, allAccounts, allGoals, allCategories)
      );

    const activeBudgets = allBudgetRows
      .filter((row: any) => !row.is_deleted)
      .map((row: any) => mapBudget(row, allCategories));

    const activeTemplates = allTemplateRows
      .filter((row: any) => !row.is_deleted)
      .map((row: any) => mapTemplate(row, allAccounts, allGoals, allCategories));

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
          const operation = mapOperation(
            row,
            allAccounts,
            allGoals,
            allCategories
          );

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
          const template = mapTemplate(
            row,
            allAccounts,
            allGoals,
            allCategories
          );

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
      capitalSnapshots: activeCapitalSnapshots,
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
      const userId = await getCurrentUserId();

      if (!userId) return;

      const { error } = await supabase.from("accounts").insert({
        user_id: userId,
        name: account.name,
        balance: account.balance,
        currency: "RUB",
      });

      if (error) {
        alert(error.message);
        console.error("Ошибка создания счета:", error);
        return;
      }

      await syncCurrentMonthCapitalSnapshot();
      await loadData();
    },

    async updateAccount(account) {
      const { error } = await supabase
        .from("accounts")
        .update({
          name: account.name,
          balance: account.balance,
          currency: "RUB",
        })
        .eq("id", account.id);

      if (error) {
        alert(error.message);
        console.error("Ошибка обновления счета:", error);
        return;
      }

      await syncCurrentMonthCapitalSnapshot();
      await loadData();
    },

    async deleteAccount(id, mode = "keep_operations") {
      if (mode === "delete_operations") {
        const { data: relatedOperations, error: operationsError } =
          await supabase
            .from("operations")
            .select("*")
            .or(`account_id.eq.${id},to_account_id.eq.${id}`)
            .eq("is_deleted", false);

        if (operationsError) {
          alert(operationsError.message);
          console.error("Ошибка чтения операций счета:", operationsError);
          return;
        }

        for (const operation of relatedOperations ?? []) {
          await applyOperationBalance(operation, -1);
        }

        const operationIds = (relatedOperations ?? []).map(
          (operation) => operation.id
        );

        if (operationIds.length > 0) {
          const { error: deleteOperationsError } = await supabase
            .from("operations")
            .update({
              is_deleted: true,
              deleted_at: new Date().toISOString(),
            })
            .in("id", operationIds);

          if (deleteOperationsError) {
            alert(deleteOperationsError.message);
            console.error(
              "Ошибка удаления операций счета:",
              deleteOperationsError
            );
            return;
          }
        }
      }

      const { error } = await supabase
        .from("accounts")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        alert(error.message);
        console.error("Ошибка удаления счета:", error);
        return;
      }

      await syncCurrentMonthCapitalSnapshot();
      await loadData();
    },

    async addGoal(goal) {
      const userId = await getCurrentUserId();

      if (!userId) return;

      const { error } = await supabase.from("goals").insert({
        user_id: userId,
        name: goal.name,
        current_amount: goal.currentAmount,
        target_amount: goal.targetAmount,
        currency: "RUB",
      });

      if (error) {
        alert(error.message);
        console.error("Ошибка создания цели:", error);
        return;
      }

      await syncCurrentMonthCapitalSnapshot();
      await loadData();
    },

    async updateGoal(goal) {
      const { error } = await supabase
        .from("goals")
        .update({
          name: goal.name,
          current_amount: goal.currentAmount,
          target_amount: goal.targetAmount,
          currency: "RUB",
        })
        .eq("id", goal.id);

      if (error) {
        alert(error.message);
        console.error("Ошибка обновления цели:", error);
        return;
      }

      await syncCurrentMonthCapitalSnapshot();
      await loadData();
    },

    async deleteGoal(id) {
      const { error } = await supabase
        .from("goals")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        alert(error.message);
        console.error("Ошибка удаления цели:", error);
        return;
      }

      await syncCurrentMonthCapitalSnapshot();
      await loadData();
    },

    async addCapitalSnapshot(snapshot) {
      const userId = await getCurrentUserId();

      if (!userId) return;

      const { error } = await supabase.from("capital_snapshots").upsert(
        {
          user_id: userId,
          month: snapshot.month,
          capital_amount: snapshot.capitalAmount,
          net_income_amount: snapshot.netIncomeAmount,
          note: snapshot.note,
          is_deleted: false,
          deleted_at: null,
        },
        {
          onConflict: "user_id,month",
        }
      );

      if (error) {
        alert(error.message);
        console.error("Ошибка создания снимка капитала:", error);
        return;
      }

      await loadData();
    },

    async updateCapitalSnapshot(snapshot) {
      const { error } = await supabase
        .from("capital_snapshots")
        .update({
          month: snapshot.month,
          capital_amount: snapshot.capitalAmount,
          net_income_amount: snapshot.netIncomeAmount,
          note: snapshot.note,
        })
        .eq("id", snapshot.id);

      if (error) {
        alert(error.message);
        console.error("Ошибка обновления снимка капитала:", error);
        return;
      }

      await loadData();
    },

    async deleteCapitalSnapshot(id) {
      const { error } = await supabase
        .from("capital_snapshots")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        alert(error.message);
        console.error("Ошибка удаления снимка капитала:", error);
        return;
      }

      await loadData();
    },

    async addCategory(category) {
      const userId = await getCurrentUserId();

      if (!userId) return;

      const { error } = await supabase.from("categories").insert({
        user_id: userId,
        name: category.name,
        type: category.type,
      });

      if (error) {
        alert(error.message);
        console.error("Ошибка создания категории:", error);
        return;
      }

      await loadData();
    },

    async updateCategory(category) {
      const { error } = await supabase
        .from("categories")
        .update({
          name: category.name,
          type: category.type,
        })
        .eq("id", category.id);

      if (error) {
        alert(error.message);
        console.error("Ошибка обновления категории:", error);
        return;
      }

      await loadData();
    },

    async deleteCategory(id) {
      const { error } = await supabase
        .from("categories")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        alert(error.message);
        console.error("Ошибка удаления категории:", error);
        return;
      }

      await loadData();
    },

    async addOperation(operation) {
      const userId = await getCurrentUserId();

      if (!userId) return;

      const fromTargetType = operation.fromTargetType ?? "account";
      const toTargetType = operation.toTargetType ?? "account";

      const accountId =
        fromTargetType === "account"
          ? findAccountId(state.accounts, operation.account)
          : null;

      const goalId =
        fromTargetType === "goal" && operation.goal
          ? findGoalId(state.goals, operation.goal)
          : null;

      const toAccountId =
        toTargetType === "account" && operation.toAccount
          ? findAccountId(state.accounts, operation.toAccount)
          : null;

      const toGoalId =
        toTargetType === "goal" && operation.toGoal
          ? findGoalId(state.goals, operation.toGoal)
          : null;

      const categoryId =
        operation.type === "transfer"
          ? null
          : findCategoryId(state.categories, operation.category);

      if (operation.type !== "transfer" && !accountId) {
        alert("Не найден счет для операции");
        return;
      }

      if (operation.type === "transfer") {
        if (fromTargetType === "account" && !accountId) {
          alert("Не найден счет списания");
          return;
        }

        if (fromTargetType === "goal" && !goalId) {
          alert("Не найдена цель списания");
          return;
        }

        if (toTargetType === "account" && !toAccountId) {
          alert("Не найден счет зачисления");
          return;
        }

        if (toTargetType === "goal" && !toGoalId) {
          alert("Не найдена цель зачисления");
          return;
        }
      }

      const operationRow = {
        user_id: userId,
        type: operation.type,
        title: operation.title,
        amount: operation.amount,
        currency: "RUB",

        from_target_type: fromTargetType,
        to_target_type: operation.type === "transfer" ? toTargetType : null,

        account_id: accountId,
        to_account_id: operation.type === "transfer" ? toAccountId : null,
        goal_id: operation.type === "transfer" ? goalId : null,
        to_goal_id: operation.type === "transfer" ? toGoalId : null,

        category_id: categoryId,
        note: operation.note,
        operation_date: operation.date,
      };

      const { error } = await supabase.from("operations").insert(operationRow);

      if (error) {
        alert(error.message);
        console.error("Ошибка создания операции:", error);
        return;
      }

      await applyOperationBalance(operationRow, 1);
      await syncCurrentMonthCapitalSnapshot();
      await loadData();
    },

    async updateOperation(operation) {
      const { data: oldOperation, error: oldOperationError } = await supabase
        .from("operations")
        .select("*")
        .eq("id", operation.id)
        .single();

      if (oldOperationError) {
        alert(oldOperationError.message);
        console.error("Ошибка чтения старой операции:", oldOperationError);
        return;
      }

      const fromTargetType = operation.fromTargetType ?? "account";
      const toTargetType = operation.toTargetType ?? "account";

      const accountId =
        fromTargetType === "account"
          ? findAccountId(state.accounts, operation.account)
          : null;

      const goalId =
        fromTargetType === "goal" && operation.goal
          ? findGoalId(state.goals, operation.goal)
          : null;

      const toAccountId =
        toTargetType === "account" && operation.toAccount
          ? findAccountId(state.accounts, operation.toAccount)
          : null;

      const toGoalId =
        toTargetType === "goal" && operation.toGoal
          ? findGoalId(state.goals, operation.toGoal)
          : null;

      const categoryId =
        operation.type === "transfer"
          ? null
          : findCategoryId(state.categories, operation.category);

      if (operation.type !== "transfer" && !accountId) {
        alert("Не найден счет для операции");
        return;
      }

      if (operation.type === "transfer") {
        if (fromTargetType === "account" && !accountId) {
          alert("Не найден счет списания");
          return;
        }

        if (fromTargetType === "goal" && !goalId) {
          alert("Не найдена цель списания");
          return;
        }

        if (toTargetType === "account" && !toAccountId) {
          alert("Не найден счет зачисления");
          return;
        }

        if (toTargetType === "goal" && !toGoalId) {
          alert("Не найдена цель зачисления");
          return;
        }
      }

      const newOperationRow = {
        type: operation.type,
        title: operation.title,
        amount: operation.amount,
        currency: "RUB",

        from_target_type: fromTargetType,
        to_target_type: operation.type === "transfer" ? toTargetType : null,

        account_id: accountId,
        to_account_id: operation.type === "transfer" ? toAccountId : null,
        goal_id: operation.type === "transfer" ? goalId : null,
        to_goal_id: operation.type === "transfer" ? toGoalId : null,

        category_id: categoryId,
        note: operation.note,
        operation_date: operation.date,
      };

      await applyOperationBalance(oldOperation, -1);

      const { error } = await supabase
        .from("operations")
        .update(newOperationRow)
        .eq("id", operation.id);

      if (error) {
        alert(error.message);
        console.error("Ошибка обновления операции:", error);
        await applyOperationBalance(oldOperation, 1);
        return;
      }

      await applyOperationBalance(newOperationRow, 1);
      await syncCurrentMonthCapitalSnapshot();
      await loadData();
    },

    async deleteOperation(id) {
      const { data: operation, error: operationError } = await supabase
        .from("operations")
        .select("*")
        .eq("id", id)
        .single();

      if (operationError) {
        alert(operationError.message);
        console.error("Ошибка чтения операции:", operationError);
        return;
      }

      await applyOperationBalance(operation, -1);

      const { error } = await supabase
        .from("operations")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        alert(error.message);
        console.error("Ошибка удаления операции:", error);
        await applyOperationBalance(operation, 1);
        return;
      }

      await syncCurrentMonthCapitalSnapshot();
      await loadData();
    },

    async addBudget(budget) {
      const userId = await getCurrentUserId();

      if (!userId) return;

      const categoryId = findCategoryId(state.categories, budget.category);

      const now = new Date();
      const month = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-01`;

      const { error } = await supabase.from("budgets").insert({
        user_id: userId,
        category_id: categoryId,
        month,
        limit_amount: budget.limit,
        spent_amount: budget.spent,
        currency: "RUB",
      });

      if (error) {
        alert(error.message);
        console.error("Ошибка создания бюджета:", error);
        return;
      }

      await loadData();
    },

    async updateBudget(budget) {
      const categoryId = findCategoryId(state.categories, budget.category);

      const { error } = await supabase
        .from("budgets")
        .update({
          category_id: categoryId,
          limit_amount: budget.limit,
          spent_amount: budget.spent,
          currency: "RUB",
        })
        .eq("id", budget.id);

      if (error) {
        alert(error.message);
        console.error("Ошибка обновления бюджета:", error);
        return;
      }

      await loadData();
    },

    async deleteBudget(id) {
      const { error } = await supabase
        .from("budgets")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        alert(error.message);
        console.error("Ошибка удаления бюджета:", error);
        return;
      }

      await loadData();
    },

    async addTemplate(template) {
      const userId = await getCurrentUserId();

      if (!userId) return;

      const fromTargetType = template.fromTargetType ?? "account";
      const toTargetType = template.toTargetType ?? "account";

      const fromAccountId =
        fromTargetType === "account"
          ? findAccountId(state.accounts, template.fromAccount)
          : null;

      const fromGoalId =
        fromTargetType === "goal" && template.fromGoal
          ? findGoalId(state.goals, template.fromGoal)
          : null;

      const toAccountId =
        toTargetType === "account" && template.toAccount
          ? findAccountId(state.accounts, template.toAccount)
          : null;

      const toGoalId =
        toTargetType === "goal" && template.toGoal
          ? findGoalId(state.goals, template.toGoal)
          : null;

      const categoryId =
        template.type === "transfer" || !template.category
          ? null
          : findCategoryId(state.categories, template.category);

      const { error } = await supabase.from("recurring_templates").insert({
        user_id: userId,
        type: template.type,
        title: template.title,
        amount: template.amount,
        currency: "RUB",

        from_target_type: fromTargetType,
        to_target_type: template.type === "transfer" ? toTargetType : null,

        from_account_id: fromAccountId,
        to_account_id: template.type === "transfer" ? toAccountId : null,
        goal_id: template.type === "transfer" ? fromGoalId : null,
        to_goal_id: template.type === "transfer" ? toGoalId : null,

        category_id: categoryId,
        note: template.note,
        frequency: template.frequency,
        day_of_week: template.dayOfWeek,
        day_of_month: template.dayOfMonth,
      });

      if (error) {
        alert(error.message);
        console.error("Ошибка создания шаблона:", error);
        return;
      }

      await loadData();
    },

    async updateTemplate(template) {
      const fromTargetType = template.fromTargetType ?? "account";
      const toTargetType = template.toTargetType ?? "account";

      const fromAccountId =
        fromTargetType === "account"
          ? findAccountId(state.accounts, template.fromAccount)
          : null;

      const fromGoalId =
        fromTargetType === "goal" && template.fromGoal
          ? findGoalId(state.goals, template.fromGoal)
          : null;

      const toAccountId =
        toTargetType === "account" && template.toAccount
          ? findAccountId(state.accounts, template.toAccount)
          : null;

      const toGoalId =
        toTargetType === "goal" && template.toGoal
          ? findGoalId(state.goals, template.toGoal)
          : null;

      const categoryId =
        template.type === "transfer" || !template.category
          ? null
          : findCategoryId(state.categories, template.category);

      const { error } = await supabase
        .from("recurring_templates")
        .update({
          type: template.type,
          title: template.title,
          amount: template.amount,
          currency: "RUB",

          from_target_type: fromTargetType,
          to_target_type: template.type === "transfer" ? toTargetType : null,

          from_account_id: fromAccountId,
          to_account_id: template.type === "transfer" ? toAccountId : null,
          goal_id: template.type === "transfer" ? fromGoalId : null,
          to_goal_id: template.type === "transfer" ? toGoalId : null,

          category_id: categoryId,
          note: template.note,
          frequency: template.frequency,
          day_of_week: template.dayOfWeek,
          day_of_month: template.dayOfMonth,
        })
        .eq("id", template.id);

      if (error) {
        alert(error.message);
        console.error("Ошибка обновления шаблона:", error);
        return;
      }

      await loadData();
    },

    async deleteTemplate(id) {
      const { error } = await supabase
        .from("recurring_templates")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        alert(error.message);
        console.error("Ошибка удаления шаблона:", error);
        return;
      }

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

      if (trashItem.type === "operation") {
        const { data: operation, error: operationError } = await supabase
          .from("operations")
          .select("*")
          .eq("id", id)
          .single();

        if (operationError) {
          alert(operationError.message);
          console.error("Ошибка чтения операции:", operationError);
          return;
        }

        await applyOperationBalance(operation, 1);
      }

      const { error } = await supabase
        .from(tableByType[trashItem.type])
        .update({
          is_deleted: false,
          deleted_at: null,
        })
        .eq("id", id);

      if (error) {
        alert(error.message);
        console.error("Ошибка восстановления:", error);
        return;
      }

      if (
        trashItem.type === "account" ||
        trashItem.type === "goal" ||
        trashItem.type === "operation"
      ) {
        await syncCurrentMonthCapitalSnapshot();
      }

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

      const { error } = await supabase
        .from(tableByType[trashItem.type])
        .delete()
        .eq("id", id);

      if (error) {
        alert(error.message);
        console.error("Ошибка удаления навсегда:", error);
        return;
      }

      if (
        trashItem.type === "account" ||
        trashItem.type === "goal" ||
        trashItem.type === "operation"
      ) {
        await syncCurrentMonthCapitalSnapshot();
      }

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

      await syncCurrentMonthCapitalSnapshot();
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