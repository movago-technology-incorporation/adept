export type LeadStatus = "new" | "engaged" | "consult booked" | "proposal sent" | "won" | "lost";
export type ProposalStatus = "draft" | "sent" | "viewed" | "changes requested" | "accepted" | "signed" | "declined";
export type JobStatus = "queued" | "in progress" | "review" | "completed";
export type ReviewAskStatus = "idle" | "sent" | "reminded" | "left review";
export type MeetingStatus = "scheduled" | "live" | "completed" | "cancelled";
export type MessageAuthor = "client" | "adept";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  interest: string;
  status: LeadStatus;
  lastClick: string;
  page: string;
  utm: string;
  notes: string;
  createdAt: string;
};

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  type: "Individual" | "Sole proprietor" | "Corporation";
  since: string;
};

export type DocumentFile = {
  id: string;
  clientId: string;
  name: string;
  kind: "upload" | "receipt" | "tax" | "report" | "other";
  category: string;
  size: string;
  uploadedAt: string;
  storageKey?: string;
};

export type FormTask = {
  id: string;
  clientId: string;
  title: string;
  due: string;
  status: "outstanding" | "in progress" | "completed";
};

export type ThreadMessage = {
  id: string;
  clientId?: string;
  author: MessageAuthor;
  body: string;
  at: string;
};

export type Appointment = {
  id: string;
  clientId?: string;
  leadId?: string;
  name: string;
  email: string;
  topic: string;
  date: string;
  time: string;
  meetingUrl: string;
  status: MeetingStatus;
  summary?: string;
  notes?: string;
  /** Cal.com booking uid when the meeting was booked through Cal.com. */
  calUid?: string;
  duration?: number;
};

export type Proposal = {
  id: string;
  clientId?: string;
  leadId?: string;
  title: string;
  amount: string;
  status: ProposalStatus;
  sentAt?: string;
  acceptedAt?: string;
};

export type Job = {
  id: string;
  clientId: string;
  title: string;
  status: JobStatus;
  completedAt?: string;
  reviewStatus: ReviewAskStatus;
  reminders: number;
};

export type FollowUp = {
  id: string;
  leadId: string;
  channel: "email" | "sms";
  subject: string;
  scheduledFor: string;
  status: "queued" | "sending" | "sent" | "failed";
  body?: string;
  sentAt?: string;
  error?: string;
};

export type ClickEvent = {
  id: string;
  at: string;
  page: string;
  cta: string;
  referrer: string;
  device: string;
  city: string;
  leadId?: string;
};

export type Testimonial = {
  id: string;
  name: string;
  quote: string;
  role: string;
  featured: boolean;
};

export type Firm = {
  name: string;
  short: string;
  email: string;
  phone: string;
  hours: string;
  city: string;
  country: string;
};

export type TaxDeadline = {
  title: string;
  lines: string[];
};


export type StaffEmail = {
  id: string;
  batchId: string;
  clientId?: string;
  leadId?: string;
  toName: string;
  toEmail: string;
  subject: string;
  html: string;
  status: "sent" | "failed";
  error?: string;
  sentBy: string;
  createdAt: string;
};
