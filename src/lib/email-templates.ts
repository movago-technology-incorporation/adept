import "server-only";
import type { Firm } from "./types";

// Branded, email-client-safe templates (tables + inline styles).
// Same language as the site: navy header, paper canvas, sand panels,
// pill buttons, serif headings — no borders, no shadows.

const C = {
  navy: "#0b1a2e",
  ink: "#142033",
  muted: "#5d6878",
  paper: "#f7f4ee",
  sand: "#efe9dd",
  gold: "#b8914a",
  goldSoft: "#ecdcb6",
  white: "#ffffff",
};
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'Source Sans 3', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const nl2br = (s: string) => esc(s).replace(/\r?\n/g, "<br>");

type Block =
  | { type: "text"; html: string }
  | { type: "details"; rows: [string, string][] }
  | { type: "quote"; text: string; label?: string }
  | { type: "steps"; items: string[] }
  | { type: "code"; code: string; note?: string }
  /** Pre-sanitized rich text (Studio composer). Never pass unsanitized input. */
  | { type: "html"; html: string };

export type EmailContent = {
  preheader: string;
  eyebrow: string;
  title: string;
  greeting?: string;
  intro: string; // plain text, may contain line breaks
  blocks?: Block[];
  cta?: { label: string; href: string };
  signoff?: string;
};

function renderBlock(b: Block) {
  if (b.type === "text") {
    return `<p style="margin:0 0 18px;font:16px/1.65 ${SANS};color:${C.ink};">${b.html}</p>`;
  }
  if (b.type === "details") {
    const rows = b.rows
      .filter(([, v]) => v)
      .map(
        ([k, v], i, all) => `<tr>
          <td style="padding:${i === 0 ? "18px" : "6px"} 22px ${i === all.length - 1 ? "18px" : "6px"};font:13px/1.5 ${SANS};color:${C.muted};width:38%;vertical-align:top;">${esc(k)}</td>
          <td style="padding:${i === 0 ? "18px" : "6px"} 22px ${i === all.length - 1 ? "18px" : "6px"} 0;font:600 15px/1.5 ${SANS};color:${C.navy};vertical-align:top;">${v}</td>
        </tr>`,
      )
      .join("");
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:${C.sand};border-radius:18px;margin:4px 0 22px;">${rows}</table>`;
  }
  if (b.type === "quote") {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};border-radius:18px;margin:4px 0 22px;">
      <tr><td style="padding:20px 22px;">
        ${b.label ? `<p style="margin:0 0 8px;font:600 11px/1 ${SANS};letter-spacing:.16em;text-transform:uppercase;color:${C.gold};">${esc(b.label)}</p>` : ""}
        <p style="margin:0;font:16px/1.65 ${SANS};color:${C.ink};">${nl2br(b.text)}</p>
      </td></tr></table>`;
  }
  if (b.type === "html") {
    return `<div style="font:16px/1.65 ${SANS};color:${C.ink};">${b.html}</div>`;
  }
  if (b.type === "code") {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.sand};border-radius:18px;margin:4px 0 22px;">
      <tr><td align="center" style="padding:26px 16px;">
        <p style="margin:0;font:700 36px/1.1 'SFMono-Regular',Menlo,Consolas,monospace;letter-spacing:.32em;color:${C.navy};">${esc(b.code)}</p>
        ${b.note ? `<p style="margin:10px 0 0;font:13px/1.5 ${SANS};color:${C.muted};">${esc(b.note)}</p>` : ""}
      </td></tr></table>`;
  }
  const items = b.items
    .map(
      (t, i) => `<tr>
        <td style="padding:0 14px 14px 0;vertical-align:top;width:28px;">
          <div style="width:28px;height:28px;border-radius:14px;background:${C.navy};color:${C.goldSoft};font:600 13px/28px ${SANS};text-align:center;">${i + 1}</div>
        </td>
        <td style="padding:3px 0 14px;font:15px/1.55 ${SANS};color:${C.ink};vertical-align:top;">${esc(t)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 12px;">${items}</table>`;
}

export function renderEmail(content: EmailContent, firm?: Firm | null, logoUrl = "/logo-email.png") {
  const f = firm ?? null;
  const cta = content.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 26px;">
        <tr><td style="border-radius:999px;background:${C.navy};">
          <a href="${esc(content.cta.href)}" style="display:inline-block;padding:15px 30px;font:600 15px/1 ${SANS};color:${C.white};text-decoration:none;border-radius:999px;">${esc(content.cta.label)}</a>
        </td></tr></table>`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${esc(content.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">
<style>
  @media (max-width:620px){ .px{padding-left:24px!important;padding-right:24px!important} .h1{font-size:32px!important} }
  a{color:${C.navy}}
</style>
</head>
<body style="margin:0;padding:0;background:${C.paper};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.paper};">${esc(content.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
    <tr><td style="background:${C.navy};border-radius:28px 28px 0 0;padding:28px 44px;" class="px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:${C.white};border-radius:14px;padding:10px 16px;">
        <img src="${esc(logoUrl)}" width="150" height="51" alt="Adept Bookkeeping and Tax Services" style="display:block;width:150px;height:auto;border:0;outline:none;text-decoration:none;">
      </td></tr></table>
    </td></tr>
    <tr><td style="background:${C.white};padding:40px 44px 14px;" class="px">
      <p style="margin:0 0 12px;font:600 11px/1 ${SANS};letter-spacing:.18em;text-transform:uppercase;color:${C.gold};">${esc(content.eyebrow)}</p>
      <h1 class="h1" style="margin:0 0 22px;font:700 38px/1.1 ${SERIF};color:${C.navy};letter-spacing:-.01em;">${esc(content.title)}</h1>
      ${content.greeting ? `<p style="margin:0 0 14px;font:16px/1.65 ${SANS};color:${C.ink};">${esc(content.greeting)}</p>` : ""}
      ${content.intro ? `<p style="margin:0 0 22px;font:16px/1.65 ${SANS};color:${C.ink};">${nl2br(content.intro)}</p>` : ""}
      ${(content.blocks ?? []).map(renderBlock).join("")}
      ${cta}
      <p style="margin:0 0 30px;font:16px/1.65 ${SANS};color:${C.ink};">${nl2br(content.signoff ?? "Warm regards,\nThe Adept team")}</p>
    </td></tr>
    <tr><td style="background:${C.sand};border-radius:0 0 28px 28px;padding:26px 44px 30px;" class="px">
      <p style="margin:0 0 6px;font:600 14px/1.5 ${SANS};color:${C.navy};">${esc(f?.name ?? "Adept Bookkeeping Services")}</p>
      <p style="margin:0;font:13px/1.7 ${SANS};color:${C.muted};">
        ${f ? `${esc(f.email)} · ${esc(f.phone)}<br>${esc(f.hours)}<br>${esc(f.city)}, ${esc(f.country)}` : ""}
      </p>
    </td></tr>
    <tr><td style="padding:20px 44px 0;font:12px/1.6 ${SANS};color:${C.muted};text-align:center;" class="px">
      You’re receiving this because you contacted or work with Adept Bookkeeping Services.
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    content.title,
    "",
    content.greeting ?? "",
    content.intro,
    ...(content.blocks ?? []).map((b) =>
      b.type === "details"
        ? b.rows
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}: ${v.replace(/<[^>]+>/g, "")}`)
            .join("\n")
        : b.type === "quote"
          ? `${b.label ? `${b.label}:\n` : ""}${b.text}`
          : b.type === "html"
            ? b.html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|h2|h3|li|blockquote)>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\n{3,}/g, "\n\n").trim()
            : b.type === "code"
            ? `Your code: ${b.code}${b.note ? `\n${b.note}` : ""}`
            : b.type === "steps"
            ? b.items.map((t, i) => `${i + 1}. ${t}`).join("\n")
            : b.html.replace(/<[^>]+>/g, ""),
    ),
    content.cta ? `${content.cta.label}: ${content.cta.href}` : "",
    "",
    content.signoff ?? "Warm regards,\nThe Adept team",
    "",
    f ? `${f.name} · ${f.email} · ${f.phone}` : "",
  ]
    .filter((line, i, all) => !(line === "" && all[i - 1] === ""))
    .join("\n");

  return { html, text };
}

// ── Templates ──────────────────────────────────────────────────────────

const first = (name: string) => name.trim().split(/\s+/)[0] || "there";

export const templates = {
  welcome: (p: { name: string; portalUrl: string }) => ({
    subject: "Welcome to your Adept client portal",
    content: {
      preheader: "Your secure portal is ready — here’s how to get started.",
      eyebrow: "Welcome",
      title: "Your client portal is ready",
      greeting: `Hi ${first(p.name)},`,
      intro:
        "Thanks for creating your Adept account. Your secure portal is where you’ll share documents, see what we need from you, and book time with your bookkeeper.",
      blocks: [
        {
          type: "steps" as const,
          items: [
            "Upload bank statements, slips and receipts — they go straight to your private folder.",
            "Check “Outstanding” for anything we’re waiting on.",
            "Book a meeting or send us a message whenever you need us.",
          ],
        },
      ],
      cta: { label: "Open your portal", href: p.portalUrl },
    },
  }),

  enquiryReceived: (p: { name: string; interest: string; message: string; kind: "contact" | "filing" }) => ({
    subject: p.kind === "filing" ? "We’ve received your tax filing request" : "Thanks for contacting Adept",
    content: {
      preheader: "We’ll be in touch within one business day.",
      eyebrow: p.kind === "filing" ? "Tax filing request" : "Message received",
      title: p.kind === "filing" ? "Your filing request is in" : "Thanks for reaching out",
      greeting: `Hi ${first(p.name)},`,
      intro:
        p.kind === "filing"
          ? "We’ve received your tax filing request. A coordinator will email you with next steps and a secure way to send your documents. Returns are processed by due date, then first come, first served."
          : "Thanks for getting in touch with Adept Bookkeeping Services. A member of our team will reply within one business day.",
      blocks: [
        { type: "details" as const, rows: [[p.kind === "filing" ? "Return type" : "Starting point", esc(p.interest)]] as [string, string][] },
        ...(p.message ? [{ type: "quote" as const, label: "Your message", text: p.message }] : []),
        { type: "text" as const, html: "If anything is urgent, just reply to this email." },
      ],
    },
  }),

  bookingConfirmed: (p: { name: string; topic: string; when: string; duration?: number; meetingUrl: string }) => ({
    subject: `Confirmed: ${p.topic} with Adept`,
    content: {
      preheader: `${p.when} — your video link is inside.`,
      eyebrow: "Booking confirmed",
      title: "You’re booked in",
      greeting: `Hi ${first(p.name)},`,
      intro: "Your session with Adept is confirmed. Join from any device using the link below — no download needed.",
      blocks: [
        {
          type: "details" as const,
          rows: [
            ["Topic", esc(p.topic)],
            ["When", esc(p.when)],
            ["Length", p.duration ? `${p.duration} minutes` : ""],
            ["Where", "Video call"],
          ] as [string, string][],
        },
        {
          type: "text" as const,
          html: "Have documents we should look at first? Reply to this email or upload them in your client portal before the call.",
        },
      ],
      cta: { label: "Join video call", href: p.meetingUrl },
    },
  }),

  followUp: (p: { name: string; subject: string; body: string; signature: string }) => ({
    subject: p.subject,
    content: {
      preheader: p.body.slice(0, 110),
      eyebrow: "Adept Bookkeeping Services",
      title: p.subject,
      greeting: `Hi ${first(p.name)},`,
      intro: p.body,
      signoff: `Best regards,\n${p.signature}`,
    },
  }),

  /** Free-form email written by staff in Studio. `html` must already be sanitized. */
  staffMessage: (p: { subject: string; html: string; preheader: string; signature: string }) => ({
    subject: p.subject,
    content: {
      preheader: p.preheader,
      eyebrow: "Adept Bookkeeping Services",
      title: p.subject,
      intro: "",
      blocks: [{ type: "html" as const, html: p.html }],
      signoff: `Best regards,\n${p.signature}`,
    },
  }),

  taxReturnReceived: (p: { name: string; year: number; portalUrl: string }) => ({
    subject: `We’ve received your ${p.year} tax return information`,
    content: {
      preheader: `Your ${p.year} personal tax questionnaire is in. Here’s what happens next.`,
      eyebrow: "Tax return submitted",
      title: `Your ${p.year} return is with us`,
      greeting: `Hi ${first(p.name)},`,
      intro: `Thank you — we’ve received your ${p.year} personal income tax questionnaire and supporting documents.`,
      blocks: [
        {
          type: "steps" as const,
          items: [
            "We review your answers and documents, and message you in your portal if anything is missing.",
            "We prepare your return and send it to you for review and signing.",
            "Once you approve it, we file with the CRA and upload your copy to your portal.",
          ],
        },
        { type: "text" as const, html: "Returns are processed by due date, then first come, first served. Personal invoices are paid in full before filing." },
      ],
      cta: { label: "Open your portal", href: p.portalUrl },
    },
  }),

  taxReturnCompleted: (p: { name: string; year: number; portalUrl: string; reviewUrl: string; attached?: boolean }) => ({
    subject: `Your ${p.year} tax return is complete`,
    content: {
      preheader: `Good news: we’ve finished your ${p.year} personal tax return. A quick review would mean a lot.`,
      eyebrow: "Tax return complete",
      title: `Your ${p.year} return is done`,
      greeting: `Hi ${first(p.name)},`,
      intro: `Good news: we’ve completed your ${p.year} personal income tax return. Thank you for trusting Adept with it.`,
      blocks: [
        {
          type: "steps" as const,
          items: [
            p.attached
              ? "A PDF copy of your return is attached to this email, and saved in your client portal."
              : "Your copy of the return and any CRA confirmations will be in your client portal.",
            "Keep an eye out for your Notice of Assessment from the CRA, usually within a few weeks.",
            "If the CRA contacts you or anything changes, message us in your portal and we’ll take care of it.",
          ],
        },
        {
          type: "text" as const,
          html: `<a href="${p.portalUrl}" style="color:#0b1a2e;font-weight:600;">Open your client portal</a> to see your documents and messages.`,
        },
        {
          type: "quote" as const,
          text: "Thank you for trusting Adept. If we made tax season lighter, a quick Google review helps others find us.",
        },
      ],
      cta: { label: "Write a review", href: p.reviewUrl },
    },
  }),

  proposalReady: (p: { name: string; url: string; packageName: string; fee: string; preparedBy: string }) => ({
    subject: "Your bookkeeping proposal from Adept",
    content: {
      preheader: `Your ${p.packageName} bookkeeping proposal is ready to review.`,
      eyebrow: "Your proposal",
      title: "Your bookkeeping proposal is ready",
      greeting: `Hi ${first(p.name)},`,
      intro: `Thank you for our conversation. I’ve put together a bookkeeping proposal based on what we discussed, along with the engagement letter.`,
      blocks: [
        { type: "details" as const, rows: [["Recommended package", esc(p.packageName)], ["Monthly fee", `${esc(p.fee)} + applicable taxes`]] as [string, string][] },
        {
          type: "steps" as const,
          items: ["Review the proposal.", "Accept it, or ask for changes.", "Sign the engagement letter online, and we’ll send your portal invitation."],
        },
        { type: "text" as const, html: `Questions? Just reply to this email.<br/>${esc(p.preparedBy)}` },
      ],
      cta: { label: "Review your proposal", href: p.url },
    },
  }),

  proposalSigned: (p: { name: string; business: string }) => ({
    subject: "Welcome to Adept: your signed engagement letter",
    content: {
      preheader: "Thank you for signing. Your proposal and engagement letter are attached.",
      eyebrow: "You’re all set",
      title: "Welcome to Adept",
      greeting: `Hi ${first(p.name)},`,
      intro: `Thank you for choosing Adept for ${p.business}. A copy of your signed proposal and engagement letter is attached for your records.`,
      blocks: [
        {
          type: "steps" as const,
          items: [
            "Watch for a separate email inviting you to your secure client portal.",
            "Complete the agreed initial payment/retainer.",
            "Connect QuickBooks Online and grant Adept accountant access.",
            "Upload your opening documents in the portal. Your onboarding checklist is waiting there.",
          ],
        },
      ],
    },
  }),

  portalInvite: (p: { name: string; url: string; expires: string; business: boolean }) => ({
    subject: "Your invitation to the Adept client portal",
    content: {
      preheader: `Set up your secure Adept portal account. This link works until ${p.expires}.`,
      eyebrow: "You’re invited",
      title: "Set up your client portal",
      greeting: `Hi ${first(p.name)},`,
      intro: p.business
        ? "We’ve set up a secure workspace for your business. Create your login to upload bank statements, receipts and records, work through your monthly checklist and message our team."
        : "We’ve set up a secure client portal for you. Create your login to upload your documents, track what’s outstanding and message our team.",
      blocks: [
        {
          type: "steps" as const,
          items: ["Click the button below.", "Choose a password (your email is already filled in).", "You’re in. Start uploading or check your checklist."],
        },
        { type: "text" as const, html: `This link is just for you and works until <strong>${esc(p.expires)}</strong>. If it expires, reply to this email and we’ll send a new one.` },
      ],
      cta: { label: "Create my account", href: p.url },
    },
  }),

  verifyAccount: (p: { name: string; code: string; minutes: number }) => ({
    subject: `${p.code} is your Adept verification code`,
    content: {
      preheader: `Your code is ${p.code}. It expires in ${p.minutes} minutes.`,
      eyebrow: "Confirm your email",
      title: "Activate your account",
      greeting: `Hi ${first(p.name)},`,
      intro: "Thanks for creating your Adept client portal account. Enter this code to confirm your email and activate your account:",
      blocks: [
        { type: "code" as const, code: p.code, note: `Expires in ${p.minutes} minutes` },
        { type: "text" as const, html: "If you didn’t create an account, you can safely ignore this email — nothing will be activated." },
      ],
    },
  }),

  accountDeleted: (p: { name: string }) => ({
    subject: "Your Adept account has been deleted",
    content: {
      preheader: "Your client portal account and files have been removed.",
      eyebrow: "Account closed",
      title: "Your account has been deleted",
      greeting: `Hi ${first(p.name)},`,
      intro:
        "As requested, we’ve deleted your Adept client portal account, the documents you uploaded, your messages and any upcoming appointments.\n\nIf this wasn’t you, or you’d like to work with us again, just reply to this email.",
      signoff: "Thank you for working with us,\nThe Adept team",
    },
  }),

  adminAlert: (p: { title: string; summary: string; rows: [string, string][]; message?: string; link?: string }) => ({
    subject: `[Adept] ${p.title}`,
    content: {
      preheader: p.summary,
      eyebrow: "Studio alert",
      title: p.title,
      intro: p.summary,
      blocks: [
        { type: "details" as const, rows: p.rows.map(([k, v]) => [k, esc(v)] as [string, string]) },
        ...(p.message ? [{ type: "quote" as const, label: "Message", text: p.message }] : []),
      ],
      cta: p.link ? { label: "Open in Studio", href: p.link } : undefined,
      signoff: "— Adept Studio",
    },
  }),
};
