import { NextResponse } from "next/server";
import { uploadObject, listObjects } from "@/lib/storage";
import { getViewer } from "@/lib/auth/viewer";

const MAX_BYTES = 25 * 1024 * 1024;
const deny = (status: number, error: string) => NextResponse.json({ success: false, error }, { status });

/** GET ?key= → redirects to /api/files (owner or staff). GET without key → listing (staff). */
export async function GET(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return deny(401, "Please sign in");
  if (viewer.role === "pending") return deny(403, "Please confirm your email first");
  try {
    const key = new URL(request.url).searchParams.get("key");
    // Files are served through /api/files on our own domain; no storage links are handed out.
    if (key) return NextResponse.redirect(new URL(`/api/files/${key.split("/").map(encodeURIComponent).join("/")}`, request.url));
    if (viewer.role !== "staff") return deny(403, "Staff only");
    const items = await listObjects();
    return NextResponse.json({
      success: true,
      items: items.map((i) => ({ key: i.Key, size: i.Size, lastModified: i.LastModified })),
    });
  } catch (error) {
    console.error("Storage GET error:", error);
    return deny(500, "Storage is unavailable right now");
  }
}

/** Upload into the signed-in client's own folder (staff may target any client). */
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return deny(401, "Please sign in");
  if (viewer.role === "pending") return deny(403, "Please confirm your email first");
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return deny(400, "No file provided");
    if (file.size > MAX_BYTES) return deny(413, "Files must be 25 MB or smaller");

    const clientId =
      viewer.role === "client" ? viewer.clientId : String(formData.get("clientId") || "").replace(/[^\w-]/g, "");
    if (!clientId) return deny(400, "Missing client");
    const category = String(formData.get("category") || "uploads").replace(/[^\w -]/g, "").slice(0, 60) || "uploads";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
    const key = `clients/${clientId}/${category}/${Date.now()}_${safeName}`;

    await uploadObject(key, Buffer.from(await file.arrayBuffer()), file.type || "application/octet-stream");
    return NextResponse.json({ success: true, key, name: file.name, size: file.size });
  } catch (error) {
    console.error("Storage POST error:", error);
    return deny(500, "Upload failed. Please try again.");
  }
}
