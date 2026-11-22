import { PRIVATE_METADATA } from "@/lib/seo";
import { Suspense } from "react";
import { PortalShell, PortalSkeleton, type PortalGroup } from "@/components/portal/Shell";
import { requirePageRole } from "@/lib/auth/viewer";
import { getClientPortalData } from "@/lib/data";
import { AppProvider } from "@/store/app-store";


/** Private workspace: never indexed. */
export const metadata = PRIVATE_METADATA;
const groups: PortalGroup[] = [
  { title: "Home", links: [{ href: "/client", label: "Overview", icon: "home" }] },
  {
    title: "Work",
    links: [
      { href: "/client/tax-return", label: "Tax return", icon: "taxReturn" },
      { href: "/client/outstanding", label: "Outstanding", icon: "inbox" },
      { href: "/client/forms", label: "Forms", icon: "form" },
      { href: "/client/appointments", label: "Appointments", icon: "calendar" },
    ],
  },
  {
    title: "Files",
    links: [
      { href: "/client/documents", label: "Documents", icon: "file" },
      { href: "/client/receipts", label: "Receipts", icon: "receipt" },
      { href: "/client/tax", label: "Tax documents", icon: "tax" },
      { href: "/client/reports", label: "Reports", icon: "chart" },
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

  return (
    <AppProvider initial={data} clientId={viewer.clientId}>
      <PortalShell
        brand="Client portal"
        user={{ name: client?.name || viewer.name, detail: client?.company || viewer.email }}
        groups={groups}
      >
        {children}
      </PortalShell>
    </AppProvider>
  );
}
