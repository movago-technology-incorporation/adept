"use client";

import { WorkspaceError } from "@/components/portal/States";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <WorkspaceError error={error} retry={retry} home="/client" />;
}
