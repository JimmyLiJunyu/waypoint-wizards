import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrUserId } from "@/lib/auth/session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const userId = await getCurrUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const expenseId = parseInt((await params).expenseId);

    const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    if (expense.payerId !== userId) {
      return NextResponse.json({ error: "Only the payer can delete this expense" }, { status: 403 });
    }

    await prisma.expense.delete({ where: { id: expenseId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
