import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  Heart,
  MessageSquare,
  Instagram,
  ShoppingBag,
  Globe,
  ChevronDown,
  Calendar,
  MapPin,
  ArrowLeft,
  Mail,
  FileDown,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  LogIn,
  Share2,
  ExternalLink,
  Sparkles,
  Copy,
  Link2,
  QrCode,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { VisitorHeader } from '../../components/VisitorHeader';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useBooth } from '../../hooks/useBooths';
import { useFavorites } from '../../hooks/useFavorites';
import { useThreads } from '../../hooks/useThreads';
import {
  addVisit,
  getBoothPolicy,
  getBoothAttachments,
  getBoothSurveys,
  saveLead,
  saveSurvey,
  getGuestId,
  checkRateLimit,
  incrementRateLimit,
  getUserEmail,
} from '../../utils/localStorage';
import type { BoothPolicy, Attachment, SurveyResponse } from '../../types';

type SurveyField = {
  id: string;
  label: string;
  type: 'text' | 'select' | 'checkbox';
  options?: string[];
  required: boolean;
};

const DEFAULT_SURVEY_FIELDS: SurveyField[] = [
  { id: 'interests', label: '관심 분야', type: 'checkbox', options: ['구매검토', '파트너십', 'B2B 납품', '정보수집'], required: false },
  { id: 'purpose', label: '방문 목적', type: 'select', options: ['구매/계약 검토', '제품 정보 수집', '파트너십/협력', '견적 요청'], required: false },
];
const DEFAULT_SURVEY_INTRO = '설문에 참여해주시면 부스 운영자가 더 맞는 정보와 후속 안내를 드릴 수 있어요.';

function isPolicyActive(policy: BoothPolicy): boolean {
  const now = new Date();
  return new Date(policy.startAt) <= now && now <= new Date(policy.endAt);
}

function isPolicyExpired(policy: BoothPolicy): boolean {
  return new Date(policy.endAt) < new Date();
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📄';
  if (['xlsx', 'xls', 'csv'].includes(ext ?? '')) return '📊';
  if (['pptx', 'ppt'].includes(ext ?? '')) return '📋';
  return '📎';
}

export default function BoothPage() {
  const { boothId } = useParams<{ boothId: string }>();
  const location = useLocation();
  const { booth } = useBooth(boothId ?? '');
  const { isLoggedIn } = useAuth();
  const loginHref = `/auth?returnUrl=${encodeURIComponent(location.pathname)}`;
  const { showToast } = useToast();
  const { checkFav, toggleFav } = useFavorites();
  const { createInquiry } = useThreads();

  const [imgIndex, setImgIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [fav, setFav] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showLoginNudge, setShowLoginNudge] = useState(false);

  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryText, setInquiryText] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryConsent, setInquiryConsent] = useState(false);
  const [inquiryConsentMarketing, setInquiryConsentMarketing] = useState(false);
  const [inquiryAbuseCheck, setInquiryAbuseCheck] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryRateLimited, setInquiryRateLimited] = useState(false);

  const [showShare, setShowShare] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showEmailInfo, setShowEmailInfo] = useState(false);
  const [emailInfoAddr, setEmailInfoAddr] = useState('');
  const [emailInfoConsent, setEmailInfoConsent] = useState(false);
  const [emailInfoSent, setEmailInfoSent] = useState(false);

  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyFields, setSurveyFields] = useState<SurveyField[]>(DEFAULT_SURVEY_FIELDS);
  const [surveyIntro, setSurveyIntro] = useState(DEFAULT_SURVEY_INTRO);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | string[]>>({});
  const [surveyWantsContact, setSurveyWantsContact] = useState(false);
  const [surveyContactEmail, setSurveyContactEmail] = useState('');
  const [surveyConsent, setSurveyConsent] = useState(false);
  const [surveyConsentMarketing, setSurveyConsentMarketing] = useState(false);
  const [surveySent, setSurveySent] = useState(false);
  const [surveyPage, setSurveyPage] = useState(0);

  const [policy, setPolicy] = useState<BoothPolicy | undefined>();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [surveyDone, setSurveyDone] = useState(false);
  const tracked = useRef(false);
  const [ipTrackingConsent, setIpTrackingConsent] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!boothId || tracked.current) return;
    tracked.current = true;
    const params = new URLSearchParams(location.search);
    const source = params.get('ref') === 'qr' ? 'qr' : 'direct';
    addVisit(boothId, source);
  }, [boothId]);

  useEffect(() => {
    if (boothId) {
      setFav(checkFav(boothId));
      setPolicy(getBoothPolicy(boothId));
      setAttachments(getBoothAttachments(boothId));
      try {
        const raw = localStorage.getItem(`bep_survey_fields_${boothId}`);
        const nextFields = raw ? JSON.parse(raw) as SurveyField[] : DEFAULT_SURVEY_FIELDS;
        setSurveyFields(nextFields.length > 0 ? nextFields : DEFAULT_SURVEY_FIELDS);
      } catch {
        setSurveyFields(DEFAULT_SURVEY_FIELDS);
      }
      setSurveyIntro(localStorage.getItem(`bep_survey_intro_${boothId}`) ?? DEFAULT_SURVEY_INTRO);
      const surveys = getBoothSurveys(boothId);
      const guestId = getGuestId();
      setSurveyDone(surveys.some((s) => s.visitorId === guestId));
    }
  }, [boothId, checkFav]);

  if (!booth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-500 text-sm">부스를 찾을 수 없어요</p>
          <Link to="/explore" className="mt-4 inline-block text-brand-600 text-sm font-medium">
            ← 부스 둘러보기
          </Link>
        </div>
      </div>
    );
  }

  const expired = policy ? isPolicyExpired(policy) : false;
  const active = policy ? isPolicyActive(policy) : true;
  const inquiryAllowed = !expired || (policy?.allowInquiryAfterEnd ?? true);

  const handleToggleFav = () => {
    if (!boothId) return;
    if (!isLoggedIn) {
      setShowLoginNudge(true);
      setTimeout(() => setShowLoginNudge(false), 4000);
    }
    const next = toggleFav(boothId);
    setFav(next);
    showToast(next ? '관심 부스에 저장했어요 ✓' : '관심 부스에서 제거했어요', next ? 'success' : 'info');
  };

  const handleSendInquiry = () => {
    if (!inquiryText.trim() || !boothId) return;
    if (!isLoggedIn && (!inquiryEmail.includes('@') || !inquiryAbuseCheck)) return;
    const guestId = getGuestId();
    const rateLimitKey = `${guestId}:${boothId}:inquiry`;
    if (checkRateLimit(rateLimitKey, 3)) {
      setInquiryRateLimited(true);
      showToast('하루 3건까지 문의할 수 있어요. 내일 다시 시도해주세요.', 'error');
      return;
    }
    createInquiry(boothId, inquiryText.trim(), isLoggedIn, {
      email: isLoggedIn ? (getUserEmail() || undefined) : inquiryEmail,
      consent: inquiryConsent,
      consentMarketing: inquiryConsentMarketing,
    });
    incrementRateLimit(rateLimitKey, 24 * 60 * 60 * 1000);
    setInquirySent(true);
    setInquiryText('');
    showToast('문의가 전달됐어요!', 'success');
  };

  const handleCloseInquiry = () => {
    setShowInquiry(false);
    setInquirySent(false);
    setInquiryRateLimited(false);
    setInquiryText('');
    setInquiryEmail('');
    setInquiryConsent(false);
    setInquiryConsentMarketing(false);
    setInquiryAbuseCheck(false);
    setIpTrackingConsent(false);
  };

  const handleShare = () => {
    setShowShare(true);
    setShareCopied(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      showToast('링크 복사에 실패했어요', 'error');
    }
  };

  const handleNativeShare = async () => {
    const url = window.location.href;
    const shareData = { title: booth?.name ?? '', text: booth?.tagline ?? '', url };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try { await navigator.share(shareData); setShowShare(false); } catch { /* cancelled */ }
    }
  };

  const handleShareKakao = () => {
    showToast('카카오톡 공유는 준비 중이에요', 'info');
  };

  const handleSendEmailInfo = () => {
    if (!emailInfoAddr.includes('@') || !emailInfoConsent || !boothId) return;
    saveLead({
      id: `lead-${Date.now()}`,
      boothId,
      source: 'email_info',
      email: emailInfoAddr,
      memo: '이메일 정보 수신 신청',
      consent: true,
      createdAt: new Date().toISOString(),
    });
    setEmailInfoSent(true);
    showToast('신청이 완료되었습니다.', 'success');
  };

  const handleCloseEmailInfo = () => {
    setShowEmailInfo(false);
    setEmailInfoSent(false);
    setEmailInfoAddr('');
    setEmailInfoConsent(false);
  };

  const handleSendSurvey = () => {
    if (!boothId) return;
    const missingRequired = surveyFields.some((field) => {
      if (!field.required) return false;
      const value = surveyAnswers[field.id];
      if (field.type === 'checkbox') return !Array.isArray(value) || value.length === 0;
      return typeof value !== 'string' || !value.trim();
    });
    if (missingRequired) {
      showToast('필수 설문 항목을 입력해주세요.', 'error');
      return;
    }
    if (!surveyConsent) {
      showToast('개인정보 수집·이용 동의가 필요합니다.', 'error');
      return;
    }
    if (surveyWantsContact && !isLoggedIn && !surveyContactEmail.includes('@')) {
      showToast('연락받을 이메일 주소를 입력해주세요.', 'error');
      return;
    }
    const guestId = getGuestId();
    const response: SurveyResponse = {
      id: `survey-${Date.now()}`,
      boothId,
      visitorId: guestId,
      answers: {
        ...surveyAnswers,
        interests: Array.isArray(surveyAnswers.interests) ? surveyAnswers.interests : undefined,
        purpose: typeof surveyAnswers.purpose === 'string' ? surveyAnswers.purpose || undefined : undefined,
        wantsContact: surveyWantsContact,
      },
      consent: surveyConsent,
      consentMarketing: surveyConsentMarketing || undefined,
      createdAt: new Date().toISOString(),
    };
    saveSurvey(response);
    const leadInterests = Array.isArray(surveyAnswers.interests) ? surveyAnswers.interests : [];
    const leadPurpose = typeof surveyAnswers.purpose === 'string' ? surveyAnswers.purpose : '';
    if (surveyWantsContact) {
      saveLead({
        id: `lead-survey-${Date.now()}`,
        boothId,
        source: 'survey',
        email: !isLoggedIn && surveyContactEmail ? surveyContactEmail : undefined,
        memo: `관심분야: ${leadInterests.join(', ')} | 목적: ${leadPurpose}`,
        consent: surveyConsent,
        consentMarketing: surveyConsentMarketing || undefined,
        consentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
    setSurveySent(true);
    setSurveyDone(true);
    showToast('설문 완료! 소중한 의견 감사해요.', 'success');
  };

  const handleCloseSurvey = () => {
    setShowSurvey(false);
    setSurveySent(false);
    setSurveyConsent(false);
    setSurveyConsentMarketing(false);
    setSurveyContactEmail('');
    setSurveyPage(0);
  };

  const getSurveyAnswer = (fieldId: string) => surveyAnswers[fieldId];

  const setSurveyTextAnswer = (fieldId: string, value: string) => {
    setSurveyAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const toggleSurveyCheckboxAnswer = (fieldId: string, value: string) => {
    setSurveyAnswers((prev) => {
      const current = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [fieldId]: next };
    });
  };

  const inquiryFormValid = isLoggedIn
    ? inquiryText.trim().length > 0 && inquiryConsent
    : inquiryText.trim().length > 0 && inquiryEmail.includes('@') && inquiryAbuseCheck && inquiryConsent;

  const mockAiSummary = booth ? {
    keywords: [booth.category, ...booth.faq.slice(0, 2).map((f) => f.question.split(' ').slice(0, 2).join(' '))].filter(Boolean),
    summary: `${booth.name}은(는) ${booth.category} 분야의 부스입니다. ${booth.description.slice(0, 80)}...`,
    highlight: booth.faq.length > 0 ? `FAQ ${booth.faq.length}개 제공` : '상세 소개 제공',
  } : null;
  const eventScheduleCard = booth.nextEvents.length > 0 && (() => {
    const getEventStatus = (dateStr: string): { label: string; color: string; order: number } => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const parts = dateStr.split('~').map((s) => s.trim());
      const start = new Date(parts[0]);
      const end = parts.length > 1 ? new Date(parts[1]) : new Date(parts[0]);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      if (now >= start && now <= end) return { label: '운영 중', color: 'bg-emerald-100 text-emerald-700', order: 0 };
      if (now < start) return { label: '운영 예정', color: 'bg-blue-100 text-blue-700', order: 1 };
      return { label: '운영 종료', color: 'bg-gray-100 text-gray-500', order: 2 };
    };

    const sorted = [...booth.nextEvents]
      .map((ev) => ({ ...ev, status: getEventStatus(ev.date) }))
      .sort((a, b) => a.status.order - b.status.order);

    return (
      <div className="order-9 md:order-none bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">행사 일정</h2>
        <div className="space-y-3">
          {sorted.map((ev, i) => (
            <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border ${ev.status.order === 2 ? 'bg-gray-50/60 border-gray-100' : 'bg-gray-50 border-gray-100/50 hover:border-gray-200 transition-colors'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ev.status.order === 0 ? 'bg-emerald-100' : 'bg-gray-200/50'}`}>
                <Calendar className={`w-5 h-5 ${ev.status.order === 0 ? 'text-emerald-600' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-sm font-bold ${ev.status.order === 2 ? 'text-gray-400' : 'text-gray-900'}`}>{ev.title}</p>
                  <span className={`inline-flex items-center h-5 px-1.5 rounded text-[11px] font-bold ${ev.status.color}`}>
                    {ev.status.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className={`flex items-center gap-1 text-xs font-medium ${ev.status.order === 2 ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Clock className="w-3.5 h-3.5" /> {ev.date}
                  </span>
                  <span className={`flex items-center gap-1 text-xs font-medium ${ev.status.order === 2 ? 'text-gray-400' : 'text-gray-500'}`}>
                    <MapPin className="w-3.5 h-3.5" /> {ev.location}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  })();

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <VisitorHeader />

      {/* ═══ Hero Section ═══ */}
      <div className="max-w-5xl mx-auto md:px-6 md:pt-6">
        <div className="relative overflow-hidden md:rounded-2xl bg-gray-900">
          {booth.images.length > 0 ? (
            <img
              src={booth.images[imgIndex]}
              alt={booth.name}
              className="w-full aspect-[4/3] md:aspect-[2.2/1] object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80';
              }}
            />
          ) : (
            <div className="w-full aspect-[4/3] md:aspect-[2.2/1] bg-gray-800 flex items-center justify-center">
              <span className="text-6xl opacity-50">🏪</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Image dots */}
          {booth.images.length > 1 && (
            <div className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {booth.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                    i === imgIndex ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Image nav arrows */}
          {booth.images.length > 1 && (
            <>
              <button
                onClick={() => setImgIndex((p) => (p - 1 + booth.images.length) % booth.images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-all duration-150 z-10"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setImgIndex((p) => (p + 1) % booth.images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-all duration-150 z-10"
              >
                <ArrowLeft className="w-4 h-4 text-white rotate-180" />
              </button>
            </>
          )}

          {/* Status badge */}
          {expired && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
              운영 종료
            </div>
          )}
          {!expired && active && policy && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              운영 중
            </div>
          )}

          {/* Hero text overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-md px-2 py-0.5">
                  {booth.category}
                </span>
                {expired && policy && (
                  <span className="flex items-center gap-1 bg-white/15 backdrop-blur-sm text-white/80 text-xs rounded-md px-2 py-0.5">
                    <AlertCircle className="w-3 h-3" />
                    {new Date(policy.endAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 종료
                  </span>
                )}
              </div>
              <h1 className="text-white text-xl md:text-3xl font-bold mb-1 md:mb-2">{booth.name}</h1>
              <div className="flex items-end justify-between gap-3">
                <p className="text-white/75 text-sm md:text-base leading-relaxed flex-1">{booth.tagline}</p>
                <button
                  onClick={() => setShowEmailInfo(true)}
                  className="inline-flex md:hidden shrink-0 items-center gap-1.5 h-8 px-3 rounded-full bg-white/8 backdrop-blur-xl border border-white/18 text-white text-xs font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.16)] hover:bg-white/14 transition-all duration-200"
                >
                  <Mail className="w-3.5 h-3.5 text-white/90" />
                  소식 받기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Content Area ═══ */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">

        {/* Login nudge — mobile: persistent top banner / desktop: inside action card */}
        {!isLoggedIn && (
          <div className="md:hidden mb-6 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 shadow-sm">
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-bold text-gray-900">로그인하면</span> 문의 답변 알림과 저장 목록을 어디서든 확인할 수 있어요.{' '}
              <Link to={loginHref} className="underline font-bold text-brand-600">지금 로그인 / 가입하기 →</Link>
            </p>
          </div>
        )}

        {/* Login nudge (temporary, on fav toggle) */}
        {showLoginNudge && (
          <div className="mb-6 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 flex items-center gap-3 animate-slide-up shadow-sm">
            <LogIn className="w-4 h-4 text-brand-500 shrink-0" />
            <p className="text-xs text-brand-700 font-medium">
              <Link to={loginHref} className="font-bold underline">로그인</Link>하면 기기가 바뀌어도 저장 목록이 유지돼요
            </p>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-6 md:flex md:gap-8 md:items-start">

          {/* ── Left column ── */}
          <div className="contents md:flex md:flex-col md:flex-1 md:gap-6">

            {/* AI 요약 — mobile order: 2 */}
            {mockAiSummary && (
              <div className="order-2 md:order-none bg-white border border-gray-200/60 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setShowAiSummary(!showAiSummary)}
                  className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-all duration-150"
                >
                  <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900">AI 부스 요약</p>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{mockAiSummary.highlight}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${showAiSummary ? 'rotate-180' : ''}`} />
                </button>
                {showAiSummary && (
                  <div className="px-6 pb-5 animate-fade-in">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-700 leading-relaxed font-medium mb-4">{mockAiSummary.summary}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {mockAiSummary.keywords.map((kw, i) => (
                          <span key={i} className="text-[11px] font-bold bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md shadow-sm">{kw}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-4 italic">AI 요약은 부스 정보 기반 자동 생성입니다</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 소개 — mobile order: 3 */}
            <div className="order-3 md:order-none bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">회사 소개</h2>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">{booth.description}</p>
            </div>

            {/* 제품 갤러리 — mobile order: 4 */}
            {(booth.descriptionImages ?? []).length > 0 && (
              <div className="order-4 md:order-none bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">제품 갤러리</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(booth.descriptionImages ?? []).map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIndex(i)}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 hover:border-brand-400 hover:shadow-md transition-all duration-200 focus:outline-none group"
                    >
                      <img
                        src={src}
                        alt={`${booth.name} 제품 이미지 ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80';
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lightbox (fixed position — no layout impact) */}
            {lightboxIndex !== null && (
              <div
                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                onClick={() => setLightboxIndex(null)}
              >
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                {(booth.descriptionImages ?? []).length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + (booth.descriptionImages ?? []).length) % (booth.descriptionImages ?? []).length); }}
                      className="absolute left-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % (booth.descriptionImages ?? []).length); }}
                      className="absolute right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                <img
                  src={(booth.descriptionImages ?? [])[lightboxIndex]}
                  alt={`${booth.name} 제품 이미지 ${lightboxIndex + 1}`}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {(booth.descriptionImages ?? []).map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === lightboxIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* FAQ — mobile order: 9 */}
            {booth.faq.length > 0 && (
              <div className="order-9 md:order-none bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">자주 묻는 질문</h2>
                <div className="space-y-3">
                  {booth.faq.map((item, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-all duration-150"
                      >
                        <span className="text-sm font-bold text-gray-800 pr-6">{item.question}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                      </button>
                      {openFaq === i && (
                        <div className="px-5 pb-5 bg-gray-50/50 animate-fade-in border-t border-gray-50">
                          <p className="text-sm text-gray-600 leading-relaxed font-medium pt-4">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── Right column ── */}
          <div className="contents md:flex md:flex-col md:w-80 md:shrink-0 md:gap-6">

            {/* Desktop action buttons — desktop only */}
            <div className="hidden md:block bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleFav}
                    className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold transition-all duration-200 ${
                      fav ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <Heart className={`w-4.5 h-4.5 ${fav ? 'fill-current' : ''}`} />
                    {fav ? '저장됨' : '저장'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                  >
                    <Share2 className="w-4.5 h-4.5" />
                  </button>
                </div>
                <button
                  onClick={() => setShowInquiry(true)}
                  disabled={!inquiryAllowed}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-500 transition-all duration-200 shadow-lg shadow-brand-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <MessageSquare className="w-4.5 h-4.5" />
                  {!inquiryAllowed ? '문의 마감' : '문의하기'}
                </button>
                <button
                  onClick={() => setShowEmailInfo(true)}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                >
                  <Mail className="w-4.5 h-4.5 text-gray-400" />
                  프로모션 소식 받기
                </button>
              </div>
              {!isLoggedIn && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    <span className="font-bold text-gray-700">로그인하면</span> 문의 답변 알림과 저장 목록을 어디서든 확인할 수 있어요.{' '}
                    <Link to={loginHref} className="underline font-bold text-brand-600">지금 로그인 / 가입하기 →</Link>
                  </p>
                </div>
              )}
            </div>

            {/* 첨부 자료 — mobile order: 5 */}
            {attachments.length > 0 && (
              <div className="order-5 md:order-none bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">첨부 자료</h2>
                <div className="space-y-2.5">
                  {attachments.map((att) => (
                    <div key={att.id} className="group flex items-center gap-3 bg-gray-50 border border-gray-100/50 rounded-xl px-4 py-3 hover:bg-white hover:border-brand-200 hover:shadow-sm transition-all duration-200">
                      <span className="text-xl shrink-0 grayscale group-hover:grayscale-0 transition-all">{getFileIcon(att.filename)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{att.filename}</p>
                        {att.size && <p className="text-[11px] font-bold text-gray-400 mt-0.5">{att.size}</p>}
                      </div>
                      <button
                        onClick={() => showToast('다운로드 기능은 실제 연동 시 제공됩니다 (데모)', 'info')}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors shrink-0"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 설문 — mobile order: 6 */}
            <div className="order-6 md:order-none bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-5 h-5 text-brand-600" />
                <span className="text-sm font-bold text-gray-900">설문 참여</span>
              </div>
              <p className="text-xs font-medium text-gray-500 mb-4 leading-relaxed">
                {surveyIntro}
              </p>
              <button
                onClick={() => setShowSurvey(true)}
                disabled={surveyDone}
                className="w-full bg-brand-600 text-white text-sm font-bold rounded-xl h-11 hover:bg-brand-500 transition-all duration-200 shadow-lg shadow-brand-100 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {surveyDone ? '설문 완료 ✓' : '설문 참여하기'}
              </button>
            </div>

            {/* 프로모션 소식 받기 — mobile only, order: 7 */}
            <button
              onClick={() => setShowEmailInfo(true)}
              className="order-7 md:hidden w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm"
            >
              <Mail className="w-4.5 h-4.5 text-gray-400" />
              프로모션 소식 받기
            </button>

            {/* 링크 — mobile order: 8 */}
            {(booth.links.instagram || booth.links.store || booth.links.site) && (
              <div className="order-8 md:order-none bg-white border border-gray-200/60 rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">공식 채널</h2>
                <div className="grid grid-cols-1 gap-2">
                  {booth.links.instagram && (
                    <a href={booth.links.instagram} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all px-3 py-2.5 rounded-xl border border-transparent hover:border-gray-100">
                      <Instagram className="w-4.5 h-4.5 text-pink-500" /> 인스타그램
                      <ExternalLink className="w-3.5 h-3.5 text-gray-300 ml-auto" />
                    </a>
                  )}
                  {booth.links.store && (
                    <a href={booth.links.store} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all px-3 py-2.5 rounded-xl border border-transparent hover:border-gray-100">
                      <ShoppingBag className="w-4.5 h-4.5 text-brand-600" /> 온라인 스토어
                      <ExternalLink className="w-3.5 h-3.5 text-gray-300 ml-auto" />
                    </a>
                  )}
                  {booth.links.site && (
                    <a href={booth.links.site} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all px-3 py-2.5 rounded-xl border border-transparent hover:border-gray-100">
                      <Globe className="w-4.5 h-4.5 text-blue-500" /> 홈페이지
                      <ExternalLink className="w-3.5 h-3.5 text-gray-300 ml-auto" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {eventScheduleCard}

          </div>

        </div>

      </div>

      {/* ═══ Mobile Sticky Bottom Bar ═══ */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-30 bg-white/95 backdrop-blur-xl border-t border-gray-200 px-4 pt-3 pb-6 safe-area-bottom shadow-[0_-8px_24px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto flex gap-2.5">
          <button
            onClick={handleToggleFav}
            className={`h-11 px-5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200 ${
              fav ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Heart className={`w-5 h-5 ${fav ? 'fill-current' : ''}`} />
            {fav ? '저장됨' : '저장'}
          </button>
          <button
            onClick={() => setShowInquiry(true)}
            disabled={!inquiryAllowed}
            className="flex-1 h-11 rounded-xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-500 transition-all duration-200 shadow-lg shadow-brand-100 disabled:opacity-40 disabled:shadow-none"
          >
            {!inquiryAllowed ? '문의 마감' : '문의하기'}
          </button>
          <button
            onClick={handleShare}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all duration-200 active:scale-95"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ═══ Share Modal ═══ */}
      <Modal open={showShare} onClose={() => setShowShare(false)} title="공유하기">
        <div className="space-y-3">
          {/* URL copy */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
            <p className="flex-1 text-xs text-gray-600 font-mono truncate">{typeof window !== 'undefined' ? window.location.href : ''}</p>
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium transition-all shrink-0 ${
                shareCopied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {shareCopied ? <><CheckCircle className="w-3.5 h-3.5" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 복사</>}
            </button>
          </div>

          {/* Share options */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleShareKakao}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#FEE500]/10 hover:bg-[#FEE500]/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#FEE500] flex items-center justify-center">
                <span className="text-[#3C1E1E] text-sm font-bold">K</span>
              </div>
              <span className="text-xs text-gray-700 font-medium">카카오톡</span>
            </button>
            <button
              onClick={() => {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(booth?.name + ' - ' + booth?.tagline)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
              }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-white text-sm font-bold">𝕏</span>
              </div>
              <span className="text-xs text-gray-700 font-medium">X (트위터)</span>
            </button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-gray-700 font-medium">더보기</span>
              </button>
            )}
          </div>

          {/* QR hint */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700">QR 코드로 공유</p>
              <p className="text-[11px] text-gray-400 mt-0.5">이 부스 페이지의 QR은 운영자가 제공합니다</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* ═══ Inquiry Modal ═══ */}
      <Modal open={showInquiry} onClose={handleCloseInquiry} title="문의 남기기" size="md">
        {inquirySent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-7 h-7 text-brand-600" />
            </div>
            <p className="font-medium text-gray-900 mb-1">문의가 전달됐어요!</p>
            <p className="text-sm text-gray-500 mb-5">
              {isLoggedIn ? '답변이 오면 알려드릴게요.' : '답변은 문의 탭에서 확인하세요.'}
            </p>
            <button onClick={handleCloseInquiry} className="w-full bg-brand-600 text-white text-sm font-medium rounded-lg h-10 hover:bg-brand-500 transition-all duration-150">
              확인
            </button>
          </div>
        ) : (
          <>
            {isLoggedIn ? (
              <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3">
                로그인 상태로 문의합니다. 답변 알림을 받을 수 있어요.
              </p>
            ) : (
              <p className="text-xs text-gray-500 mb-3">비로그인 문의 — 이메일을 남기면 답변을 받을 수 있어요.</p>
            )}
            <textarea
              value={inquiryText}
              onChange={(e) => setInquiryText(e.target.value)}
              placeholder={`${booth.name}에 궁금한 점을 남겨주세요.`}
              className="w-full h-28 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-3 resize-none outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400 mb-3"
            />
            {inquiryRateLimited && (
              <div className="mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <p className="text-xs text-red-700">하루 3건까지 문의할 수 있어요.</p>
              </div>
            )}
            <div className="space-y-3 mb-3">
              {!isLoggedIn && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">이메일 주소</label>
                    <input type="email" value={inquiryEmail} onChange={(e) => setInquiryEmail(e.target.value)}
                      placeholder="답변을 받을 이메일"
                      className="w-full h-10 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400" />
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={inquiryAbuseCheck} onChange={(e) => setInquiryAbuseCheck(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-brand-600" />
                    <span className="text-xs text-gray-500">(필수) 부적절한 문의(스팸, 광고 등)는 이용이 제한될 수 있음을 확인했습니다</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={ipTrackingConsent} onChange={(e) => setIpTrackingConsent(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-brand-600" />
                    <span className="text-xs text-gray-500">(선택) 비로그인 상태에서 방문 추적에 동의합니다<span className="text-gray-400 block">동의 시 재방문 시 이전 문의를 이어볼 수 있어요</span></span>
                  </label>
                </>
              )}
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={inquiryConsent} onChange={(e) => setInquiryConsent(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-brand-600" />
                <span className="text-xs text-gray-500">(필수) 운영자에게 {isLoggedIn ? '정보 제공' : '이메일 제공'}에 동의합니다<span className="text-gray-400 block">동의 시 운영자가 리드로 저장합니다</span></span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={inquiryConsentMarketing} onChange={(e) => setInquiryConsentMarketing(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-brand-600" />
                <span className="text-xs text-gray-500">(선택) 마케팅 정보 수신에 동의합니다<span className="text-gray-400 block">언제든 철회할 수 있어요</span></span>
              </label>
            </div>
            <button onClick={handleSendInquiry} disabled={!inquiryFormValid}
              className="w-full bg-brand-600 text-white text-sm font-medium rounded-lg h-10 hover:bg-brand-500 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
              문의 보내기
            </button>
          </>
        )}
      </Modal>

      {/* ═══ Email Info Modal ═══ */}
      <Modal open={showEmailInfo} onClose={handleCloseEmailInfo} title="프로모션 소식 받기">
        {emailInfoSent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="font-medium text-gray-900 mb-1">신청 완료!</p>
            <p className="text-sm text-gray-500 mb-5">프로모션 소식 수신 동의가 완료되었습니다.</p>
            <button onClick={handleCloseEmailInfo} className="w-full bg-brand-600 text-white text-sm font-medium rounded-lg h-10 hover:bg-brand-500 transition-all duration-150">확인</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">이벤트/프로모션 정보를 이메일로 보내드려요. (선택 수신)</p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">이메일 주소</label>
              <input type="email" value={emailInfoAddr} onChange={(e) => setEmailInfoAddr(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-10 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400" />
            </div>
            <label className="flex items-start gap-2 mb-5 cursor-pointer">
              <input type="checkbox" checked={emailInfoConsent} onChange={(e) => setEmailInfoConsent(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-brand-600" />
              <span className="text-xs text-gray-500"><span className="font-medium text-gray-700">[필수]</span> 이메일 수신 및 부스 운영자에게 정보 제공에 동의합니다</span>
            </label>
            <button onClick={handleSendEmailInfo} disabled={!emailInfoAddr.includes('@') || !emailInfoConsent}
              className="w-full bg-brand-600 text-white text-sm font-medium rounded-lg h-10 hover:bg-brand-500 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
              신청하기
            </button>
          </>
        )}
      </Modal>

      {/* ═══ Survey Modal ═══ */}
      {(() => {
        const FIELDS_PER_PAGE = 2;
        const surveyTotalPages = Math.ceil(surveyFields.length / FIELDS_PER_PAGE);
        const isLastPage = surveyPage === surveyTotalPages - 1;
        const pageFields = surveyFields.slice(surveyPage * FIELDS_PER_PAGE, (surveyPage + 1) * FIELDS_PER_PAGE);

        const renderSurveyField = (field: SurveyField) => {
          const answer = getSurveyAnswer(field.id);
          return (
            <div key={field.id}>
              <p className="text-[13px] font-semibold text-gray-900 mb-2.5">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </p>
              {field.type === 'text' && (
                <input
                  type="text"
                  value={typeof answer === 'string' ? answer : ''}
                  onChange={(e) => setSurveyTextAnswer(field.id, e.target.value)}
                  placeholder={`${field.label}을 입력해주세요`}
                  className="w-full h-10 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                />
              )}
              {field.type === 'select' && (
                <div className="space-y-2">
                  {(field.options ?? []).filter(Boolean).map((option) => (
                    <label key={option} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="radio" name={field.id} value={option} checked={answer === option}
                        onChange={() => setSurveyTextAnswer(field.id, option)} className="w-4 h-4 accent-brand-600" />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}
              {field.type === 'checkbox' && (
                <div className="flex flex-wrap gap-2">
                  {(field.options ?? []).filter(Boolean).map((option) => {
                    const checked = Array.isArray(answer) && answer.includes(option);
                    return (
                      <button key={option} onClick={() => toggleSurveyCheckboxAnswer(field.id, option)}
                        className={`text-xs font-medium rounded-lg px-3 py-1.5 border transition-all duration-150 ${
                          checked ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}>{option}</button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        };

        const contactConsentBlock = (
          <>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">연락 받기를 원해요</p>
                  <p className="text-xs text-gray-400 mt-0.5">운영자가 리드로 저장합니다</p>
                </div>
                <button onClick={() => setSurveyWantsContact((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-150 ${surveyWantsContact ? 'bg-brand-600' : 'bg-gray-200'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${surveyWantsContact ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              {surveyWantsContact && !isLoggedIn && (
                <div className="px-4 pb-4 pt-3 border-t border-gray-200 bg-white">
                  <input type="email" value={surveyContactEmail} onChange={(e) => setSurveyContactEmail(e.target.value)}
                    placeholder="연락받을 이메일 주소"
                    className="w-full h-10 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400" />
                </div>
              )}
            </div>
            <div className="space-y-2.5 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={surveyConsent} onChange={(e) => setSurveyConsent(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-brand-600" />
                <span className="text-xs text-gray-500">(필수) 개인정보 수집·이용에 동의합니다<span className="text-gray-400 block">설문 응답이 부스 운영자에게 제공됩니다</span></span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={surveyConsentMarketing} onChange={(e) => setSurveyConsentMarketing(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-brand-600" />
                <span className="text-xs text-gray-500">(선택) 마케팅 정보 수신에 동의합니다<span className="text-gray-400 block">언제든 철회할 수 있어요</span></span>
              </label>
            </div>
          </>
        );

        const desktopHeaderRight = isDesktop && !surveySent ? (
          <div className="flex items-center gap-1">
            <button onClick={() => setSurveyPage((p) => Math.max(0, p - 1))} disabled={surveyPage === 0}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold text-gray-500 tabular-nums">{surveyPage + 1}/{surveyTotalPages}</span>
            <button onClick={() => setSurveyPage((p) => Math.min(surveyTotalPages - 1, p + 1))} disabled={isLastPage}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : undefined;

        return (
          <Modal open={showSurvey} onClose={handleCloseSurvey} title="설문" size="md" headerRight={desktopHeaderRight}>
            {surveySent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="font-medium text-gray-900 mb-1">설문 완료!</p>
                <p className="text-sm text-gray-500 mb-5">소중한 의견 감사해요.</p>
                <button onClick={handleCloseSurvey} className="w-full bg-brand-600 text-white text-sm font-medium rounded-lg h-10 hover:bg-brand-500 transition-all duration-150">확인</button>
              </div>
            ) : isDesktop ? (
              /* ── Desktop: 페이지네이션 (2문항/페이지) ── */
              <div className="space-y-5">
                <div className="space-y-5">
                  {pageFields.map((field) => renderSurveyField(field))}
                </div>

                {isLastPage && (
                  <>
                    <div className="border-t border-gray-100 pt-5 space-y-5">
                      {contactConsentBlock}
                    </div>
                  </>
                )}

                {isLastPage ? (
                  <button onClick={handleSendSurvey} disabled={!surveyConsent}
                    className="w-full bg-brand-600 text-white text-sm font-medium rounded-lg h-10 hover:bg-brand-500 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed">
                    제출하기
                  </button>
                ) : (
                  <button onClick={() => setSurveyPage((p) => Math.min(surveyTotalPages - 1, p + 1))}
                    className="w-full bg-brand-600 text-white text-sm font-medium rounded-lg h-10 hover:bg-brand-500 transition-all duration-150">
                    다음
                  </button>
                )}
              </div>
            ) : (
              /* ── Mobile: 전체 스크롤 ── */
              <div className="space-y-5">
                <div className="space-y-5">
                  {surveyFields.map((field) => renderSurveyField(field))}
                </div>
                {contactConsentBlock}
                <button onClick={handleSendSurvey} disabled={!surveyConsent}
                  className="w-full bg-brand-600 text-white text-sm font-medium rounded-lg h-10 hover:bg-brand-500 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed">
                  제출하기
                </button>
              </div>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}
