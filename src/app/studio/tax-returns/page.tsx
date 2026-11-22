import { PageHeader, Stat } from "@/components/portal/Shell";
import { TaxReturnsTable } from "@/components/studio/TaxReturnsTable";
import { requirePageRole } from "@/lib/auth/viewer";
import { listAllReturns } from "@/lib/tax-return-server";

export const metadata = { title: "Tax returns" };

export default async function StudioTaxReturnsPage() {
  await requirePageRole("staff");
  const rows = await listAllReturns();
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  return (
    <>
      <PageHeader eyebrow="Delivery" title="Tax returns" description="Personal tax questionnaires submitted through the client portal." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Todo" value={count("submitted")} />
        <Stat label="In progress" value={count("in_progress")} />
        <Stat label="Done" value={count("done")} />
        <Stat label="Clients drafting" value={count("draft")} />
      </div>
      <TaxReturnsTable rows={rows} />
    </>
  );
}
