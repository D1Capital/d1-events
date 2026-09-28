import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*\.(?:jpe?g|png|webp|gif)$/i.test(filename)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const data = await readFile(
      path.join(process.cwd(), "public", "uploads", filename),
    );
    const extension = filename
      .slice(filename.lastIndexOf(".") + 1)
      .toLowerCase();
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": IMAGE_TYPES[extension],
        "Cache-Control": "public, max-age=2592000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new NextResponse(null, { status: 404 });
    }
    console.error("Uploaded image read error:", error);
    return new NextResponse(null, { status: 500 });
  }
}
