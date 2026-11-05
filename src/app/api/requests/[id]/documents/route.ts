import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { DOCUMENT_CATEGORIES, type DocumentCategory } from "@/db/schema";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, storeDocument } from "@/lib/documents";
import { getRequest } from "@/lib/requests";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUserOrThrow();
    const { id } = await ctx.params;
    const req = await getRequest(id);
    if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const form = await request.formData();
    const categoryRaw = String(form.get("category") ?? "client");
    const category = (DOCUMENT_CATEGORIES as readonly string[]).includes(categoryRaw) ? (categoryRaw as DocumentCategory) : "client";
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) return NextResponse.json({ error: "Choose at least one file." }, { status: 400 });

    const stored = [];
    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: `${file.name} is larger than 25 MB.` }, { status: 413 });
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      stored.push(
        await storeDocument({
          requestId: id,
          category,
          filename: file.name,
          mime: file.type || "application/octet-stream",
          bytes,
          uploadedBy: me.id,
          logEvent: true,
        }),
      );
    }
    revalidatePath(`/portal/requests/${id}`);
    revalidatePath("/portal");
    return NextResponse.json({ documents: stored });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
