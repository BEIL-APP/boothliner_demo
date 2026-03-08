import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Bell,
  Tag,
  Shield,
  Save,
  CheckCircle,
  AlertTriangle,
  Mail,
  Building2,
  Briefcase,
  LogIn,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { VisitorHeader } from '../../components/VisitorHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getConsentWithdrawals,
  requestConsentWithdrawal,
  retryFailedNotifications,
  getFailedNotificationCount,
  deleteMyData,
} from '../../utils/localStorage';
import type { ConsentWithdrawal } from '../../types';

interface VisitorProfile {
  name: string;
  email: string;
  company: string;
  position: string;
}

interface VisitorNotifications {
  inquiryReply: boolean;
  eventReminder: boolean;
  boothUpdate: boolean;
  newsletter: boolean;
}

const INTEREST_CATEGORIES = [
  '식품/음료', 'IT/테크', '뷰티/화장품', '패션/의류', '건강/웰니스',
  '교육', '금융/핀테크', '물류/유통', '친환경/ESG', '스타트업',
  'B2B 서비스', '마케팅', '디자인', 'AI/ML',
];

const STORAGE_KEY_PROFILE = 'visitor_profile';
const STORAGE_KEY_NOTIFICATIONS = 'visitor_notification_settings';
const STORAGE_KEY_INTERESTS = 'visitor_interests';

function loadJSON<T extends object>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
      <div className="pr-4">
        <p className="text-sm font-bold text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-500 font-medium mt-1">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-all duration-200 shrink-0 ${
          checked ? 'bg-brand-600 shadow-lg shadow-brand-100' : 'bg-gray-200'
        }`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${
          checked ? 'left-6' : 'left-1'
        }`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<VisitorProfile>(() =>
    loadJSON(STORAGE_KEY_PROFILE, {
      name: '',
      email: '',
      company: '',
      position: '',
    })
  );

  const [notifications, setNotifications] = useState<VisitorNotifications>(() =>
    loadJSON(STORAGE_KEY_NOTIFICATIONS, {
      inquiryReply: true,
      eventReminder: true,
      boothUpdate: false,
      newsletter: false,
    })
  );

  const [interests, setInterests] = useState<string[]>(() =>
    loadJSON(STORAGE_KEY_INTERESTS, [])
  );

  const [saving, setSaving] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [withdrawals, setWithdrawals] = useState<ConsentWithdrawal[]>(() => getConsentWithdrawals());
  const [withdrawReason, setWithdrawReason] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [failedCount, setFailedCount] = useState(() => getFailedNotificationCount());

  const saveSection = (section: string, key: string, data: unknown) => {
    setSaving(section);
    localStorage.setItem(key, JSON.stringify(data));
    setTimeout(() => {
      setSaving(null);
      showToast('설정이 저장됐어요', 'success');
    }, 400);
  };

  const handleProfileField = (field: keyof VisitorProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotification = (field: keyof VisitorNotifications, value: boolean) => {
    const next = { ...notifications, [field]: value };
    setNotifications(next);
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(next));
  };

  const toggleInterest = (cat: string) => {
    setInterests((prev) => {
      const next = prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat];
      localStorage.setItem(STORAGE_KEY_INTERESTS, JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteData = () => {
    deleteMyData();
    showToast('모든 데이터가 삭제됐어요', 'info');
    setShowDeleteConfirm(false);
    setProfile({ name: '', email: '', company: '', position: '' });
    setInterests([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <VisitorHeader />

      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 pb-24">
        <div className="max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">설정</h1>
            <p className="text-sm sm:text-base text-gray-500 font-medium mt-1">프로필, 관심 분야, 알림 설정을 관리하세요</p>
          </div>

          {/* Login nudge */}
          {!isLoggedIn && (
            <div className="mb-8 bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
              <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                <LogIn className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">로그인하면 설정이 안전하게 유지돼요</p>
                <p className="text-[13px] text-gray-500 mt-1 font-medium leading-relaxed">비로그인 상태에서는 이 기기의 브라우저에만 설정이 임시로 저장됩니다.</p>
                <Link to="/auth" className="inline-block mt-3 text-[13px] font-bold text-brand-600 hover:text-brand-700 underline">
                  지금 로그인 / 가입하기 →
                </Link>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* ─── Profile ─── */}
            <section className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center gap-2.5">
                <User className="w-4.5 h-4.5 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">프로필 설정</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      <span className="inline-flex items-center gap-1.5"><User className="w-3 h-3" /> 이름</span>
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => handleProfileField('name', e.target.value)}
                      placeholder="홍길동"
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 focus:bg-white transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      <span className="inline-flex items-center gap-1.5"><Mail className="w-3 h-3" /> 이메일</span>
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleProfileField('email', e.target.value)}
                      placeholder="name@company.com"
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 focus:bg-white transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      <span className="inline-flex items-center gap-1.5"><Building2 className="w-3 h-3" /> 소속 회사</span>
                    </label>
                    <input
                      type="text"
                      value={profile.company}
                      onChange={(e) => handleProfileField('company', e.target.value)}
                      placeholder="회사명"
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 focus:bg-white transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      <span className="inline-flex items-center gap-1.5"><Briefcase className="w-3 h-3" /> 담당 직책</span>
                    </label>
                    <input
                      type="text"
                      value={profile.position}
                      onChange={(e) => handleProfileField('position', e.target.value)}
                      placeholder="직책/역할"
                      className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 focus:bg-white transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => saveSection('profile', STORAGE_KEY_PROFILE, profile)}
                    disabled={saving === 'profile'}
                    className="h-11 px-6 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-500 transition-all duration-200 disabled:opacity-50 inline-flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-brand-100"
                  >
                    {saving === 'profile' ? <CheckCircle className="w-4.5 h-4.5" /> : <Save className="w-4.5 h-4.5" />}
                    {saving === 'profile' ? '변경사항 저장됨' : '프로필 정보 저장'}
                  </button>
                </div>
              </div>
            </section>

            {/* ─── Interests ─── */}
            <section className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Tag className="w-4.5 h-4.5 text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">관심 분야</h2>
                </div>
                {interests.length > 0 && (
                  <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md uppercase">{interests.length} Selected</span>
                )}
              </div>
              <div className="p-6">
                <p className="text-[13px] text-gray-500 font-medium mb-4">관심 분야를 선택하면 나에게 맞는 부스를 더 정확하게 추천해 드려요</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_CATEGORIES.map((cat) => {
                    const selected = interests.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleInterest(cat)}
                        className={`text-xs font-bold rounded-lg px-3.5 py-2 border transition-all duration-200 ${
                          selected
                            ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-100'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ─── Notification Settings ─── */}
            <section className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center gap-2.5">
                <Bell className="w-4.5 h-4.5 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">알림 설정</h2>
              </div>
              <div className="px-6 divide-y divide-gray-50">
                <Toggle
                  checked={notifications.inquiryReply}
                  onChange={(v) => handleNotification('inquiryReply', v)}
                  label="문의 답변 알림"
                  description="부스 운영자가 내 문의에 답변을 남기면 즉시 알려드려요"
                />
                <Toggle
                  checked={notifications.eventReminder}
                  onChange={(v) => handleNotification('eventReminder', v)}
                  label="이벤트 시작 알림"
                  description="관심 등록한 부스가 참여하는 행사의 시작일을 알려드려요"
                />
                <Toggle
                  checked={notifications.boothUpdate}
                  onChange={(v) => handleNotification('boothUpdate', v)}
                  label="부스 업데이트 소식"
                  description="저장한 부스의 새로운 자료나 공지사항이 올라오면 알림"
                />
                <Toggle
                  checked={notifications.newsletter}
                  onChange={(v) => handleNotification('newsletter', v)}
                  label="BoothLiner 뉴스레터"
                  description="전시회 트렌드와 추천 부스 소식을 이메일로 받아봅니다"
                />
              </div>
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">Real-time update enabled</p>
                {failedCount > 0 && (
                  <button
                    onClick={() => {
                      const retried = retryFailedNotifications();
                      setFailedCount(getFailedNotificationCount());
                      showToast(`${retried}건의 알림을 재시도했어요`, 'info');
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-[11px] text-amber-700 font-bold border border-amber-100 hover:bg-amber-100 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    전송 실패 {failedCount}건 재시도
                  </button>
                )}
              </div>
            </section>

            {/* ─── Consent Withdrawal ─── */}
            <section className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center gap-2.5">
                <FileText className="w-4.5 h-4.5 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">데이터 동의 관리</h2>
              </div>
              <div className="p-6 space-y-5">
                <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                  이전에 제공한 개인정보 수집 및 이용 동의를 언제든지 철회할 수 있습니다. 철회 즉시 해당 목적을 위한 데이터 활용이 중단됩니다.
                </p>

                {withdrawals.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">최근 처리 내역</p>
                    {withdrawals.map((w) => (
                      <div key={w.id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 group">
                        <span className={`h-5 px-2 rounded font-bold text-[10px] uppercase inline-flex items-center ${
                          w.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                          w.status === 'PROCESSING' ? 'bg-amber-50 text-amber-700' :
                          'bg-brand-50 text-brand-700'
                        }`}>
                          {w.status === 'COMPLETED' ? 'COMPLETED' : w.status === 'PROCESSING' ? 'PROCESSING' : 'REQUESTED'}
                        </span>
                        <span className="text-sm font-bold text-gray-700">
                          {w.type === 'data_delete' ? '데이터 영구 삭제' : '마케팅 정보 수신 철회'}
                        </span>
                        <span className="text-[11px] font-bold text-gray-400 ml-auto uppercase">
                          {new Date(w.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {showWithdrawForm ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4 animate-scale-in">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">철회 사유 (선택 사항)</label>
                      <input
                        type="text"
                        value={withdrawReason}
                        onChange={(e) => setWithdrawReason(e.target.value)}
                        placeholder="이유를 알려주시면 서비스 개선에 큰 도움이 됩니다"
                        className="w-full h-10 bg-white border border-gray-200 rounded-xl px-4 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all placeholder:text-gray-400"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => {
                          requestConsentWithdrawal('marketing_opt_out', withdrawReason || undefined);
                          setWithdrawals(getConsentWithdrawals());
                          setWithdrawReason('');
                          setShowWithdrawForm(false);
                          showToast('마케팅 수신 동의가 철회됐어요', 'success');
                        }}
                        className="h-10 px-5 bg-brand-600 text-white text-[13px] font-bold rounded-xl hover:bg-brand-500 transition-all duration-150 shadow-md shadow-brand-100"
                      >
                        마케팅 수신 철회
                      </button>
                      <button
                        onClick={() => {
                          requestConsentWithdrawal('data_delete', withdrawReason || undefined);
                          setWithdrawals(getConsentWithdrawals());
                          setWithdrawReason('');
                          setShowWithdrawForm(false);
                          showToast('데이터 삭제가 요청됐어요. 처리까지 최대 3일 소요됩니다.', 'info');
                        }}
                        className="h-10 px-5 text-red-600 text-[13px] font-bold bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-all duration-150"
                      >
                        데이터 삭제 요청
                      </button>
                      <button
                        onClick={() => setShowWithdrawForm(false)}
                        className="h-10 px-5 text-gray-500 text-[13px] font-bold rounded-xl hover:bg-gray-100 transition-all duration-150"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowWithdrawForm(true)}
                    className="h-11 px-6 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 w-full sm:w-auto shadow-sm"
                  >
                    동의 철회 요청하기
                  </button>
                )}
              </div>
            </section>

            {/* ─── Account / Data ─── */}
            <section className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center gap-2.5">
                <Shield className="w-4.5 h-4.5 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">계정 및 보안</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-sm font-bold text-gray-800">내 활동 데이터 내보내기</p>
                  <p className="text-[13px] text-gray-500 font-medium mt-1 mb-4">관심 부스, 문의 내역, 설문 응답을 JSON/CSV 파일로 백업할 수 있습니다</p>
                  <button
                    onClick={() => showToast('데이터 내보내기 준비 중 (데모)', 'info')}
                    className="h-10 px-5 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 w-full sm:w-auto shadow-sm"
                  >
                    데이터 내보내기 시작
                  </button>
                </div>

                <div className="border-t border-gray-50 pt-6">
                  <h3 className="text-sm font-bold text-red-600 mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    서비스 탈퇴 및 데이터 전체 삭제
                  </h3>
                  <p className="text-[13px] text-gray-500 font-medium mb-4 leading-relaxed">이 기기에 저장된 모든 활동 기록과 설정이 즉시 삭제되며 복구할 수 없습니다.</p>
                  {showDeleteConfirm ? (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 animate-scale-in">
                      <p className="text-sm text-red-700 font-bold mb-4">정말 모든 데이터를 영구적으로 삭제할까요?</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={handleDeleteData}
                          className="h-10 px-5 bg-red-600 text-white text-[13px] font-bold rounded-xl hover:bg-red-700 transition-all duration-150 shadow-md shadow-red-100"
                        >
                          네, 지금 삭제합니다
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="h-10 px-5 bg-white border border-red-200 text-red-600 text-[13px] font-bold rounded-xl hover:bg-red-50 transition-all duration-150"
                        >
                          아니오, 취소할게요
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="h-10 px-5 text-red-600 border border-red-100 bg-red-50/50 text-[13px] font-bold rounded-xl hover:bg-red-100 transition-all duration-200"
                    >
                      데이터 영구 삭제
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
