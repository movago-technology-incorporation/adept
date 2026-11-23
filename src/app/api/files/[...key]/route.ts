import { getViewer } from "@/lib/auth/viewer";
import { getObjectStream } from "@/lib/storage";

/**
 * Private files, served from Adept's own domain. Clients can open only their own folder; staff can open any.
 * The browser never sees the storage provider's address or signed links.
 */
export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const viewer = await getViewer();
  if (!viewer || viewer.role === "pending") return new Response("Please sign in", { status: 401 });
  const key = (await params).key.map(decodeURIComponent).join("/");
  if (!key.startsWith("clients/") || key.includes("..")) return new Response("Not found", { status: 404 });
  if (viewer.role === "client" && !key.startsWith(`clients/${viewer.clientId}/`)) return new Response("Not found", { status: 404 });

  try {
    const file = await getObjectStream(key);
    // Stored names look like "1795442600616_Name.pdf"; show the original name.
    const name = (key.split("/").pop() ?? "file").replace(/^\d+_/, "");
    const download = new URL(request.url).searchParams.has("download");
    return new Response(file.body, {
      headers: {
        "Content-Type": file.contentType,
        ...(file.length ? { "Content-Length": String(file.length) } : {}),
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
