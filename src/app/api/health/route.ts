import { NextResponse } from "next/server";
import { getRawClient } from "@/db/client";

export async function GET() {
  try {
    const raw = await getRawClient();
    await raw.execute("SELECT 1");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "db error" }, { status: 500 });
  }
}
