import "server-only";
import { cacheLife, cacheTag } from "next/cache";

/** Adept's calendar lives in Cal.com; the firm works in Calgary time (Mountain, observes DST). */
export const FIRM_TZ = "America/Edmonton";

const API = "https://api.cal.com/v2";

// Cal.com versions each endpoint separately.
const V = {
  eventTypes: "2024-06-14",
  slots: "2024-09-04",
  createBooking: "2026-02-25",
  cancelBooking: "2026-02-25",
  listBookings: "2026-05-01",
} as const;

export class CalError extends Error {}

async function cal<T>(
  path: string,
  version: string,
  init: { method?: string; body?: unknown; query?: Record<string, string | number | undefined> } = {},
): Promise<T> {
  const key = process.env.CAL_API;
  if (!key) throw new CalError("Cal.com is not configured (CAL_API missing)");
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(init.query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));

  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      "cal-api-version": version,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as { status?: string; data?: T; error?: { message?: string } };
  if (!res.ok || json.status === "error") {
    const message = json.error?.message || `Cal.com request failed (${res.status})`;
    throw new CalError(message);
  }
  return json.data as T;
}

export type EventType = { id: number; slug: string; title: string; length: number; description: string };

/** Public, bookable event types (hidden ones are excluded). Cached; changes rarely. */
export async function getEventTypes(): Promise<EventType[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("cal-event-types");
  type Raw = { id: number; slug: string; title: string; lengthInMinutes?: number; length?: number; description?: string; hidden?: boolean };
  const data = await cal<Raw[] | { eventTypeGroups: { eventTypes: Raw[] }[] }>("/event-types", V.eventTypes);
  const list = Array.isArray(data) ? data : data.eventTypeGroups.flatMap((g) => g.eventTypes);
  return list
    .filter((e) => !e.hidden)
    .map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      length: e.lengthInMinutes ?? e.length ?? 30,
      description: e.description ?? "",
    }))
    .sort((a, b) => a.length - b.length);
}

/** Open start times (ISO strings with offset), grouped by local date in `timeZone`. */
export async function getAvailability(eventTypeId: number, startDate: string, endDate: string, timeZone: string) {
  const data = await cal<Record<string, { start: string }[]>>("/slots", V.slots, {
    query: { eventTypeId, start: startDate, end: endDate, timeZone },
  });
  return Object.fromEntries(Object.entries(data).map(([day, slots]) => [day, slots.map((s) => s.start)]));
}

export type CalBooking = {
  uid: string;
  title: string;
  status: string;
  start: string;
  end: string;
  duration: number;
  location?: string;
  meetingUrl?: string;
  attendees: { name: string; email: string; timeZone?: string }[];
  eventTypeId?: number;
  metadata?: Record<string, string>;
};

export async function createBooking(input: {
  eventTypeId: number;
  start: string;
  attendee: { name: string; email: string; timeZone: string; phoneNumber?: string };
  notes?: string;
  metadata?: Record<string, string>;
}) {
  return cal<CalBooking>("/bookings", V.createBooking, {
    method: "POST",
    body: {
      eventTypeId: input.eventTypeId,
      start: new Date(input.start).toISOString(),
      attendee: { language: "en", ...input.attendee },
      bookingFieldsResponses: input.notes ? { notes: input.notes } : undefined,
      metadata: input.metadata,
    },
  });
}

export async function cancelBooking(uid: string, reason: string) {
  await cal(`/bookings/${encodeURIComponent(uid)}/cancel`, V.cancelBooking, {
    method: "POST",
    body: { cancellationReason: reason },
  });
}

export async function listBookings(status: "upcoming" | "past" | "cancelled", limit = 100) {
  const data = await cal<CalBooking[] | { bookings: CalBooking[] }>("/bookings", V.listBookings, {
    query: { status, limit, sortStart: "asc" },
  });
  return Array.isArray(data) ? data : (data.bookings ?? []);
}

export const meetingLink = (b: Pick<CalBooking, "location" | "meetingUrl" | "uid">) =>
  (b.location?.startsWith("http") ? b.location : b.meetingUrl) || `https://app.cal.com/booking/${b.uid}`;

/** Split an instant into the firm's local date + HH:MM for display/storage. */
export function firmDateTime(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: FIRM_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}
