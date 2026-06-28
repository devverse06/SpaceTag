import { after, NextResponse } from "next/server";
import { runAnalysis } from "@/lib/analysis";
import { prisma } from "@/lib/prisma";
import {
  isStaleProcessing,
  spaceStatusSelect,
  toSpaceStatusRecord,
} from "@/lib/spaces";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { spaceId?: string };
    const spaceId = body.spaceId?.trim();

    if (!spaceId) {
      return NextResponse.json({ error: "spaceId is required" }, { status: 400 });
    }

    const space = await prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    if (space.status === "PROCESSING" && !isStaleProcessing(space.updatedAt)) {
      const current = await prisma.space.findUnique({
        where: { id: spaceId },
        select: spaceStatusSelect,
      });
      return NextResponse.json(toSpaceStatusRecord(current!));
    }

    if (space.status === "DONE" && space.annotations) {
      const current = await prisma.space.findUnique({
        where: { id: spaceId },
        select: spaceStatusSelect,
      });
      return NextResponse.json(toSpaceStatusRecord(current!));
    }

    const updated = await prisma.space.update({
      where: { id: spaceId },
      data: {
        status: "PROCESSING",
        errorMessage: null,
      },
      select: spaceStatusSelect,
    });

    after(async () => {
      await runAnalysis(spaceId);
    });

    return NextResponse.json(toSpaceStatusRecord(updated), { status: 202 });
  } catch {
    return NextResponse.json({ error: "Failed to start analysis" }, { status: 500 });
  }
}
