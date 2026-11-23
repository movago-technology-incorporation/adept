"use server";

import { headers } from "next/headers";
import { requireStaff } from "@/lib/auth/viewer";
import { normalizeDetails, type ProposalDetails } from "@/lib/proposal-template";
import { decide, finishSignedPaperwork, getClientProposal, recordDecision, saveDetails, sendToClient, sign, signProposal } from "@/lib/proposals-server";
import { requireSignedIn } from "@/lib/auth/viewer";

// ── Studio ─────────────────────────────────────────────────────────────

export async function saveProposalDetails(id: string, details: ProposalDetails) {
  await requireStaff();
  const ok = await saveDetails(id, normalizeDetails(details));
  return ok ? { ok: true as const } : { ok: false as const, error: "This proposal is already signed and can’t be edited." };
}

export async function emailProposal(id: string, details: ProposalDetails) {
  await requireStaff();
  return sendToClient(id, normalizeDetails(details));
}


export async function retrySignedPdf(id: string) {
  await requireStaff();
  return finishSignedPaperwork(String(id));
}

// ── Client (private link, no login) ────────────────────────────────────

export async function respondToProposal(token: string, decision: "changes" | "declined", note: string) {
  if (decision !== "changes" && decision !== "declined") return { ok: false as const, error: "Unknown answer." };
  if (decision === "changes" && !note.trim()) return { ok: false as const, error: "Tell us what you’d like changed." };
  return recordDecision(String(token), decision, String(note ?? "").trim());
}

export async function acceptAndSign(token: string, name: string, agreed: boolean) {
  const signer = String(name ?? "").trim().slice(0, 120);
  if (signer.length < 2) return { ok: false as const, error: "Type your full name to sign." };
  if (!agreed) return { ok: false as const, error: "Please confirm you agree to the engagement letter." };
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return signProposal(String(token), signer, { ip, agent: h.get("user-agent") ?? "" });
}

// ── Client (signed in to the portal) ───────────────────────────────────

async function ownProposal(id: string) {
  const viewer = await requireSignedIn();
  if (viewer.role !== "client") throw new Error("Clients only");
  return getClientProposal(viewer.clientId, String(id));
}

export async function respondToMyProposal(id: string, decision: "changes" | "declined", note: string) {
  if (decision !== "changes" && decision !== "declined") return { ok: false as const, error: "Unknown answer." };
  if (decision === "changes" && !note.trim()) return { ok: false as const, error: "Tell us what you’d like changed." };
  return decide(await ownProposal(id), decision, String(note ?? "").trim());
}

export async function signMyProposal(id: string, name: string, agreed: boolean) {
  const signer = String(name ?? "").trim().slice(0, 120);
  if (signer.length < 2) return { ok: false as const, error: "Type your full name to sign." };
  if (!agreed) return { ok: false as const, error: "Please confirm you agree to the engagement letter." };
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return sign(await ownProposal(id), signer, { ip, agent: h.get("user-agent") ?? "" });
}
