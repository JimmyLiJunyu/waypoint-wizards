export type BalanceSplit = {
  userId: string;
  share: number;
  settled: boolean;
};

export type BalanceExpense = {
  payerId: string;
  splits: BalanceSplit[];
};

export type Balance = {
  fromId: string;
  toId: string;
  amount: number;
};

export function calculateBalances(expenses: BalanceExpense[]): Balance[] {
  const net: { [key: string]: number } = {};
  // UUIDs contain hyphens, so joining/splitting on "-" corrupts the pair — use "|" instead.
  const SEP = "|";

  expenses.forEach((exp) => {
    exp.splits.forEach((split) => {
      if (split.settled || split.userId === exp.payerId) return;
      const [a, b] = [exp.payerId, split.userId].sort();
      const sign = exp.payerId === a ? 1 : -1;
      const key = `${a}${SEP}${b}`;
      net[key] = (net[key] ?? 0) + sign * split.share;
    });
  });

  return Object.entries(net)
    .filter(([, amt]) => Math.abs(amt) > 0.005)
    .map(([key, amt]) => {
      const [a, b] = key.split(SEP);
      return amt > 0 ? { fromId: b, toId: a, amount: amt } : { fromId: a, toId: b, amount: -amt };
    });
}
