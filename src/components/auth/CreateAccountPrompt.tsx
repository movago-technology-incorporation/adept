import Link from "next/link";
import { CalendarCheck, FolderLock, MessagesSquare, ListChecks, UserPlus } from "lucide-react";
import { buttonClass } from "@/components/ui/kit";

const PERKS = [
  { icon: ListChecks, text: "Track your request and see what we need from you" },
  { icon: FolderLock, text: "Upload documents and receipts securely" },
  { icon: MessagesSquare, text: "Message your bookkeeper in one private thread" },
  { icon: CalendarCheck, text: "Book, join and manage your appointments" },
];

/** Shown after a contact request or booking: invite the person to open a portal account. */
export function CreateAccountPrompt({ name, email }: { name?: string; email?: string }) {
  const q = new URLSearchParams({ mode: "signup", ...(email ? { email } : {}), ...(name ? { name } : {}) }).toString();
  return (
    <div className="rounded-3xl bg-navy p-7 text-left text-white sm:p-9">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold text-navy">
        <UserPlus className="h-5 w-5" />
      </span>
      <h3 className="serif mt-5 text-3xl leading-tight font-semibold">Get everything in one place</h3>
      <p className="mt-2 text-white/70">Create your free Adept client account — it takes under a minute.</p>
      <ul className="mt-6 grid gap-3">
        {PERKS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-sm text-white/85">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold-soft" />
            {text}
          </li>
        ))}
      </ul>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link href={`/login?${q}`} className={buttonClass("gold", "lg")}>
          <UserPlus className="h-5 w-5" />
          Create your free account
        </Link>
        <Link href={`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`} className={buttonClass("light", "lg")}>
          I already have one
        </Link>
      </div>
    </div>
  );
}
