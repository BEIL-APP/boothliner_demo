import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Users, Crown, UserCheck, UserPlus, Trash2, Clock, Mail, Shield,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useBooth } from '../../hooks/useBooths';
import { useToast } from '../../contexts/ToastContext';
import {
  getBoothStaff, saveStaff, deleteStaff,
} from '../../utils/localStorage';
import type { StaffMember } from '../../types';

function RoleBadge({ role }: { role: StaffMember['role'] }) {
  if (role === 'owner') {
    return (
      <span className="inline-flex items-center gap-1 h-6 px-2 text-xs font-medium text-amber-700 bg-amber-50 rounded-md">
        <Crown className="w-3 h-3" /> 오너
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 h-6 px-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-md">
      <UserCheck className="w-3 h-3" /> 스태프
    </span>
  );
}

function StatusBadge({ status }: { status: StaffMember['status'] }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 h-6 px-2 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> 활성
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 h-6 px-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-md">
      <Clock className="w-3 h-3" /> 초대 중
    </span>
  );
}

export default function AdminBoothTeamPage() {
  const { boothId } = useParams<{ boothId: string }>();
  const { booth } = useBooth(boothId ?? '');
  const { showToast } = useToast();

  const [members, setMembers] = useState<StaffMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'staff'>('staff');
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (boothId) setMembers(getBoothStaff(boothId));
  }, [boothId]);

  const reload = () => {
    if (boothId) setMembers(getBoothStaff(boothId));
  };

  const handleInvite = () => {
    if (!inviteEmail.includes('@') || !inviteName.trim() || !boothId) {
      showToast('이름과 이메일을 입력해주세요', 'error');
      return;
    }
    const member: StaffMember = {
      id: `staff-${Date.now()}`,
      boothId,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'pending',
      invitedAt: new Date().toISOString(),
    };
    saveStaff(member);
    reload();
    setInviteEmail('');
    setInviteName('');
    setShowInvite(false);
    showToast(`${inviteEmail}에 초대장을 보냈어요 (데모)`, 'success');
  };

  const handleActivate = (member: StaffMember) => {
    saveStaff({ ...member, status: 'active' });
    reload();
    showToast('팀원을 활성화했어요', 'success');
  };

  const handleRoleChange = (member: StaffMember, role: 'owner' | 'staff') => {
    saveStaff({ ...member, role });
    reload();
    showToast('권한이 변경됐어요', 'info');
  };

  const handleDelete = (id: string) => {
    deleteStaff(id);
    reload();
    showToast('팀원을 제거했어요', 'info');
  };

  if (!booth) {
    return (
      <AdminLayout>
        <div className="px-4 py-5 sm:p-6 lg:p-8 text-center">
          <p className="text-sm text-gray-500">부스를 찾을 수 없어요</p>
          <Link to="/admin/booths" className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block transition-all duration-150">
            ← 목록으로
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const activeMembers = members.filter((m) => m.status === 'active');
  const pendingMembers = members.filter((m) => m.status === 'pending');

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 lg:mb-8">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link
              to={`/admin/booths/${boothId}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-150 shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">팀 관리</h1>
              <p className="text-sm text-gray-500 mt-1 truncate">{booth.name} 부스의 운영 팀</p>
            </div>
          </div>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center justify-center gap-2 h-9 text-[13px] font-medium text-white bg-brand-600 rounded-lg px-4 hover:bg-brand-500 transition-all duration-150 w-full sm:w-auto shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            팀원 초대
          </button>
        </div>

        {/* Invite Form */}
        {showInvite && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">새 팀원 초대</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">이름</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">역할</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'owner' | 'staff')}
                    className="w-full h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                  >
                    <option value="staff">스태프</option>
                    <option value="owner">오너</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">이메일</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={handleInvite}
                  className="flex-1 h-9 text-[13px] font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-500 transition-all duration-150"
                >
                  초대 보내기 (데모)
                </button>
                <button
                  onClick={() => setShowInvite(false)}
                  className="h-9 px-4 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-150"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Members */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">활성 팀원</h2>
            <span className="inline-flex items-center h-5 px-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-md ml-auto">
              {activeMembers.length}명
            </span>
          </div>

          {activeMembers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">활성 팀원이 없어요</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {activeMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-sm font-semibold text-gray-600">
                    {m.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{m.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-400 truncate">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
                    <RoleBadge role={m.role} />
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m, e.target.value as 'owner' | 'staff')}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600 bg-white h-7 transition-all hidden sm:block"
                    >
                      <option value="staff">스태프</option>
                      <option value="owner">오너</option>
                    </select>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-all duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invites */}
        {pendingMembers.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Clock className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">초대 대기 중</h2>
              <span className="inline-flex items-center h-5 px-2 text-xs font-medium text-amber-700 bg-amber-50 rounded-md ml-auto">
                {pendingMembers.length}건
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {pendingMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-sm font-semibold text-gray-500">
                    {m.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
                    <StatusBadge status={m.status} />
                    <RoleBadge role={m.role} />
                    <button
                      onClick={() => handleActivate(m)}
                      className="text-xs text-gray-600 hover:text-gray-900 font-medium transition-all duration-150"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-all duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Permission Enforcement Notice */}
        <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4 sm:p-5 flex items-start gap-3">
          <Shield className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">권한 제어가 적용되고 있어요</p>
            <p className="text-xs text-amber-600 mt-1 leading-relaxed">
              스태프는 문의 응답과 리드 조회만 가능하며, 부스 설정·팀원 관리·데이터 내보내기는 오너만 접근할 수 있습니다. 
              현재 데모에서는 모든 기능에 접근 가능하지만, 실제 환경에서는 역할에 따라 메뉴가 제한됩니다.
            </p>
          </div>
        </div>

        {/* Role Description */}
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
          <p className="text-[13px] font-medium text-gray-500 uppercase tracking-wider mb-3">권한 안내</p>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2">
              <Crown className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-700">오너 (Owner)</p>
                <p className="text-xs text-gray-400">부스 설정, 팀원 관리, 리드·문의 전체 접근</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <UserCheck className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-700">스태프 (Staff)</p>
                <p className="text-xs text-gray-400">문의 응답, 리드 조회 (설정 변경 불가)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
