import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { detectImageType } from "@/lib/file-validation";
import { isRateLimited } from "@/lib/rate-limit";
import { SITE_IMAGE_SLOTS } from "@/lib/site-images";
import { requireAdmin } from "@/server/auth/telegram";

function parseSlot(value: string) {
  const slot = Number(value);
  return SITE_IMAGE_SLOTS.includes(slot as 1 | 2 | 3) ? slot : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slot: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const slot = parseSlot((await params).slot);
    if (slot === null) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
    }
    if (isRateLimited(`site-image-upload:${auth.user.id}`, 20, 600_000)) {
      return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.type !== "image/jpeg") {
      return NextResponse.json(
        { error: "JPEG image required" },
        { status: 400 },
      );
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image exceeds 2 MB" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (detectImageType(buffer) !== "image/jpeg") {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }

    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    const filename = `club-slot-${slot}-${randomUUID()}.jpg`;
    await writeFile(path.join(directory, filename), buffer);

    const url = `/uploads/${filename}`;
    await db.siteImage.upsert({
      where: { slot },
      create: { slot, url },
      update: { url },
    });
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Club image upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slot: string }> },
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const slot = parseSlot((await params).slot);
    if (slot === null) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
    }

    await db.siteImage.upsert({
      where: { slot },
      create: { slot, url: null },
      update: { url: null },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Club image delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
