import { Suspense } from "react";
import { pageMeta } from "@/lib/seo";
import { AskForm } from "@/components/site/AskForm";
import { Container } from "@/components/ui/kit";

export const metadata = {
  ...pageMeta({
    title: "Ask a Question",
    description: "Send Adept a quick question about your taxes or bookkeeping and get an answer within one business day.",
    path: "/ask",
  }),
  robots: { index: false, follow: true },
};

export default function AskPage() {
  return (
    <section className="bg-paper">
      <Container className="py-16 sm:py-24">
        <Suspense fallback={<div className="mx-auto h-[560px] max-w-xl animate-pulse rounded-3xl bg-white" />}>
          <AskForm />
        </Suspense>
      </Container>
    </section>
  );
}
