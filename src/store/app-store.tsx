"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import * as actions from "@/app/actions";
import type { BookMeetingInput, BookMeetingResult, StaffEmailInput, StaffEmailResult } from "@/app/actions";
import type {
  Appointment,
  ClickEvent,
  Client,
  Firm,
  DocumentFile,
  FollowUp,
  FormTask,
  Job,
  Lead,
  Proposal,
  StaffEmail,
  Testimonial,
  ThreadMessage,
} from "@/lib/types";

/** Data loaded from Neon on the server and handed to the provider. */
export type AppData = {
  leads: Lead[];
  clients: Client[];
  documents: DocumentFile[];
  forms: FormTask[];
  messages: ThreadMessage[];
  appointments: Appointment[];
  proposals: Proposal[];
  jobs: Job[];
  followUps: FollowUp[];
  clicks: ClickEvent[];
  testimonials: Testimonial[];
  staffEmails: StaffEmail[];
  firm?: Firm;
  viewer?: { name: string; email: string };
};

type AppState = AppData & {
  /** The client whose portal is open (client workspace only). */
  clientId?: string;
  syncError: string | null;
  recordClick: (page: string, cta: string) => Promise<void>;
  addLead: (lead: Lead) => Promise<void>;
  updateLead: (id: string, patch: Partial<Lead>) => Promise<void>;
  addDocument: (doc: DocumentFile) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  addMessage: (body: string, author: ThreadMessage["author"], forClientId?: string) => Promise<void>;
  completeForm: (id: string) => Promise<void>;
  bookMeeting: (input: BookMeetingInput) => Promise<BookMeetingResult>;
  cancelMeeting: (id: string) => Promise<void>;
  completeMeeting: (id: string, summary: string) => Promise<void>;
  addProposal: (proposal: Proposal) => Promise<void>;
  sendProposal: (id: string) => Promise<void>;
  acceptProposal: (id: string) => Promise<void>;
  addJob: (job: Job) => Promise<void>;
  completeJob: (id: string) => Promise<void>;
  remindReview: (id: string) => Promise<void>;
  addFollowUp: (item: FollowUp) => Promise<void>;
  sendFollowUp: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  updateFollowUp: (id: string, patch: Partial<FollowUp>) => Promise<void>;
  deleteFollowUp: (id: string) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addClient: (client: Client) => Promise<{ ok: true } | { ok: false; error: string }>;
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  updateProposal: (id: string, patch: Partial<Proposal>) => Promise<void>;
  deleteProposal: (id: string) => Promise<void>;
  sendStaffEmail: (input: StaffEmailInput) => Promise<StaffEmailResult>;
  addTestimonial: (item: Testimonial) => Promise<void>;
  updateTestimonial: (id: string, patch: Partial<Testimonial>) => Promise<void>;
  deleteTestimonial: (id: string) => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);

function stamp() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

const empty: AppData = {
  leads: [],
  clients: [],
  documents: [],
  forms: [],
  messages: [],
  appointments: [],
  proposals: [],
  jobs: [],
  followUps: [],
  clicks: [],
  testimonials: [],
  staffEmails: [],
};

export function AppProvider({
  children,
  initial,
  clientId,
}: {
  children: ReactNode;
  initial: Partial<AppData>;
  clientId?: string;
}) {
  const seed = { ...empty, ...initial };
  const [syncError, setSyncError] = useState<string | null>(null);
  const [leads, setLeads] = useState(seed.leads);
  const [clients, setClients] = useState(seed.clients);
  const [documents, setDocuments] = useState(seed.documents);
  const [forms, setForms] = useState(seed.forms);
  const [messages, setMessages] = useState(seed.messages);
  const [appointments, setAppointments] = useState(seed.appointments);
  const [proposals, setProposals] = useState(seed.proposals);
  const [jobs, setJobs] = useState(seed.jobs);
  const [followUps, setFollowUps] = useState(seed.followUps);
  const [clicks, setClicks] = useState(seed.clicks);
  const [testimonials, setTestimonials] = useState(seed.testimonials);
  const [staffEmails, setStaffEmails] = useState(seed.staffEmails);
  const firm = seed.firm;
  const viewer = seed.viewer;

  const value = useMemo<AppState>(() => {
    // Optimistic: local state updates immediately, then the change is written to Neon.
    async function persist(write: Promise<unknown>) {
      try {
        await write;
        setSyncError(null);
      } catch (err) {
        console.error("Failed to save to Neon:", err);
        setSyncError("Couldn’t save your last change. Please refresh and try again.");
      }
    }
    const patchRow =
      <T extends { id: string }>(set: React.Dispatch<React.SetStateAction<T[]>>) =>
      (id: string, patch: Partial<T>) =>
        set((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));

    return {
      clientId,
      syncError,
      leads,
      clients,
      documents,
      forms,
      messages,
      appointments,
      proposals,
      jobs,
      followUps,
      clicks,
      testimonials,
      staffEmails,
      firm,
      viewer,
      recordClick: (page, cta) => {
        const id = `ck_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        setClicks((prev) => [
          { id, at: stamp(), page, cta, referrer: "session", device: "This browser", city: "—" },
          ...prev,
        ]);
        return persist(actions.recordClick(id, page, cta));
      },
      addLead: (lead) => {
        setLeads((prev) => [lead, ...prev]);
        return persist(actions.createLead(lead));
      },
      updateLead: (id, patch) => {
        patchRow(setLeads)(id, patch);
        return persist(actions.updateLead(id, patch));
      },
      addDocument: (doc) => {
        setDocuments((prev) => [doc, ...prev]);
        return persist(actions.createDocument(doc));
      },
      deleteDocument: async (id) => {
        const removed = documents.find((d) => d.id === id);
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        const result = await actions
          .deleteDocument(id)
          .catch((): { ok: false; error: string } => ({ ok: false, error: "Couldn’t delete the document. Please try again." }));
        if (!result.ok) {
          if (removed) setDocuments((prev) => [removed, ...prev]);
          setSyncError(result.error);
        }
      },
      addMessage: (body, author, forClientId) => {
        const target = forClientId ?? clientId;
        if (!target) return Promise.resolve();
        const msg = { id: `m_${Date.now()}`, clientId: target, author, body, at: stamp() };
        setMessages((prev) => [...prev, msg]);
        return persist(actions.createMessage(msg));
      },
      completeForm: (id) => {
        patchRow(setForms)(id, { status: "completed" });
        return persist(actions.completeForm(id));
      },
      bookMeeting: async (input) => {
        // Not optimistic: Cal.com confirms the slot and returns the video link.
        const result = await actions.bookMeeting(input).catch(
          (): BookMeetingResult => ({ ok: false, error: "We couldn’t reach the calendar. Please try again." }),
        );
        if (result.ok) {
          const apt = result.appointment;
          setAppointments((prev) => [apt, ...prev.filter((a) => a.id !== apt.id)]);
          if (apt.leadId) patchRow(setLeads)(apt.leadId, { status: "consult booked" });
        }
        return result;
      },
      cancelMeeting: (id) => {
        patchRow(setAppointments)(id, { status: "cancelled" });
        return persist(actions.cancelMeeting(id));
      },
      completeMeeting: (id, summary) => {
        const notes = "AI notes captured from the session.";
        patchRow(setAppointments)(id, { status: "completed", summary, notes });
        return persist(actions.completeMeeting(id, summary, notes));
      },
      addProposal: (proposal) => {
        setProposals((prev) => [proposal, ...prev]);
        return persist(actions.createProposal(proposal));
      },
      sendProposal: (id) => {
        const sentAt = stamp().slice(0, 10);
        patchRow(setProposals)(id, { status: "sent", sentAt });
        return persist(actions.sendProposal(id, sentAt));
      },
      acceptProposal: (id) => {
        const acceptedAt = stamp().slice(0, 10);
        patchRow(setProposals)(id, { status: "accepted", acceptedAt });
        return persist(actions.acceptProposal(id, acceptedAt));
      },
      addJob: (job) => {
        setJobs((prev) => [job, ...prev]);
        return persist(actions.createJob(job));
      },
      completeJob: (id) => {
        const completedAt = stamp().slice(0, 10);
        patchRow(setJobs)(id, { status: "completed", completedAt, reviewStatus: "sent", reminders: 1 });
        return persist(actions.completeJob(id, completedAt));
      },
      remindReview: (id) => {
        setJobs((prev) =>
          prev.map((row) => (row.id === id ? { ...row, reviewStatus: "reminded", reminders: row.reminders + 1 } : row)),
        );
        return persist(actions.remindReview(id));
      },
      addFollowUp: (item) => {
        setFollowUps((prev) => [item, ...prev]);
        return persist(actions.createFollowUp(item));
      },
      sendFollowUp: async (id) => {
        patchRow(setFollowUps)(id, { status: "sending" });
        const result = await actions
          .sendFollowUp(id)
          .catch((): { ok: false; error: string } => ({ ok: false, error: "Couldn’t reach the server. Try again." }));
        patchRow(setFollowUps)(
          id,
          result.ok ? { status: "sent", sentAt: stamp(), error: undefined } : { status: "failed", error: result.error },
        );
        return result;
      },
      updateFollowUp: (id, patch) => {
        setFollowUps((prev) =>
          prev.map((row) => (row.id === id ? { ...row, ...patch, status: row.status === "failed" ? "queued" : row.status, error: undefined } : row)),
        );
        return persist(actions.updateFollowUp(id, patch));
      },
      deleteFollowUp: (id) => {
        setFollowUps((prev) => prev.filter((row) => row.id !== id));
        return persist(actions.deleteFollowUp(id));
      },
      deleteLead: (id) => {
        setLeads((prev) => prev.filter((row) => row.id !== id));
        setFollowUps((prev) => prev.filter((row) => row.leadId !== id));
        setProposals((prev) => prev.filter((row) => row.leadId !== id || row.clientId));
        return persist(actions.deleteLead(id));
      },
      addClient: async (client) => {
        const result = await actions
          .createClient(client)
          .catch((): { ok: false; error: string } => ({ ok: false, error: "Couldn’t add the client. Please try again." }));
        if (result.ok) setClients((prev) => [...prev, client]);
        return result;
      },
      updateClient: (id, patch) => {
        patchRow(setClients)(id, patch);
        return persist(actions.updateClient(id, patch));
      },
      deleteClient: (id) => {
        setClients((prev) => prev.filter((row) => row.id !== id));
        setDocuments((prev) => prev.filter((row) => row.clientId !== id));
        setForms((prev) => prev.filter((row) => row.clientId !== id));
        setJobs((prev) => prev.filter((row) => row.clientId !== id));
        setMessages((prev) => prev.filter((row) => row.clientId !== id));
        return persist(actions.deleteClient(id));
      },
      updateProposal: (id, patch) => {
        patchRow(setProposals)(id, patch);
        return persist(actions.updateProposal(id, patch));
      },
      sendStaffEmail: async (input) => {
        const result = await actions
          .sendStaffEmail(input)
          .catch((): StaffEmailResult => ({ ok: false, error: "Couldn’t reach the server. Please try again.", sent: [] }));
        if (result.sent.length) {
          setStaffEmails((prev) => [...result.sent, ...prev]);
          if (input.postToPortal) {
            const posted = result.sent
              .filter((e) => e.status === "sent" && e.clientId)
              .map((e) => ({ id: `m_em_${e.id}`, clientId: e.clientId!, author: "adept" as const, body: e.subject, at: e.createdAt }));
            if (posted.length) setMessages((prev) => [...prev, ...posted]);
          }
        }
        return result;
      },
      deleteProposal: (id) => {
        setProposals((prev) => prev.filter((row) => row.id !== id));
        return persist(actions.deleteProposal(id));
      },
      addTestimonial: (item) => {
        setTestimonials((prev) => [item, ...prev]);
        return persist(actions.createTestimonial(item));
      },
      updateTestimonial: (id, patch) => {
        patchRow(setTestimonials)(id, patch);
        return persist(actions.updateTestimonial(id, patch));
      },
      deleteTestimonial: (id) => {
        setTestimonials((prev) => prev.filter((row) => row.id !== id));
        return persist(actions.deleteTestimonial(id));
      },
    };
  }, [
    appointments,
    clicks,
    clientId,
    clients,
    documents,
    firm,
    followUps,
    forms,
    jobs,
    leads,
    messages,
    proposals,
    syncError,
    testimonials,
    staffEmails,
    viewer,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function useClientWorkspace() {
  const app = useApp();
  const clientId = app.clientId;
  return {
    ...app,
    client: app.clients.find((c) => c.id === clientId)!,
    clientDocuments: app.documents.filter((d) => d.clientId === clientId),
    clientForms: app.forms.filter((f) => f.clientId === clientId),
    clientAppointments: app.appointments.filter((a) => a.clientId === clientId),
    outstanding: app.forms.filter((f) => f.clientId === clientId && f.status !== "completed"),
  };
}
