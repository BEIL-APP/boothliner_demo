import type {
  Booth, Visit, Favorite, Thread, Analytics,
  Lead, BoothPolicy, Attachment, SurveyResponse,
  AppNotification, StaffMember, RateLimit, ReplyTemplate, Collection,
  ConsentWithdrawal,
} from '../types';
import {
  SEED_BOOTHS, SEED_ANALYTICS, SEED_THREADS, SEED_LEADS,
  SEED_POLICIES, SEED_ATTACHMENTS, SEED_SURVEYS, SEED_STAFF,
} from '../data/seed';

const PREFIX = 'bep_';
const KEYS = {
  booths: `${PREFIX}booths`,
  visits: `${PREFIX}visits`,
  favorites: `${PREFIX}favorites`,
  threads: `${PREFIX}threads`,
  analytics: `${PREFIX}analytics`,
  leads: `${PREFIX}leads`,
  policies: `${PREFIX}policies`,
  attachments: `${PREFIX}attachments`,
  surveys: `${PREFIX}surveys`,
  notifications: `${PREFIX}notifications`,
  staff: `${PREFIX}staff`,
  rateLimits: `${PREFIX}rate_limits`,
  templates: `${PREFIX}reply_templates`,
  collections: `${PREFIX}collections`,
  consentWithdrawals: `${PREFIX}consent_withdrawals`,
  isLoggedIn: `${PREFIX}isLoggedIn`,
  isAdmin: `${PREFIX}isAdmin`,
  userEmail: `${PREFIX}userEmail`,
  seeded: `${PREFIX}seeded`,
  guestId: `${PREFIX}guestId`,
};

const DEFAULT_TEMPLATES: ReplyTemplate[] = [
  {
    id: 'tpl-1',
    label: '답변 확인 중',
    text: '안녕하세요! 문의 주셔서 감사합니다. 담당자가 확인 후 빠른 시일 내로 상세 답변 드리겠습니다.',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'tpl-2',
    label: '견적 안내',
    text: '견적은 수량과 요구사항에 따라 달라집니다. 이메일(hello@booth.kr)로 자세한 사항 보내주시면 1영업일 내로 맞춤 견적서 발송해 드리겠습니다.',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'tpl-3',
    label: '문의 완료',
    text: '문의하신 내용에 대한 답변이 완료됐습니다. 추가 문의사항이 있으시면 언제든지 말씀해 주세요. 감사합니다!',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

// ─── Generic ─────────────────────────────────────────────────────────────────

function get<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Guest ID (persistent anonymous visitor ID) ───────────────────────────────

export function getGuestId(): string {
  let id = localStorage.getItem(KEYS.guestId);
  if (!id) {
    id = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(KEYS.guestId, id);
  }
  return id;
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

export function initSeedData(): void {
  if (localStorage.getItem(KEYS.seeded)) return;
  set(KEYS.booths, SEED_BOOTHS);
  set(KEYS.analytics, SEED_ANALYTICS);
  set(KEYS.threads, SEED_THREADS);
  set(KEYS.leads, SEED_LEADS);
  set(KEYS.policies, SEED_POLICIES);
  set(KEYS.attachments, SEED_ATTACHMENTS);
  set(KEYS.surveys, SEED_SURVEYS);
  set(KEYS.staff, SEED_STAFF);
  set(KEYS.visits, []);
  set(KEYS.favorites, []);
  localStorage.setItem(KEYS.seeded, '1');
}

// ─── Booths ───────────────────────────────────────────────────────────────────

export function getBooths(): Booth[] {
  return get<Booth[]>(KEYS.booths) ?? [];
}

export function getBooth(id: string): Booth | undefined {
  return getBooths().find((b) => b.id === id);
}

export function saveBooth(booth: Booth): void {
  const booths = getBooths();
  const idx = booths.findIndex((b) => b.id === booth.id);
  if (idx >= 0) {
    booths[idx] = booth;
  } else {
    booths.push(booth);
    // initialize analytics
    const analytics = getAnalytics();
    analytics.push({ boothId: booth.id, scans: 0, favorites: 0, inquiries: 0 });
    set(KEYS.analytics, analytics);
  }
  set(KEYS.booths, booths);
}

export function deleteBooth(id: string): void {
  set(KEYS.booths, getBooths().filter((b) => b.id !== id));
}

// ─── Visits ───────────────────────────────────────────────────────────────────

export function getVisits(): Visit[] {
  return get<Visit[]>(KEYS.visits) ?? [];
}

export function addVisit(boothId: string): void {
  const visitorId = getGuestId();
  const visits = getVisits();
  visits.unshift({ boothId, visitedAt: new Date().toISOString(), visitorId });
  // keep last 100
  set(KEYS.visits, visits.slice(0, 100));
  incrementScan(boothId);
}

export function getUniqueVisitorCount(boothId: string): number {
  const visits = getVisits().filter((v) => v.boothId === boothId);
  const ids = new Set(visits.map((v) => v.visitorId ?? 'unknown'));
  return ids.size;
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export function getFavorites(): Favorite[] {
  return get<Favorite[]>(KEYS.favorites) ?? [];
}

export function isFavorite(boothId: string): boolean {
  return getFavorites().some((f) => f.boothId === boothId);
}

export function toggleFavorite(boothId: string): boolean {
  const favorites = getFavorites();
  const idx = favorites.findIndex((f) => f.boothId === boothId);
  if (idx >= 0) {
    favorites.splice(idx, 1);
    set(KEYS.favorites, favorites);
    syncFavoriteAnalytics(boothId, false);
    return false;
  } else {
    favorites.unshift({ boothId, createdAt: new Date().toISOString() });
    set(KEYS.favorites, favorites);
    syncFavoriteAnalytics(boothId, true);
    return true;
  }
}

// ─── Threads ─────────────────────────────────────────────────────────────────

export function getThreads(): Thread[] {
  return get<Thread[]>(KEYS.threads) ?? [];
}

export function getThread(id: string): Thread | undefined {
  return getThreads().find((t) => t.id === id);
}

export function saveThread(thread: Thread): void {
  const threads = getThreads();
  const idx = threads.findIndex((t) => t.id === thread.id);
  if (idx >= 0) {
    threads[idx] = thread;
  } else {
    threads.unshift(thread);
    incrementInquiry(thread.boothId);
  }
  set(KEYS.threads, threads);
}

export function createThread(
  boothId: string,
  text: string,
  isLoggedIn: boolean,
  options?: { email?: string; consent?: boolean; consentMarketing?: boolean; visitorName?: string }
): Thread {
  const guestId = getGuestId();
  const thread: Thread = {
    id: `thread-${Date.now()}`,
    boothId,
    visitorId: isLoggedIn ? 'user' : 'guest',
    visitorGuestId: guestId,
    visitorName: isLoggedIn ? (options?.visitorName ?? '나') : undefined,
    visitorEmail: options?.email,
    consentGiven: options?.consent ?? false,
    messages: [
      {
        from: 'visitor',
        text,
        at: new Date().toISOString(),
      },
    ],
    status: '미처리',
    tags: [],
    memo: '',
    lastUpdated: new Date().toISOString(),
  };
  saveThread(thread);

  // If consent given, save as lead
  if (options?.consent && (options?.email || isLoggedIn)) {
    const now = new Date().toISOString();
    const lead: Lead = {
      id: `lead-${Date.now()}`,
      boothId,
      source: 'inquiry',
      email: options?.email,
      memo: `문의 스레드: ${thread.id}`,
      consent: true,
      consentAt: now,
      consentVersion: '1.0',
      consentMarketing: options?.consentMarketing ?? false,
      consentMarketingAt: options?.consentMarketing ? now : undefined,
      createdAt: now,
    };
    saveLead(lead);
  }

  return thread;
}

export function replyToThread(threadId: string, text: string, from: 'visitor' | 'booth'): Thread | null {
  const threads = getThreads();
  const idx = threads.findIndex((t) => t.id === threadId);
  if (idx < 0) return null;
  threads[idx].messages.push({ from, text, at: new Date().toISOString() });
  threads[idx].lastUpdated = new Date().toISOString();
  set(KEYS.threads, threads);
  return threads[idx];
}

export function blockThread(threadId: string): void {
  const threads = getThreads();
  const idx = threads.findIndex((t) => t.id === threadId);
  if (idx >= 0) {
    threads[idx].blocked = !threads[idx].blocked;
    set(KEYS.threads, threads);
  }
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export function getAnalytics(): Analytics[] {
  return get<Analytics[]>(KEYS.analytics) ?? [];
}

export function getBoothAnalytics(boothId: string): Analytics {
  return (
    getAnalytics().find((a) => a.boothId === boothId) ?? {
      boothId,
      scans: 0,
      favorites: 0,
      inquiries: 0,
    }
  );
}

function updateAnalytics(boothId: string, updater: (a: Analytics) => void): void {
  const all = getAnalytics();
  const idx = all.findIndex((a) => a.boothId === boothId);
  if (idx >= 0) {
    updater(all[idx]);
    set(KEYS.analytics, all);
  }
}

function incrementScan(boothId: string) {
  updateAnalytics(boothId, (a) => { a.scans += 1; });
}

function incrementInquiry(boothId: string) {
  updateAnalytics(boothId, (a) => { a.inquiries += 1; });
}

function syncFavoriteAnalytics(boothId: string, added: boolean) {
  updateAnalytics(boothId, (a) => {
    a.favorites = added ? a.favorites + 1 : Math.max(0, a.favorites - 1);
  });
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export function getLeads(): Lead[] {
  return get<Lead[]>(KEYS.leads) ?? [];
}

export function getBoothLeads(boothId: string): Lead[] {
  return getLeads().filter((l) => l.boothId === boothId);
}

export function saveLead(lead: Lead): void {
  const leads = getLeads();
  const idx = leads.findIndex((l) => l.id === lead.id);
  if (idx >= 0) {
    leads[idx] = lead;
  } else {
    leads.unshift(lead);
  }
  set(KEYS.leads, leads);
}

export function deleteLead(id: string): void {
  set(KEYS.leads, getLeads().filter((l) => l.id !== id));
}

// ─── Booth Policies ────────────────────────────────────────────────────────────

export function getPolicies(): BoothPolicy[] {
  return get<BoothPolicy[]>(KEYS.policies) ?? [];
}

export function getBoothPolicy(boothId: string): BoothPolicy | undefined {
  return getPolicies().find((p) => p.boothId === boothId);
}

export function saveBoothPolicy(policy: BoothPolicy): void {
  const policies = getPolicies();
  const idx = policies.findIndex((p) => p.boothId === policy.boothId);
  if (idx >= 0) {
    policies[idx] = policy;
  } else {
    policies.push(policy);
  }
  set(KEYS.policies, policies);
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export function getAttachments(): Attachment[] {
  return get<Attachment[]>(KEYS.attachments) ?? [];
}

export function getBoothAttachments(boothId: string): Attachment[] {
  return getAttachments().filter((a) => a.boothId === boothId);
}

export function saveAttachment(attachment: Attachment): void {
  const attachments = getAttachments();
  attachments.unshift(attachment);
  set(KEYS.attachments, attachments);
}

export function deleteAttachment(id: string): void {
  set(KEYS.attachments, getAttachments().filter((a) => a.id !== id));
}

// ─── Survey Responses ────────────────────────────────────────────────────────

export function getSurveys(): SurveyResponse[] {
  return get<SurveyResponse[]>(KEYS.surveys) ?? [];
}

export function getBoothSurveys(boothId: string): SurveyResponse[] {
  return getSurveys().filter((s) => s.boothId === boothId);
}

export function saveSurvey(survey: SurveyResponse): void {
  const surveys = getSurveys();
  surveys.unshift(survey);
  set(KEYS.surveys, surveys);
}

export function getSurveyAggregate(boothId: string): {
  total: number;
  interests: Record<string, number>;
  purposes: Record<string, number>;
  wantsContact: number;
} {
  const surveys = getBoothSurveys(boothId);
  const interests: Record<string, number> = {};
  const purposes: Record<string, number> = {};
  let wantsContact = 0;

  for (const s of surveys) {
    (s.answers.interests ?? []).forEach((tag) => {
      interests[tag] = (interests[tag] ?? 0) + 1;
    });
    if (s.answers.purpose) {
      purposes[s.answers.purpose] = (purposes[s.answers.purpose] ?? 0) + 1;
    }
    if (s.answers.wantsContact) wantsContact++;
  }

  return { total: surveys.length, interests, purposes, wantsContact };
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function getAllNotifications(): AppNotification[] {
  return get<AppNotification[]>(KEYS.notifications) ?? [];
}

export function getNotifications(guestId: string): AppNotification[] {
  return getAllNotifications()
    .filter((n) => n.targetGuestId === guestId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function saveNotification(notif: AppNotification): void {
  // Default status to PENDING if caller didn't set it
  const withStatus: AppNotification = notif.status ? notif : { ...notif, status: 'PENDING' };
  const all = getAllNotifications();
  all.unshift(withStatus);
  set(KEYS.notifications, all.slice(0, 200));
  // Simulate in-app delivery: mark SENT immediately (real push/email would be async)
  markNotificationSent(withStatus.id);
}

export function markNotificationSent(id: string): void {
  const all = getAllNotifications();
  const idx = all.findIndex((n) => n.id === id);
  if (idx >= 0) {
    all[idx].status = 'SENT';
    all[idx].sentAt = new Date().toISOString();
    set(KEYS.notifications, all);
  }
}

export function markNotificationFailed(id: string): void {
  const all = getAllNotifications();
  const idx = all.findIndex((n) => n.id === id);
  if (idx >= 0) {
    all[idx].status = 'FAILED';
    all[idx].retryCount = (all[idx].retryCount ?? 0) + 1;
    set(KEYS.notifications, all);
  }
}

export function markAllNotificationsRead(guestId: string): void {
  const all = getAllNotifications();
  const updated = all.map((n) =>
    n.targetGuestId === guestId ? { ...n, read: true } : n
  );
  set(KEYS.notifications, updated);
}

export function getUnreadNotificationCount(guestId: string): number {
  return getAllNotifications().filter((n) => n.targetGuestId === guestId && !n.read).length;
}

// ─── Staff Members ────────────────────────────────────────────────────────────

export function getAllStaff(): StaffMember[] {
  return get<StaffMember[]>(KEYS.staff) ?? [];
}

export function getBoothStaff(boothId: string): StaffMember[] {
  return getAllStaff().filter((s) => s.boothId === boothId);
}

export function saveStaff(member: StaffMember): void {
  const all = getAllStaff();
  const idx = all.findIndex((s) => s.id === member.id);
  if (idx >= 0) {
    all[idx] = member;
  } else {
    all.push(member);
  }
  set(KEYS.staff, all);
}

export function deleteStaff(id: string): void {
  set(KEYS.staff, getAllStaff().filter((s) => s.id !== id));
}

// ─── Rate Limits ──────────────────────────────────────────────────────────────

function getRateLimits(): RateLimit[] {
  return get<RateLimit[]>(KEYS.rateLimits) ?? [];
}

export function checkRateLimit(key: string, max: number): boolean {
  const all = getRateLimits();
  const rl = all.find((r) => r.key === key);
  if (!rl) return false;
  if (new Date(rl.resetAt) < new Date()) return false; // window expired
  return rl.count >= max;
}

export function incrementRateLimit(key: string, windowMs: number): void {
  const all = getRateLimits();
  const idx = all.findIndex((r) => r.key === key);
  const resetAt = new Date(Date.now() + windowMs).toISOString();
  if (idx >= 0) {
    if (new Date(all[idx].resetAt) < new Date()) {
      all[idx] = { key, count: 1, resetAt };
    } else {
      all[idx].count += 1;
    }
  } else {
    all.push({ key, count: 1, resetAt });
  }
  set(KEYS.rateLimits, all);
}

// ─── Data Deletion (GDPR-style) ───────────────────────────────────────────────

export function deleteMyData(): void {
  const guestId = getGuestId();
  // Clear visits
  set(KEYS.visits, []);
  // Clear favorites
  set(KEYS.favorites, []);
  // Remove threads associated with this guestId
  const threads = getThreads().filter((t) => t.visitorGuestId !== guestId);
  set(KEYS.threads, threads);
  // Remove leads with matching email (best-effort)
  // Clear notifications
  const notifs = getAllNotifications().filter((n) => n.targetGuestId !== guestId);
  set(KEYS.notifications, notifs);
  // Reset guestId
  localStorage.removeItem(KEYS.guestId);
  // Clear rate limits
  set(KEYS.rateLimits, getRateLimits().filter((r) => !r.key.startsWith(guestId)));
}

// ─── Reply Templates (B-4) ────────────────────────────────────────────────────

export function getReplyTemplates(): ReplyTemplate[] {
  const stored = get<ReplyTemplate[]>(KEYS.templates);
  if (!stored || stored.length === 0) {
    set(KEYS.templates, DEFAULT_TEMPLATES);
    return DEFAULT_TEMPLATES;
  }
  return stored;
}

export function saveReplyTemplate(template: ReplyTemplate): void {
  const all = getReplyTemplates();
  const idx = all.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    all[idx] = template;
  } else {
    all.push(template);
  }
  set(KEYS.templates, all);
}

export function deleteReplyTemplate(id: string): void {
  set(KEYS.templates, getReplyTemplates().filter((t) => t.id !== id));
}

// ─── Collections (C-6) ────────────────────────────────────────────────────────

export function getCollections(): Collection[] {
  return get<Collection[]>(KEYS.collections) ?? [];
}

export function saveCollection(collection: Collection): void {
  const all = getCollections();
  const idx = all.findIndex((c) => c.id === collection.id);
  if (idx >= 0) {
    all[idx] = collection;
  } else {
    all.unshift(collection);
  }
  set(KEYS.collections, all);
}

export function deleteCollection(id: string): void {
  set(KEYS.collections, getCollections().filter((c) => c.id !== id));
}

export function addToCollection(collectionId: string, boothId: string): void {
  const all = getCollections();
  const idx = all.findIndex((c) => c.id === collectionId);
  if (idx >= 0 && !all[idx].boothIds.includes(boothId)) {
    all[idx].boothIds.push(boothId);
    set(KEYS.collections, all);
  }
}

export function removeFromCollection(collectionId: string, boothId: string): void {
  const all = getCollections();
  const idx = all.findIndex((c) => c.id === collectionId);
  if (idx >= 0) {
    all[idx].boothIds = all[idx].boothIds.filter((id) => id !== boothId);
    set(KEYS.collections, all);
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function getIsLoggedIn(): boolean {
  return localStorage.getItem(KEYS.isLoggedIn) === '1';
}

export function setIsLoggedIn(value: boolean): void {
  localStorage.setItem(KEYS.isLoggedIn, value ? '1' : '0');
}

export function getIsAdmin(): boolean {
  return localStorage.getItem(KEYS.isAdmin) === '1';
}

export function setIsAdmin(value: boolean): void {
  localStorage.setItem(KEYS.isAdmin, value ? '1' : '0');
}

export function getUserEmail(): string {
  return localStorage.getItem(KEYS.userEmail) ?? '';
}

export function setUserEmail(email: string): void {
  localStorage.setItem(KEYS.userEmail, email);
}

// ─── Notification Retry (A-3) ────────────────────────────────────────────────
export function retryFailedNotifications(): number {
  const notifications = getAllNotifications();
  let retried = 0;
  const updated = notifications.map((n) => {
    if (n.status === 'FAILED' && (n.retryCount ?? 0) < 3) {
      retried++;
      const success = Math.random() > 0.3;
      return {
        ...n,
        status: success ? 'SENT' as const : 'FAILED' as const,
        retryCount: (n.retryCount ?? 0) + 1,
        sentAt: success ? new Date().toISOString() : n.sentAt,
      };
    }
    return n;
  });
  localStorage.setItem(KEYS.notifications, JSON.stringify(updated));
  return retried;
}

export function getFailedNotificationCount(): number {
  const notifications = getAllNotifications();
  return notifications.filter((n) => n.status === 'FAILED').length;
}

// ─── Consent Withdrawal (A-1) ───────────────────────────────────────────────
export function getConsentWithdrawals(): ConsentWithdrawal[] {
  try {
    const raw = localStorage.getItem(KEYS.consentWithdrawals);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function requestConsentWithdrawal(type: ConsentWithdrawal['type'], reason?: string): ConsentWithdrawal {
  const withdrawals = getConsentWithdrawals();
  const withdrawal: ConsentWithdrawal = {
    id: `cw-${Date.now()}`,
    type,
    status: 'REQUESTED',
    requestedAt: new Date().toISOString(),
    reason,
  };
  withdrawals.push(withdrawal);
  localStorage.setItem(KEYS.consentWithdrawals, JSON.stringify(withdrawals));

  // Mock: auto-process after creation (simulate async processing)
  setTimeout(() => {
    const current = getConsentWithdrawals();
    const updated = current.map((w) =>
      w.id === withdrawal.id ? { ...w, status: 'PROCESSING' as const } : w
    );
    localStorage.setItem(KEYS.consentWithdrawals, JSON.stringify(updated));
  }, 0);

  return withdrawal;
}

export function completeConsentWithdrawal(id: string): void {
  const withdrawals = getConsentWithdrawals();
  const updated = withdrawals.map((w) =>
    w.id === id ? { ...w, status: 'COMPLETED' as const, completedAt: new Date().toISOString() } : w
  );
  localStorage.setItem(KEYS.consentWithdrawals, JSON.stringify(updated));
}
