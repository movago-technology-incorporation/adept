"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { moreLinks, nav } from "@/data/content";
import { DropdownMenu } from "@/components/ui/Dropdown";
import { ButtonLink, cx } from "@/components/ui/kit";
import { useApp } from "@/store/app-store";

export function Header() {
  const pathname = usePathname();
  const { recordClick } = useApp();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={cx("sticky top-0 z-40 transition-colors", scrolled ? "bg-white" : "bg-paper")}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 sm:h-24 sm:px-8">
        <Link href="/" className="shrink-0" onClick={() => recordClick("/", "Logo")} aria-label="Adept Bookkeeping Services home">
          <Image src="/adept-logo.png" alt="Adept Bookkeeping Services" width={1364} height={608} className="h-14 w-auto sm:h-[72px]" priority unoptimized />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 text-[15px] text-navy lg:flex">
          {nav.map((item) =>
            item.children ? (
              <DropdownMenu
                key={item.label}
                label={item.label}
                active={isActive(item.href)}
                triggerClassName="rounded-full px-3.5 py-2 hover:bg-sand"
                items={[
                  { href: item.href, label: "All Tax Services" },
                  ...item.children.map((child) => ({
                    href: child.href,
                    label: child.label,
                    onSelect: () => recordClick(child.href, child.label),
                  })),
                ]}
              />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cx("rounded-full px-3.5 py-2 transition-colors hover:bg-sand", isActive(item.href) && "text-gold-deep")}
                onClick={() => recordClick(item.href, item.label)}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Client login
          </ButtonLink>
          <ButtonLink href="/book" size="sm" onClick={() => recordClick("/book", "Header · Book a free consultation")}>
            Book a free consultation
          </ButtonLink>
        </div>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full bg-sand text-navy lg:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-navy text-white lg:hidden" role="dialog" aria-modal="true">
          <div className="flex h-20 items-center justify-between px-5">
            <Image src="/adept-logo.png" alt="Adept" width={1364} height={608} className="h-12 w-auto brightness-0 invert" unoptimized />
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/10"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav aria-label="Mobile" className="grid gap-1 px-5 pb-8">
            {nav.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="serif block rounded-2xl px-3 py-3 text-3xl hover:bg-white/8"
                >
                  {item.label}
                </Link>
                {item.children ? (
                  <div className="mb-2 grid gap-0.5 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpen(false)}
                        className="rounded-xl px-3 py-2 text-white/70 hover:bg-white/8 hover:text-white"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <div className="mt-4 grid gap-0.5">
              {moreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 text-white/70 hover:bg-white/8 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
          <div className="mt-auto grid gap-2 p-5">
            <ButtonLink href="/book" variant="gold" size="lg" onClick={() => setOpen(false)}>
              Book a free consultation
            </ButtonLink>
            <ButtonLink href="/login" variant="light" size="lg" onClick={() => setOpen(false)}>
              Client login
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
