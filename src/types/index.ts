export interface Booth {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  images: string[];
  links: {
    instagram?: string;
    store?: string;
    site?: string;
  };
  customLinks?: Array<{ label: string; url: string }>;
  faq: Array<{ question: string; answer: string }>;
  nextEvents: Array<{ title: string; date: string; location: string }>;
  createdAt: string;
}

export interface Visit {
  boothId: string;
  eventId?: string;
  visitedAt: string;
  visitorId?: string;
}

export interface Favorite {
  boothId: string;
  createdAt: string;
}

export interface ChatMessage {
  from: 'visitor' | 'booth';
  text: string;
  images?: string[];
  at: string;
}

export interface Thread {
  id: string;
  boothId: string;
  visitorId: 'guest' | 'user';
  visitorGuestId?: string;   // persistent guestId for notification targeting
  visitorName?: string;
  visitorEmail?: string;
  consentGiven?: boolean;
  blocked?: boolean;         // spam/abuse block flag
  messages: ChatMessage[];
  status: '미처리' | '처리' | '보류';
  tags: string[];
  memo: string;
  lastUpdated: string;
}

export interface Analytics {
  boothId: string;
  eventId?: string;
  scans: number;
  favorites: number;
  inquiries: number;
}

// ─── New types for extended MVP ───────────────────────────────────────────────

export type LeadStatus = 'NEW' | 'CONTACTED' | 'MEETING' | 'WON' | 'LOST';

export interface Lead {
  id: string;
  boothId: string;
  source: 'bizcard' | 'inquiry' | 'email_info' | 'survey';
  status?: LeadStatus;
  name?: string;
  company?: string;
  phone?: string;
  email?: string;
  memo: string;
  consent: boolean;
  consentAt?: string;
  consentVersion?: string;
  consentMarketing?: boolean;
  consentMarketingAt?: string;
  nextFollowUp?: string;
  createdAt: string;
}

export interface BoothPolicy {
  boothId: string;
  eventId?: string;
  startAt: string;
  endAt: string;
  allowViewAfterEnd: boolean;
  allowInquiryAfterEnd: boolean;
}

export interface Attachment {
  id: string;
  boothId: string;
  filename: string;
  type: string;
  size?: string;
  createdAt: string;
}

export interface SurveyResponse {
  id: string;
  boothId: string;
  visitorId: string;
  answers: {
    interests?: string[];
    purpose?: string;
    wantsContact?: boolean;
  };
  createdAt: string;
}

export interface AppNotification {
  id: string;
  targetGuestId: string;
  type: 'reply' | 'system';
  title: string;
  body: string;
  read: boolean;
  status: 'PENDING' | 'SENT' | 'FAILED';  // delivery status (A-3)
  retryCount?: number;                      // retry attempts on failure (A-3)
  sentAt?: string;                          // timestamp when delivered (A-3)
  boothId?: string;
  threadId?: string;
  createdAt: string;
}

// ─── Reply Templates (B-4) ─────────────────────────────────────────────────────
export interface ReplyTemplate {
  id: string;
  label: string;
  text: string;
  createdAt: string;
}

// ─── Collections (C-6) ────────────────────────────────────────────────────────
export interface Collection {
  id: string;
  name: string;
  boothIds: string[];
  createdAt: string;
}

export interface StaffMember {
  id: string;
  boothId: string;
  name: string;
  email: string;
  role: 'owner' | 'staff';
  status: 'active' | 'pending';
  invitedAt: string;
}

export interface RateLimit {
  key: string;
  count: number;
  resetAt: string;
}

// ─── Event & Participation ───────────────────────────────────────────────────
export interface BoothEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  createdAt: string;
}

export interface BoothEventParticipation {
  id: string;
  boothId: string;
  eventId: string;
  boothLocation?: string;
  startAt: string;
  endAt: string;
}

export interface ConsentWithdrawal {
  id: string;
  type: 'data_delete' | 'marketing_opt_out';
  status: 'REQUESTED' | 'PROCESSING' | 'COMPLETED';
  requestedAt: string;
  completedAt?: string;
  reason?: string;
}
