import { PRIVATE_METADATA } from "@/lib/seo";
import { Suspense } from "react";
import { after } from "next/server";
import { processDueFollowUps } from "@/lib/notify";
import { PortalShell, PortalSkeleton, type PortalGroup } from "@/components/portal/Shell";
import { requirePageRole } from "@/lib/auth/viewer";
import { getStudioData } from "@/lib/data";
import { AppProvider } from "@/store/app-store";


/** Private workspace: never indexed. */
export const metadata = PRIVATE_METADATA;
const groups: PortalGroup[] = [
  { title: "Desk", links: [{ href: "/studio", label: "Overview", icon: "home" }] },
  {
    title: "Pipeline",
    links: [
      { href: "/studio/leads", label: "Leads", icon: "users" },
      { href: "/studio/follow-up", label: "Follow-up", icon: "send" },
      { href: "/studio/clicks", label: "Click trail", icon: "click" },
    ],
  },
  {
    title: "Communication",
    links: [{ href: "/studio/email", label: "Email", icon: "mail" }],
  },
  {
    title: "Delivery",
    links: [
      { href: "/studio/calendar", label: "Calendar", icon: "calendar" },
      { href: "/studio/tax-returns", label: "Tax returns", icon: "taxReturn" },
      { href: "/studio/proposals", label: "Proposals", icon: "file" },
      { href: "/studio/clients", label: "Clients", icon: "folder" },
    ],
  },
  {
    title: "Reputation",
    links: [
      { href: "/studio/reputation", label: "Reviews", icon: "star" },
      { href: "/studio/testimonials", label: "Testimonials", icon: "chat" },
    ],
  },
  {
    title: "Admin",
    links: [
      { href: "/studio/settings", label: "Settings", icon: "settings" },
    ],
  },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PortalSkeleton />}>
      <StudioData>{children}</StudioData>
    </Suspense>
  );
}

/** Staff only. Loads the live pipeline and delivery data from Neon on each request. */
async function StudioData({ children }: { children: React.ReactNode }) {
  const viewer = await requirePageRole("staff");
  const data = await getStudioData();
  // Safety net alongside the cron: deliver any follow-ups that have come due.
  after(() => processDueFollowUps().catch((err) => console.error("Follow-up run failed:", err)));
  return (
    <AppProvider initial={{ ...data, viewer: { name: viewer.name, email: viewer.email } }}>
      <PortalShell brand="Studio" user={{ name: viewer.name, detail: viewer.email }} groups={groups}>
        {children}
      </PortalShell>
    </AppProvider>
  );
}
