import { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Save,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Zap,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useToast } from '../../contexts/ToastContext';

interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
}

interface NotificationSettings {
  inquiryEmail: boolean;
  inquiryPush: boolean;
  leadNew: boolean;
  leadDigest: boolean;
  surveyAlert: boolean;
  weeklyReport: boolean;
}

interface OperationSettings {
  autoReply: boolean;
  autoReplyMessage: string;
  businessHours: boolean;
  businessStart: string;
  businessEnd: string;
  awayMessage: string;
}

const STORAGE_KEY_PROFILE = 'admin_profile';
const STORAGE_KEY_NOTIFICATIONS = 'admin_notification_settings';
const STORAGE_KEY_OPERATIONS = 'admin_operation_settings';

function loadJSON<T extends object>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return fallback;
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

export default function AdminSettingsPage() {
  const { showToast } = useToast();

  const [profile, setProfile] = useState<AdminProfile>(() =>
    loadJSON(STORAGE_KEY_PROFILE, {
      name: '김운영',
      email: 'admin@boothliner.com',
      phone: '010-1234-5678',
      company: 'BoothLiner Inc.',
      position: '이벤트 매니저',
    })
  );

  const [notifications, setNotifications] = useState<NotificationSettings>(() =>
    loadJSON(STORAGE_KEY_NOTIFICATIONS, {
      inquiryEmail: true,
      inquiryPush: true,
      leadNew: true,
      leadDigest: false,
      surveyAlert: true,
      weeklyReport: true,
    })
  );

  const [operations, setOperations] = useState<OperationSettings>(() =>
    loadJSON(STORAGE_KEY_OPERATIONS, {
      autoReply: false,
      autoReplyMessage: '문의 감사합니다! 빠른 시일 내에 답변드리겠습니다.',
      businessHours: false,
      businessStart: '09:00',
      businessEnd: '18:00',
      awayMessage: '현재 부재 중입니다. 업무 시간에 답변 드리겠습니다.',
    })
  );

  const [saving, setSaving] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const saveSection = (section: string, key: string, data: unknown) => {
    setSaving(section);
    localStorage.setItem(key, JSON.stringify(data));
    setTimeout(() => {
      setSaving(null);
      showToast('설정이 저장됐어요', 'success');
    }, 400);
  };

  const handleProfileField = (field: keyof AdminProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotification = (field: keyof NotificationSettings, value: boolean) => {
    const next = { ...notifications, [field]: value };
    setNotifications(next);
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(next));
  };

  const handleOperation = (field: keyof OperationSettings, value: string | boolean) => {
    setOperations((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">관리자 설정</h1>
          <p className="text-sm sm:text-base text-gray-500 font-medium mt-1">프로필 정보 및 서비스 운영 환경을 구성하세요</p>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* ─── Profile ─── */}
          <section className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden transition-all hover:border-brand-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <User className="w-4.5 h-4.5 text-gray-400" />
              </div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">운영자 프로필</h2>
            </div>
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    <span className="inline-flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> 운영자 성함</span>
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleProfileField('name', e.target.value)}
                    className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 focus:bg-white transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> 이메일 주소</span>
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleProfileField('email', e.target.value)}
                    className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 focus:bg-white transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> 비상 연락처</span>
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleProfileField('phone', e.target.value)}
                    className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 focus:bg-white transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    <span className="inline-flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> 담당 부서/직책</span>
                  </label>
                  <input
                    type="text"
                    value={profile.position}
                    onChange={(e) => handleProfileField('position', e.target.value)}
                    className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                  <span className="inline-flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> 소속 회사/기관</span>
                </label>
                <input
                  type="text"
                  value={profile.company}
                  onChange={(e) => handleProfileField('company', e.target.value)}
                  className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 focus:bg-white transition-all shadow-sm"
                />
              </div>
              <div className="pt-2">
                <button
                  onClick={() => saveSection('profile', STORAGE_KEY_PROFILE, profile)}
                  disabled={saving === 'profile'}
                  className="h-11 px-6 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-500 transition-all duration-200 disabled:opacity-50 inline-flex items-center gap-2 w-full sm:w-auto shadow-lg shadow-brand-100"
                >
                  {saving === 'profile' ? <CheckCircle className="w-4.5 h-4.5" /> : <Save className="w-4.5 h-4.5" />}
                  {saving === 'profile' ? '프로필 저장됨' : '프로필 정보 저장'}
                </button>
              </div>
            </div>
          </section>

          {/* ─── Notification Settings ─── */}
          <section className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden transition-all hover:border-brand-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <Bell className="w-4.5 h-4.5 text-gray-400" />
              </div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">워크플로우 알림</h2>
            </div>
            <div className="px-6 sm:px-8 divide-y divide-gray-100">
              <Toggle
                checked={notifications.inquiryEmail}
                onChange={(v) => handleNotification('inquiryEmail', v)}
                label="새 문의 이메일 알림"
                description="관람객이 문의를 남기면 즉시 운영자 이메일로 발송합니다"
              />
              <Toggle
                checked={notifications.inquiryPush}
                onChange={(v) => handleNotification('inquiryPush', v)}
                label="브라우저 실시간 푸시"
                description="관리자 화면 접속 중일 때 즉시 팝업으로 알려드려요"
              />
              <Toggle
                checked={notifications.leadNew}
                onChange={(v) => handleNotification('leadNew', v)}
                label="신규 리드 생성 알림"
                description="명함 스캔, 설문 등으로 새 잠재 고객이 등록되면 알림"
              />
              <Toggle
                checked={notifications.leadDigest}
                onChange={(v) => handleNotification('leadDigest', v)}
                label="리드 일간 요약 리포트"
                description="매일 오전 9시에 전날의 전체 리드 목록을 요약해 드립니다"
              />
              <Toggle
                checked={notifications.surveyAlert}
                onChange={(v) => handleNotification('surveyAlert', v)}
                label="설문 응답 개별 알림"
                description="관람객이 설문 조사를 완료할 때마다 실시간으로 확인"
              />
              <Toggle
                checked={notifications.weeklyReport}
                onChange={(v) => handleNotification('weeklyReport', v)}
                label="주간 성과 통계 리포트"
                description="매주 월요일 부스별 누적 성과 데이터를 분석해 발송"
              />
            </div>
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Settings will be applied immediately</p>
            </div>
          </section>

          {/* ─── Operation Settings ─── */}
          <section className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden transition-all hover:border-brand-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <Zap className="w-4.5 h-4.5 text-gray-400" />
              </div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">부스 운영 자동화</h2>
            </div>
            <div className="p-6 sm:p-8 space-y-6">
              {/* Auto-reply */}
              <div>
                <Toggle
                  checked={operations.autoReply}
                  onChange={(v) => handleOperation('autoReply', v)}
                  label="첫 문의 자동 응답"
                  description="관람객이 문의를 시작하면 시스템이 즉시 답변을 보냅니다"
                />
                {operations.autoReply && (
                  <div className="mt-4 animate-scale-in">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">자동 응답 메시지 내용</label>
                    <textarea
                      value={operations.autoReplyMessage}
                      onChange={(e) => handleOperation('autoReplyMessage', e.target.value)}
                      rows={3}
                      className="w-full text-sm font-medium bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-gray-50 pt-6">
                <Toggle
                  checked={operations.businessHours}
                  onChange={(v) => handleOperation('businessHours', v)}
                  label="운영 시간(영업 시간) 외 부재중"
                  description="설정된 시간 외에 들어오는 문의에 별도 메시지를 보냅니다"
                />
                {operations.businessHours && (
                  <div className="mt-4 space-y-4 animate-scale-in">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">업무 시작</label>
                        <input
                          type="time"
                          value={operations.businessStart}
                          onChange={(e) => handleOperation('businessStart', e.target.value)}
                          className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm"
                        />
                      </div>
                      <div className="pt-6 text-gray-300">—</div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">업무 종료</label>
                        <input
                          type="time"
                          value={operations.businessEnd}
                          onChange={(e) => handleOperation('businessEnd', e.target.value)}
                          className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">부재중 안내 메시지</label>
                      <textarea
                        value={operations.awayMessage}
                        onChange={(e) => handleOperation('awayMessage', e.target.value)}
                        rows={2}
                        className="w-full text-sm font-medium bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-50">
                <button
                  onClick={() => saveSection('operations', STORAGE_KEY_OPERATIONS, operations)}
                  disabled={saving === 'operations'}
                  className="h-11 px-6 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-500 transition-all duration-200 disabled:opacity-50 inline-flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-brand-100"
                >
                  {saving === 'operations' ? <CheckCircle className="w-4.5 h-4.5" /> : <Save className="w-4.5 h-4.5" />}
                  {saving === 'operations' ? '운영 설정 저장됨' : '부스 운영 설정 저장'}
                </button>
              </div>
            </div>
          </section>

          {/* ─── Account / Danger Zone ─── */}
          <section className="bg-white border border-red-100/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-red-50 bg-red-50/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-red-100 flex items-center justify-center shadow-sm">
                <Shield className="w-4.5 h-4.5 text-red-400" />
              </div>
              <h2 className="text-sm font-bold text-red-600 uppercase tracking-wider">계정 보안 및 위험 영역</h2>
            </div>
            <div className="p-6 sm:p-8 space-y-8">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 px-1">관리자 비밀번호 변경</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="password"
                    placeholder="현재 비밀번호"
                    className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all"
                  />
                  <input
                    type="password"
                    placeholder="새로운 비밀번호"
                    className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all"
                  />
                </div>
                <button
                  onClick={() => showToast('비밀번호가 변경됐어요 (데모)', 'success')}
                  className="mt-4 h-10 px-5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                >
                  비밀번호 변경 적용
                </button>
              </div>

              <div className="border-t border-red-50 pt-6">
                <h3 className="text-sm font-bold text-red-600 mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  서비스 이용 해지 (계정 탈퇴)
                </h3>
                <p className="text-[13px] text-gray-500 font-medium mb-5 leading-relaxed">관리자 계정을 삭제하면 운영 중인 모든 부스 데이터, 수집된 리드, 대화 내역이 즉시 영구 파기되며 복구할 수 없습니다.</p>
                {showDeleteConfirm ? (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-5 animate-scale-in">
                    <p className="text-sm text-red-700 font-bold mb-4">정말 계정을 영구적으로 삭제하시겠어요?</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          showToast('계정이 삭제됐어요 (데모)', 'info');
                          setShowDeleteConfirm(false);
                        }}
                        className="h-11 px-6 bg-red-600 text-white text-[13px] font-bold rounded-xl hover:bg-red-700 transition-all duration-150 shadow-md shadow-red-100"
                      >
                        네, 계정을 파기합니다
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="h-11 px-6 bg-white border border-red-200 text-red-600 text-[13px] font-bold rounded-xl hover:bg-red-50 transition-all duration-150"
                      >
                        아니오, 취소하겠습니다
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-10 px-5 text-red-600 border border-red-100 bg-red-50/50 text-xs font-bold rounded-xl hover:bg-red-100 transition-all"
                  >
                    관리자 계정 삭제 요청
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
