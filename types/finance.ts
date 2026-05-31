export type Account = {
  id: string;
  name: string;
  balance: number;
  currency: string;
};

export type Goal = {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  currency: string;
};

export type OperationType = "income" | "expense" | "transfer";

export type TransferTargetType = "account" | "goal";

export type Operation = {
  id: string;
  type: OperationType;
  title: string;
  amount: number;

  account: string;
  toAccount?: string;

  fromTargetType?: TransferTargetType;
  toTargetType?: TransferTargetType;

  goal?: string;
  toGoal?: string;

  category: string;
  note?: string;
  date: string;
};

export type Budget = {
  id: string;
  category: string;
  limit: number;
  spent: number;
  currency: string;
};

export type CategoryType = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
};

export type RecurringFrequency = "daily" | "weekly" | "monthly";

export type RecurringTemplate = {
  id: string;
  type: OperationType;
  title: string;
  amount: number;

  fromAccount: string;
  toAccount?: string;

  fromTargetType?: TransferTargetType;
  toTargetType?: TransferTargetType;

  fromGoal?: string;
  toGoal?: string;

  category?: string;
  note?: string;
  frequency: RecurringFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
};

export type TrashItemType =
  | "account"
  | "goal"
  | "operation"
  | "budget"
  | "category"
  | "template";

export type TrashItem = {
  id: string;
  type: TrashItemType;
  title: string;
  deletedAt: string;
  data: Account | Goal | Operation | Budget | Category | RecurringTemplate;
};

export type FinanceState = {
  accounts: Account[];
  goals: Goal[];
  operations: Operation[];
  budgets: Budget[];
  categories: Category[];
  recurringTemplates: RecurringTemplate[];
  trashItems: TrashItem[];
};