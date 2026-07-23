import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const expenseId = parseInt((await params).expenseId);
  const { userId } = await req.json();

  await prisma.expenseSplit.updateMany({
    where: { expenseId, userId },
    data: { settled: true },
  });

  return NextResponse.json({ success: true });
}
