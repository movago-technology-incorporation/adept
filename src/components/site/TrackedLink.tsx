"use client";

import Link from "next/link";
import { useApp } from "@/store/app-store";

export function TrackedLink({
  href,
  cta,
  className,
  children,
}: {
  href: string;
  cta: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { recordClick } = useApp();
  return (
    <Link href={href} className={className} onClick={() => recordClick(href, cta)}>
      {children}
    </Link>
  );
}
