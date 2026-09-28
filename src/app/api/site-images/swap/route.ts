import { NextResponse } from "next/server";
import { db } from "@/db";
import { isRateLimited } from "@/lib/rate-limit";
import { getSiteImages, SITE_IMAGE_SLOTS } from "@/lib/site-images";
import { requireAdmin } from "@/server/auth/telegram";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    if (isRateLimited(`site-image-swap:${auth.user.id}`, 60, 600_000)) {
      return NextResponse.json({ error: "Too many changes" }, { status: 429 });
    }
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 },
      );
    }

    const { first, second } = await request.json();
    if (
      !SITE_IMAGE_SLOTS.includes(first) ||
      !SITE_IMAGE_SLOTS.includes(second) ||
      first === second
    ) {
      return NextResponse.json({ error: "Invalid slots" }, { status: 400 });
    }

    const images = await getSiteImages();
    const firstUrl = images.find((image) => image.slot === first)?.url ?? null;
    const secondUrl =
      images.find((image) => image.slot === second)?.url ?? null;
    await db.$transaction([
      db.siteImage.update({ where: { slot: first }, data: { url: secondUrl } }),
      db.siteImage.update({ where: { slot: second }, data: { url: firstUrl } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Club image swap error:", error);
    return NextResponse.json({ error: "Swap failed" }, { status: 500 });
  }
}
