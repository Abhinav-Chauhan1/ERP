// `Expense.category` is a freeform string column (no DB enum). These are the
// canonical values the UI offers and the seed data uses — kept as Title Case
// so the stored value doubles as the display label.
export const EXPENSE_CATEGORIES = [
  { id: "Staff", name: "Staff Salaries", color: "bg-teal-100 text-teal-800" },
  { id: "Utilities", name: "Utilities", color: "bg-primary/10 text-primary" },
  { id: "Maintenance", name: "Maintenance", color: "bg-amber-100 text-amber-800" },
  { id: "Supplies", name: "Supplies", color: "bg-green-100 text-green-800" },
  { id: "Equipment", name: "Equipment", color: "bg-cyan-100 text-cyan-800" },
  { id: "Transportation", name: "Transportation", color: "bg-indigo-100 text-indigo-800" },
  { id: "Library", name: "Library", color: "bg-violet-100 text-violet-800" },
  { id: "Sports", name: "Sports", color: "bg-lime-100 text-lime-800" },
  { id: "Food", name: "Food", color: "bg-orange-100 text-orange-800" },
  { id: "Events", name: "Events", color: "bg-pink-100 text-pink-800" },
  { id: "Marketing", name: "Marketing", color: "bg-purple-100 text-purple-800" },
  { id: "Insurance", name: "Insurance", color: "bg-blue-100 text-blue-800" },
  { id: "Rent", name: "Rent", color: "bg-fuchsia-100 text-fuchsia-800" },
  { id: "Other", name: "Other", color: "bg-muted text-gray-800" },
] as const;

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORIES)[number]["id"];

export function getExpenseCategoryLabel(categoryId: string): string {
  return EXPENSE_CATEGORIES.find((cat) => cat.id === categoryId)?.name || categoryId;
}

export function getExpenseCategoryColor(categoryId: string): string {
  return EXPENSE_CATEGORIES.find((cat) => cat.id === categoryId)?.color || "bg-muted text-gray-800";
}

export const EXPENSE_PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ONLINE_PAYMENT", label: "Online Payment" },
] as const;

export const EXPENSE_PAYMENT_STATUSES = ["PENDING", "COMPLETED", "PARTIAL", "FAILED", "REFUNDED"] as const;
