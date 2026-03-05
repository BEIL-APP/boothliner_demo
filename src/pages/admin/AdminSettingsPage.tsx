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
      <div className="px-4 py-5 sm:p-6 lg:p-8 max-w-3xl">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-xl font-semibold text-gray-900">설정</h1>
          <p className="text-sm text-gray-500 mt-1">프로필, 알림, 부스 운영 설정을 관리하세요</p>
        </div>

        <div className="space-y-6">
          {/* ─── Profile ─── */}
          <section className="bg-white border border-gray-200/60 rounded-xl">
            <div className="px-5 py-4 sm:px-6 border-b border-gray-100 flex items-center gap-2.5">
              <User className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">프로필</h2>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> 이름</span>
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleProfileField('name', e.target.value)}
                    className="w-full h-9 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
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
                    className="w-full h-9 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> 연락처</span>
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleProfileField('phone', e.target.value)}
                    className="w-full h-9 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
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
                    className="w-full h-9 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" /> 소속</span>
                </label>
                <input
                  type="text"
                  value={profile.company}
                  onChange={(e) => handleProfileField('company', e.target.value)}
                  className="w-full h-9 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                />
              </div>
              <div className="pt-2">
                <button
                  onClick={() => saveSection('profile', STORAGE_KEY_PROFILE, profile)}
                  disabled={saving === 'profile'}
                  className="h-9 px-4 bg-brand-600 text-white text-[13px] font-medium rounded-lg hover:bg-brand-500 transition-all duration-150 disabled:opacity-50 inline-flex items-center gap-1.5 w-full sm:w-auto"
                >
                  {saving === 'profile' ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {saving === 'profile' ? '저장됨' : '프로필 저장'}
                </button>
              </div>
            </div>
          </section>

          {/* ─── Notification Settings ─── */}
          <section className="bg-white border border-gray-200/60 rounded-xl">
            <div className="px-5 py-4 sm:px-6 border-b border-gray-100 flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">알림 설정</h2>
            </div>
            <div className="px-5 sm:px-6 divide-y divide-gray-100">
              <Toggle
                checked={notifications.inquiryEmail}
                onChange={(v) => handleNotification('inquiryEmail', v)}
                label="문의 이메일 알림"
                description="새 문의가 들어오면 이메일로 알림을 보냅니다"
              />
              <Toggle
                checked={notifications.inquiryPush}
                onChange={(v) => handleNotification('inquiryPush', v)}
                label="문의 푸시 알림"
                description="브라우저 푸시 알림으로 즉시 확인"
              />
              <Toggle
                checked={notifications.leadNew}
                onChange={(v) => handleNotification('leadNew', v)}
                label="새 리드 알림"
                description="명함 스캔, 설문 등으로 새 리드가 생기면 알림"
              />
              <Toggle
                checked={notifications.leadDigest}
                onChange={(v) => handleNotification('leadDigest', v)}
                label="리드 일간 요약"
                description="매일 오전 9시에 전날 리드 요약을 이메일로 발송"
              />
              <Toggle
                checked={notifications.surveyAlert}
                onChange={(v) => handleNotification('surveyAlert', v)}
                label="설문 응답 알림"
                description="관람객이 설문에 참여하면 알림"
              />
              <Toggle
                checked={notifications.weeklyReport}
                onChange={(v) => handleNotification('weeklyReport', v)}
                label="주간 리포트"
                description="매주 월요일 부스 운영 통계를 이메일로 발송"
              />
            </div>
            <div className="px-5 py-3 sm:px-6 border-t border-gray-100">
              <p className="text-xs text-gray-400">알림 설정은 즉시 반영됩니다 (데모)</p>
            </div>
          </section>

          {/* ─── Operation Settings ─── */}
          <section className="bg-white border border-gray-200/60 rounded-xl">
            <div className="px-5 py-4 sm:px-6 border-b border-gray-100 flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">부스 운영 설정</h2>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              {/* Auto-reply */}
              <div>
                <Toggle
                  checked={operations.autoReply}
                  onChange={(v) => handleOperation('autoReply', v)}
                  label="자동 응답"
                  description="문의 접수 시 자동으로 첫 응답을 보냅니다"
                />
                {operations.autoReply && (
                  <div className="mt-3 animate-fade-in">
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">자동 응답 메시지</label>
                    <textarea
                      value={operations.autoReplyMessage}
                      onChange={(e) => handleOperation('autoReplyMessage', e.target.value)}
                      rows={3}
                      className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2.5 resize-none outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-5">
                <Toggle
                  checked={operations.businessHours}
                  onChange={(v) => handleOperation('businessHours', v)}
                  label="업무 시간 설정"
                  description="설정한 시간 외에는 부재중 메시지를 자동 발송합니다"
                />
                {operations.businessHours && (
                  <div className="mt-3 space-y-3 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">시작</label>
                        <input
                          type="time"
                          value={operations.businessStart}
                          onChange={(e) => handleOperation('businessStart', e.target.value)}
                          className="w-full h-9 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                        />
                      </div>
                      <span className="text-gray-300 mt-5">—</span>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">종료</label>
                        <input
                          type="time"
                          value={operations.businessEnd}
                          onChange={(e) => handleOperation('businessEnd', e.target.value)}
                          className="w-full h-9 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">부재중 메시지</label>
                      <textarea
                        value={operations.awayMessage}
                        onChange={(e) => handleOperation('awayMessage', e.target.value)}
                        rows={2}
                        className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2.5 resize-none outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => saveSection('operations', STORAGE_KEY_OPERATIONS, operations)}
                  disabled={saving === 'operations'}
                  className="h-9 px-4 bg-brand-600 text-white text-[13px] font-medium rounded-lg hover:bg-brand-500 transition-all duration-150 disabled:opacity-50 inline-flex items-center gap-1.5 w-full sm:w-auto"
                >
                  {saving === 'operations' ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {saving === 'operations' ? '저장됨' : '운영 설정 저장'}
                </button>
              </div>
            </div>
          </section>

          {/* ─── Account / Danger Zone ─── */}
          <section className="bg-white border border-gray-200/60 rounded-xl">
            <div className="px-5 py-4 sm:px-6 border-b border-gray-100 flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">계정 관리</h2>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">비밀번호 변경</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="password"
                    placeholder="현재 비밀번호"
                    className="w-full h-9 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                  />
                  <input
                    type="password"
                    placeholder="새 비밀번호"
                    className="w-full h-9 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                  />
                </div>
                <button
                  onClick={() => showToast('비밀번호가 변경됐어요 (데모)', 'success')}
                  className="mt-3 h-9 px-4 bg-white border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-all duration-150 w-full sm:w-auto"
                >
                  비밀번호 변경
                </button>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-[13px] font-medium text-red-600 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  위험 영역
                </h3>
                <p className="text-xs text-gray-500 mb-3">계정을 삭제하면 모든 부스 데이터, 리드, 문의 내역이 영구적으로 삭제됩니다.</p>
                {showDeleteConfirm ? (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4 animate-fade-in">
                    <p className="text-sm text-red-700 font-medium mb-3">정말 계정을 삭제하시겠어요?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          showToast('계정이 삭제됐어요 (데모)', 'info');
                          setShowDeleteConfirm(false);
                        }}
                        className="h-8 px-3 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-500 transition-all duration-150"
                      >
                        삭제 확인
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="h-8 px-3 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-all duration-150"
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
                    계정 삭제
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
