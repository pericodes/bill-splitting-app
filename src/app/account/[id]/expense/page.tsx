import AddExpensePage from "./ExpensePage";

export default async function ExpenseRoute({
  searchParams,
}: {
  searchParams: Promise<{ tx?: string }>;
}) {
  const { tx } = await searchParams;
  return <AddExpensePage txId={tx} />;
}
