import { NextResponse } from "next/server";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth";
import { getDocument, readDocumentBytes } from "@/lib/documents";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireUserOrThrow();
    const { id } = await ctx.params;
    const doc = await getDocument(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const bytes = await readDocumentBytes(doc);
    const download = new URL(request.url).searchParams.get("download") === "1";
    const inlineable = doc.mime === "application/pdf" || doc.mime.startsWith("image/");
    const disposition = `${download || !inlineable ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(doc.filename)}`;
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": doc.mime,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": disposition,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Could not read the document" }, { status: 500 });
  }
}
