import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ALLOWED_MIME_TYPES, MAX_IMAGE_BYTES, toSpaceRecord } from "@/lib/spaces";

export async function GET() {
  try {
    const spaces = await prisma.space.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(spaces.map(toSpaceRecord));
  } catch {
    return NextResponse.json(
      { error: "Failed to load spaces. Check DATABASE_URL and run migrations." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return NextResponse.json(
        { error: "Invalid image type. Use JPEG, PNG, or WebP." },
        { status: 400 },
      );
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image too large. Maximum size is 5 MB." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

    const space = await prisma.space.create({
      data: {
        imageUrl,
        status: "PENDING",
      },
    });

    return NextResponse.json(toSpaceRecord(space), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload image. Check DATABASE_URL and run migrations." },
      { status: 500 },
    );
  }
}
