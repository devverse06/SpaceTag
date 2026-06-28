import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { spaceStatusSelect, toSpaceRecord, toSpaceStatusRecord } from "@/lib/spaces";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const lite = new URL(request.url).searchParams.get("lite") === "1";

    if (lite) {
      const space = await prisma.space.findUnique({
        where: { id },
        select: spaceStatusSelect,
      });

      if (!space) {
        return NextResponse.json({ error: "Space not found" }, { status: 404 });
      }

      return NextResponse.json(toSpaceStatusRecord(space));
    }

    const space = await prisma.space.findUnique({ where: { id } });

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    return NextResponse.json(toSpaceRecord(space));
  } catch {
    return NextResponse.json({ error: "Failed to load space" }, { status: 500 });
  }
}
