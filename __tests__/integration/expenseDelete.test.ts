jest.mock("@/lib/auth/session", () => ({
  getCurrUserId: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    expense: { findUnique: jest.fn(), delete: jest.fn() },
  },
}));

import { NextRequest } from "next/server";
import { DELETE } from "@/app/api/expenses/[expenseId]/route";
import { getCurrUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const mockGetCurrUserId = getCurrUserId as jest.Mock;
const mockExpenseFindUnique = prisma.expense.findUnique as jest.Mock;
const mockExpenseDelete = prisma.expense.delete as jest.Mock;

const EXPENSE_ID = "42";
const routeParams = { params: Promise.resolve({ expenseId: EXPENSE_ID }) };

function makeRequest() {
  return new NextRequest(`http://localhost/api/expenses/${EXPENSE_ID}`, { method: "DELETE" });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("DELETE /api/expenses/[expenseId]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetCurrUserId.mockResolvedValue(null);
    const res = await DELETE(makeRequest(), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 404 when the expense does not exist", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockExpenseFindUnique.mockResolvedValue(null);
    const res = await DELETE(makeRequest(), routeParams);
    expect(res.status).toBe(404);
  });

  it("returns 403 when the caller did not pay for the expense", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockExpenseFindUnique.mockResolvedValue({ id: 42, payerId: "user-b" });
    const res = await DELETE(makeRequest(), routeParams);
    expect(res.status).toBe(403);
    expect(mockExpenseDelete).not.toHaveBeenCalled();
  });

  it("returns 200 and deletes when the caller is the payer", async () => {
    mockGetCurrUserId.mockResolvedValue("user-a");
    mockExpenseFindUnique.mockResolvedValue({ id: 42, payerId: "user-a" });
    mockExpenseDelete.mockResolvedValue({ id: 42 });

    const res = await DELETE(makeRequest(), routeParams);
    expect(res.status).toBe(200);
    expect(mockExpenseDelete).toHaveBeenCalledWith({ where: { id: 42 } });
  });
});
