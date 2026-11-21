import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/viewer";
import { callHelloFunction } from "@/lib/functions";

export async function GET() {
  // Ops endpoint: staff only (it writes a probe object and calls a Function).
  if ((await getViewer())?.role !== "staff") {
    return NextResponse.json({ error: "Staff only" }, { status: 403 });
  }
  try {
    const result = await callHelloFunction();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Functions call error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
