"use client";
import { useState, useEffect } from "react";

type CollaboratorUser = { id: string; name: string; imageUrl: string | null };
type CollaboratorRecord = { id: number; role: string; userId: string; user: CollaboratorUser };

type Split = {
  id: number;
  userId: string;
  share: number;
  settled: boolean;
  user: { id: string; name: string };
};

type Expense = {
  id: number;
  description: string;
  amount: number;
  currency: string;
  createdAt: string;
  payerId: string;
  payer: { id: string; name: string };
  splits: Split[];
};

type Balance = {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
};

export default function BudgetPanel({
  itineraryId,
  collaborators,
  currentUserId,
}: {
  itineraryId: string;
  collaborators: CollaboratorRecord[];
  currentUserId: string;
}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState(currentUserId);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/itinerary/${itineraryId}/expenses`)
      .then((r) => r.json())
      .then((data) => {
        setExpenses(data.expenses ?? []);
        setLoading(false);
      });
  }, [itineraryId]);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!description || !amount) return;
    setSubmitting(true);
    const res = await fetch(`/api/itinerary/${itineraryId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        amount: parseFloat(amount),
        payerId,
        splitUserIds: collaborators.map((c) => c.userId),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setExpenses((prev) => [data.expense, ...prev]);
      setDescription("");
      setAmount("");
    }
    setSubmitting(false);
  }

  async function settle(expenseId: number, userId: string) {
    await fetch(`/api/expenses/${expenseId}/settle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === expenseId
          ? { ...exp, splits: exp.splits.map((s) => s.userId === userId ? { ...s, settled: true } : s) }
          : exp
      )
    );
  }

  function calculateBalances(): Balance[] {
    const net: { [key: string]: number } = {};
    const userMap: { [id: string]: string } = {};
    collaborators.forEach((c) => { userMap[c.userId] = c.user.name; });

    expenses.forEach((exp) => {
      exp.splits.forEach((split) => {
        if (split.settled || split.userId === exp.payerId) return;
        const [a, b] = [exp.payerId, split.userId].sort();
        const sign = exp.payerId === a ? 1 : -1;
        net[`${a}-${b}`] = (net[`${a}-${b}`] ?? 0) + sign * split.share;
      });
    });

    return Object.entries(net)
      .filter(([, amt]) => Math.abs(amt) > 0.005)
      .map(([key, amt]) => {
        const [a, b] = key.split("-");
        return amt > 0
          ? { fromId: b, fromName: userMap[b] ?? b, toId: a, toName: userMap[a] ?? a, amount: amt }
          : { fromId: a, fromName: userMap[a] ?? a, toId: b, toName: userMap[b] ?? b, amount: -amt };
      });
  }

  const balances = calculateBalances();
  const displayName = (id: string) => id === currentUserId ? "You" : (collaborators.find(c => c.userId === id)?.user.name ?? id);

  return (
    <div className="mt-4 flex flex-col gap-4 overflow-y-auto flex-1">

      {/* Add expense */}
      <form onSubmit={addExpense} className="bg-white border rounded-xl p-4 flex flex-col gap-3">
        <h3 className="font-bold text-base">Add Expense</h3>
        <input
          type="text"
          placeholder="Description (e.g. Dinner)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-1 focus:ring-red-400"
          required
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm flex-1 outline-none focus:ring-1 focus:ring-red-400"
            min="0"
            step="0.01"
            required
          />
          <select
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm flex-1 outline-none"
          >
            {collaborators.map((c) => (
              <option key={c.userId} value={c.userId}>
                {c.userId === currentUserId ? "You" : c.user.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-400">
          Split equally among all {collaborators.length} member{collaborators.length !== 1 ? "s" : ""}
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="bg-red-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add Expense"}
        </button>
      </form>

      {/* Balances summary */}
      {balances.length > 0 && (
        <div className="bg-white border rounded-xl p-4 flex flex-col gap-2">
          <h3 className="font-bold text-base">Who Owes Who</h3>
          {balances.map((b, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
              <span>
                <span className="font-semibold">{displayName(b.fromId)}</span>
                {" owe"}
                {b.fromId === currentUserId ? "" : "s"}{" "}
                <span className="font-semibold">{b.toId === currentUserId ? "you" : b.toName}</span>
              </span>
              <span className="font-bold text-red-500">${b.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expense list */}
      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-base">All Expenses</h3>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : expenses.length === 0 ? (
          <p className="text-sm text-gray-400">No expenses yet.</p>
        ) : (
          expenses.map((exp) => (
            <div key={exp.id} className="bg-white border rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{exp.description}</span>
                <span className="font-bold text-sm">${exp.amount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500">
                Paid by <span className="font-medium">{displayName(exp.payerId)}</span>
                {" · "}${(exp.amount / exp.splits.length).toFixed(2)} each
              </p>
              <div className="flex flex-col gap-1 pt-1 border-t">
                {exp.splits
                  .filter((s) => s.userId !== exp.payerId)
                  .map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <span className={s.settled ? "line-through text-gray-400" : "text-gray-600"}>
                        {displayName(s.userId)} — ${s.share.toFixed(2)}
                      </span>
                      {s.settled ? (
                        <span className="text-green-500 font-semibold">Settled ✓</span>
                      ) : (s.userId === currentUserId || exp.payerId === currentUserId) ? (
                        <button
                          onClick={() => settle(exp.id, s.userId)}
                          className="text-green-600 hover:text-green-700 font-semibold"
                        >
                          Settle
                        </button>
                      ) : null}
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
