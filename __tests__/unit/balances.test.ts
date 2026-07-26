import { calculateBalances, type BalanceExpense } from "@/lib/balances";

// Real UUID-shaped ids (containing hyphens) deliberately, not "user-a"/"user-b" — this is a
// regression test for a bug where two ids were joined with "-" then split on "-", corrupting
// both ids since UUIDs themselves contain hyphens.
const ALICE = "86f2a3d8-5e2b-4ac4-924e-e3d2fb2f35fa";
const BOB = "92938cac-1111-4ac4-924e-e3d2fb2f35fa";
const CAROL = "6e5f1234-2222-4ac4-924e-e3d2fb2f35fa";

describe("calculateBalances", () => {
  it("returns a simple two-person debt", () => {
    const expenses: BalanceExpense[] = [
      {
        payerId: ALICE,
        splits: [
          { userId: ALICE, share: 50, settled: false },
          { userId: BOB, share: 50, settled: false },
        ],
      },
    ];

    const balances = calculateBalances(expenses);
    expect(balances).toHaveLength(1);
    expect(balances[0]).toEqual({ fromId: BOB, toId: ALICE, amount: 50 });
  });

  it("preserves full UUIDs in the result (regression: hyphen-delimiter bug)", () => {
    const expenses: BalanceExpense[] = [
      {
        payerId: ALICE,
        splits: [{ userId: BOB, share: 25, settled: false }],
      },
    ];

    const [balance] = calculateBalances(expenses);
    expect(balance.fromId).toBe(BOB);
    expect(balance.toId).toBe(ALICE);
    expect(balance.fromId).toHaveLength(36);
    expect(balance.toId).toHaveLength(36);
  });

  it("nets multiple expenses between the same pair down to a single balance", () => {
    const expenses: BalanceExpense[] = [
      { payerId: ALICE, splits: [{ userId: BOB, share: 20, settled: false }] },
      { payerId: BOB, splits: [{ userId: ALICE, share: 15, settled: false }] },
    ];

    const balances = calculateBalances(expenses);
    expect(balances).toHaveLength(1);
    expect(balances[0]).toEqual({ fromId: BOB, toId: ALICE, amount: 5 });
  });

  it("excludes a pair whose net balance rounds to zero", () => {
    const expenses: BalanceExpense[] = [
      { payerId: ALICE, splits: [{ userId: BOB, share: 20, settled: false }] },
      { payerId: BOB, splits: [{ userId: ALICE, share: 20, settled: false }] },
    ];

    expect(calculateBalances(expenses)).toHaveLength(0);
  });

  it("excludes already-settled splits", () => {
    const expenses: BalanceExpense[] = [
      { payerId: ALICE, splits: [{ userId: BOB, share: 20, settled: true }] },
    ];

    expect(calculateBalances(expenses)).toHaveLength(0);
  });

  it("excludes the payer's own split from their own expense", () => {
    const expenses: BalanceExpense[] = [
      {
        payerId: ALICE,
        splits: [
          { userId: ALICE, share: 10, settled: false },
          { userId: BOB, share: 10, settled: false },
        ],
      },
    ];

    const balances = calculateBalances(expenses);
    expect(balances).toHaveLength(1);
    expect(balances[0].fromId).toBe(BOB);
  });

  it("handles multi-way debts between three people independently", () => {
    const expenses: BalanceExpense[] = [
      {
        payerId: ALICE,
        splits: [
          { userId: BOB, share: 10, settled: false },
          { userId: CAROL, share: 10, settled: false },
        ],
      },
      {
        payerId: BOB,
        splits: [{ userId: CAROL, share: 5, settled: false }],
      },
    ];

    const balances = calculateBalances(expenses);
    expect(balances).toHaveLength(3);
    expect(balances).toContainEqual({ fromId: BOB, toId: ALICE, amount: 10 });
    expect(balances).toContainEqual({ fromId: CAROL, toId: ALICE, amount: 10 });
    expect(balances).toContainEqual({ fromId: CAROL, toId: BOB, amount: 5 });
  });
});
