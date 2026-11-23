import { PRIVATE_METADATA } from "@/lib/seo";
import { Suspense } from "react";
import { PortalShell, PortalSkeleton, type PortalGroup } from "@/components/portal/Shell";
import { requirePageRole } from "@/lib/auth/viewer";
import { getClientPortalData } from "@/lib/data";
import { AppProvider } from "@/store/app-store";
import { db } from "@/lib/db";
import { isBusiness, usesPersonalReturn } from "@/lib/client-kind";


/** Private workspace: never indexed. */
export const metadata = PRIVATE_METADATA;
/** Businesses get the monthly checklist and bookkeeping uploads; corporations skip the personal (T1) questionnaire. */
function groupsFor(type: string | undefined, hasChecklist: boolean): PortalGroup[] {
  const business = isBusiness(type);
  return [
    { title: "Home", links: [{ href: "/client", label: "Overview", icon: "home" }] },
    {
      title: "Work",
      links: [
        ...(business || hasChecklist ? [{ href: "/client/checklist", label: "Monthly checklist", icon: "checklist" as const }] : []),
        ...(usesPersonalReturn(type) ? [{ href: "/client/tax-return", label: "Tax return", icon: "taxReturn" as const }] : []),
        { href: "/client/proposals", label: "Proposals", icon: "agreement" },
        { href: "/client/outstanding", label: "Outstanding", icon: "inbox" },
        { href: "/client/forms", label: "Forms", icon: "form" },
        { href: "/client/appointments", label: "Appointments", icon: "calendar" },
      ],
    },
    {
      title: "Files",
      links: [
        { href: "/client/documents", label: business ? "Bookkeeping uploads" : "Documents", icon: "file" },
        { href: "/client/receipts", label: "Receipts", icon: "receipt" },
        { href: "/client/tax", label: "Tax documents", icon: "tax" },
        { href: "/client/reports", label: "Reports", icon: "chart" },
        { href: "/client/agreements", label: "Agreements", icon: "agreement" },
      ],
    },
    {
      title: "Support",
      links: [
        { href: "/client/messages", label: "Messages", icon: "chat" },
        { href: "/client/account", label: "Account", icon: "user" },
      ],
    },
  ];
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PortalSkeleton />}>
      <ClientData>{children}</ClientData>
    </Suspense>
  );
}

/** Clients only. Loads just the signed-in client's own records from Neon. */
async function ClientData({ children }: { children: React.ReactNode }) {
  const viewer = await requirePageRole("client");
  const data = await getClientPortalData(viewer.clientId);
  const client = data.clients[0];
  const [{ n }] = await db()`SELECT count(*)::int AS n FROM checklist_items WHERE client_id = ${viewer.clientId}`;

  return (
    <AppProvider initial={data} clientId={viewer.clientId}>
      <PortalShell
        brand="Client portal"
        user={{ name: client?.name || viewer.name, detail: client?.company || viewer.email }}
        groups={groupsFor(client?.type, n > 0)}
      >
        {children}
      </PortalShell>
    </AppProvider>
  );
}
