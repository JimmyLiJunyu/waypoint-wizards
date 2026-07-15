import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  const { itineraryId } = await params;

  const expenses = await prisma.expense.findMany({
    where: { itineraryId },
    include: {
      payer: { select: { id: true, name: true } },
      splits: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ expenses });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  const { itineraryId } = await params;
  const { description, amount, payerId, splitUserIds } = await req.json();

  const share = amount / splitUserIds.length;

  const expense = await prisma.expense.create({
    data: {
      itineraryId,
      payerId,
      description,
      amount,
      splits: {
        create: splitUserIds.map((userId: string) => ({ userId, share })),
      },
    },
    include: {
      payer: { select: { id: true, name: true } },
      splits: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json({ expense });
}
