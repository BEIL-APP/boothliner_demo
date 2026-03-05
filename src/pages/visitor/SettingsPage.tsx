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
import { getConsentWithdrawals, requestConsentWithdrawal, retryFailedNotifications, getFailedNotificationCount } from '../../utils/localStorage';
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

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
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
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <div className="pr-4">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-[22px] rounded-full transition-colors duration-150 shrink-0 ${
          checked ? 'bg-brand-600' : 'bg-gray-200'
        }`}
      >
        <span className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-150 ${
          checked ? 'left-[22px]' : 'left-[3px]'
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
    const keys = [
      'favorites', 'visits', 'threads', 'notifications',
      STORAGE_KEY_PROFILE, STORAGE_KEY_NOTIFICATIONS, STORAGE_KEY_INTERESTS,
    ];
    keys.forEach((k) => localStorage.removeItem(k));
    showToast('모든 데이터가 삭제됐어요', 'info');
    setShowDeleteConfirm(false);
    setProfile({ name: '', email: '', company: '', position: '' });
    setInterests([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <VisitorHeader />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="max-w-2xl">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-gray-900">설정</h1>
            <p className="text-[13px] text-gray-500 mt-1">프로필, 관심 분야, 알림 설정을 관리하세요</p>
          </div>

          {/* Login nudge */}
          {!isLoggedIn && (
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                <LogIn className="w-4 h-4 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">로그인하면 설정이 유지돼요</p>
                <p className="text-xs text-gray-500 mt-0.5">비로그인 상태에서는 이 기기에만 설정이 저장됩니다.</p>
                <Link to="/auth" className="inline-block mt-2 text-[13px] font-medium text-brand-600 hover:text-brand-700 transition-colors">
                  로그인 / 가입하기 →
                </Link>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* ─── Profile ─── */}
            <section className="bg-white border border-gray-200/60 rounded-xl">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                <User className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">프로필</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                      <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> 이름</span>
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => handleProfileField('name', e.target.value)}
                      placeholder="홍길동"
                      className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                      <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> 이메일</span>
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleProfileField('email', e.target.value)}
                      placeholder="name@company.com"
                      className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                      <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" /> 소속</span>
                    </label>
                    <input
                      type="text"
                      value={profile.company}
                      onChange={(e) => handleProfileField('company', e.target.value)}
                      placeholder="회사명"
                      className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                      <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" /> 직책</span>
                    </label>
                    <input
                      type="text"
                      value={profile.position}
                      onChange={(e) => handleProfileField('position', e.target.value)}
                      placeholder="직책/역할"
                      className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => saveSection('profile', STORAGE_KEY_PROFILE, profile)}
                    disabled={saving === 'profile'}
                    className="h-10 px-4 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-500 transition-all duration-150 disabled:opacity-50 inline-flex items-center gap-1.5 w-full sm:w-auto"
                  >
                    {saving === 'profile' ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saving === 'profile' ? '저장됨' : '프로필 저장'}
                  </button>
                </div>
              </div>
            </section>

            {/* ─── Interests ─── */}
            <section className="bg-white border border-gray-200/60 rounded-xl">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">관심 분야</h2>
                </div>
                {interests.length > 0 && (
                  <span className="text-xs text-gray-400">{interests.length}개 선택</span>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs text-gray-500 mb-3">관심 분야를 선택하면 맞춤 부스를 추천받을 수 있어요</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_CATEGORIES.map((cat) => {
                    const selected = interests.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleInterest(cat)}
                        className={`text-xs font-medium rounded-lg px-3 py-1.5 border transition-all duration-150 ${
                          selected
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
            <section className="bg-white border border-gray-200/60 rounded-xl">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">알림 설정</h2>
              </div>
              <div className="px-5 divide-y divide-gray-100">
                <Toggle
                  checked={notifications.inquiryReply}
                  onChange={(v) => handleNotification('inquiryReply', v)}
                  label="문의 답변 알림"
                  description="문의에 답변이 오면 알림을 보냅니다"
                />
                <Toggle
                  checked={notifications.eventReminder}
                  onChange={(v) => handleNotification('eventReminder', v)}
                  label="이벤트 리마인더"
                  description="관심 부스의 다음 이벤트를 알려줍니다"
                />
                <Toggle
                  checked={notifications.boothUpdate}
                  onChange={(v) => handleNotification('boothUpdate', v)}
                  label="관심 부스 소식"
                  description="저장한 부스의 새 소식이 있으면 알림"
                />
                <Toggle
                  checked={notifications.newsletter}
                  onChange={(v) => handleNotification('newsletter', v)}
                  label="뉴스레터 수신"
                  description="이벤트 트렌드와 소식을 이메일로 받습니다"
                />
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">알림 설정은 즉시 반영됩니다 (데모)</p>
                {failedCount > 0 && (
                  <button
                    onClick={() => {
                      const retried = retryFailedNotifications();
                      setFailedCount(getFailedNotificationCount());
                      showToast(`${retried}건의 알림을 재시도했어요`, 'info');
                    }}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    실패 {failedCount}건 재시도
                  </button>
                )}
              </div>
            </section>

            {/* ─── Consent Withdrawal ─── */}
            <section className="bg-white border border-gray-200/60 rounded-xl">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">동의 철회</h2>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  이전에 제공한 개인정보 수집·이용 동의를 철회할 수 있어요. 철회 후에는 관련 데이터가 삭제됩니다.
                </p>

                {withdrawals.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600">처리 내역</p>
                    {withdrawals.map((w) => (
                      <div key={w.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                        <span className={`h-5 px-1.5 rounded text-[10px] font-medium inline-flex items-center ${
                          w.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                          w.status === 'PROCESSING' ? 'bg-amber-50 text-amber-700' :
                          'bg-brand-50 text-brand-700'
                        }`}>
                          {w.status === 'COMPLETED' ? '완료' : w.status === 'PROCESSING' ? '처리중' : '요청됨'}
                        </span>
                        <span className="text-xs text-gray-700">
                          {w.type === 'data_delete' ? '데이터 삭제' : '마케팅 수신 철회'}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(w.requestedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {showWithdrawForm ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 animate-fade-in">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">철회 사유 (선택)</label>
                      <input
                        type="text"
                        value={withdrawReason}
                        onChange={(e) => setWithdrawReason(e.target.value)}
                        placeholder="사유를 입력해주세요"
                        className="w-full h-9 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
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
                        className="h-9 px-4 bg-brand-600 text-white text-[13px] font-medium rounded-lg hover:bg-brand-500 transition-all duration-150"
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
                        className="h-9 px-4 text-red-600 text-[13px] font-medium bg-white border border-gray-200 rounded-lg hover:bg-red-50 transition-all duration-150"
                      >
                        데이터 삭제 요청
                      </button>
                      <button
                        onClick={() => setShowWithdrawForm(false)}
                        className="h-9 px-4 text-gray-600 text-[13px] font-medium rounded-lg hover:bg-gray-100 transition-all duration-150"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowWithdrawForm(true)}
                    className="h-9 px-4 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-150 w-full sm:w-auto"
                  >
                    동의 철회 요청
                  </button>
                )}
              </div>
            </section>

            {/* ─── Account / Data ─── */}
            <section className="bg-white border border-gray-200/60 rounded-xl">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">계정 관리</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">내 데이터 내보내기</p>
                  <p className="text-xs text-gray-500 mt-0.5 mb-3">관심 부스, 문의 내역, 설문 응답을 파일로 받을 수 있어요</p>
                  <button
                    onClick={() => showToast('데이터 내보내기 준비 중 (데모)', 'info')}
                    className="h-9 px-4 bg-white border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-all duration-150 w-full sm:w-auto"
                  >
                    데이터 내보내기
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-[13px] font-medium text-red-600 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    데이터 삭제
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">관심 부스, 방문 기록, 설정 등 이 기기에 저장된 모든 데이터를 삭제합니다.</p>
                  {showDeleteConfirm ? (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 animate-fade-in">
                      <p className="text-sm text-red-700 font-medium mb-3">정말 모든 데이터를 삭제할까요?</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={handleDeleteData}
                          className="h-9 px-4 bg-red-600 text-white text-[13px] font-medium rounded-lg hover:bg-red-500 transition-all duration-150"
                        >
                          전체 삭제
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="h-9 px-4 bg-white border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-all duration-150"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="h-9 px-4 text-red-600 text-[13px] font-medium rounded-lg hover:bg-red-50 transition-all duration-150"
                    >
                      데이터 삭제
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
