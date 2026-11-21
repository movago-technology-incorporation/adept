import { auth } from "@/lib/auth/server";

// Signed-out visitors can browse the marketing site and book; everything else
// (Studio, client portal, file storage, ops endpoints) requires a session.
// Role checks (staff vs client) happen in the layouts and server actions.
export default auth.middleware({
  loginUrl: "/login",
  publicRoutes: [
    "/",
    "/about",
    "/bookkeeping",
    "/tax",
    "/payroll",
    "/services",
    "/testimonials",
    "/book",
    "/contact",
    "/login",
    "/portal",
    "/logo.png",
    "/logo-email.png",
    "/api/cron",
  ],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
