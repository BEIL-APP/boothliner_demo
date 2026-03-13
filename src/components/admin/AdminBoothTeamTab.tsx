import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Crown,
  UserCheck,
  UserPlus,
  Trash2,
  Clock,
  Mail,
  Shield,
  Calendar,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { getAllStaff, getBoothStaff, saveStaff, deleteStaff, getBoothParticipations, getEvents } from '../../utils/localStorage';
import type { StaffMember, BoothEventParticipation, BoothEvent } from '../../types';

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

export function AdminBoothTeamTab({ boothId }: { boothId: string }) {
  const { showToast } = useToast();
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [allMembers, setAllMembers] = useState<StaffMember[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignPicker, setShowAssignPicker] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'staff' | 'owner'>('staff');
  const [newEventId, setNewEventId] = useState<string>('');
  const [assignEventId, setAssignEventId] = useState<string>('');
  const [participations, setParticipations] = useState<BoothEventParticipation[]>([]);
  const [events, setEvents] = useState<BoothEvent[]>([]);

  useEffect(() => {
    setMembers(getBoothStaff(boothId));
    setAllMembers(getAllStaff());
    setParticipations(getBoothParticipations(boothId));
    setEvents(getEvents());
  }, [boothId]);

  const eventOptions = participations
    .map((p) => ({ participation: p, event: events.find((e) => e.id === p.eventId) }))
    .filter((item): item is { participation: BoothEventParticipation; event: BoothEvent } => Boolean(item.event));

  const getEventName = (eventId?: string) => {
    if (!eventId) return '전체 행사 공통';
    return events.find((e) => e.id === eventId)?.name ?? eventId;
  };

  const reload = () => {
    setMembers(getBoothStaff(boothId));
    setAllMembers(getAllStaff());
  };

  // Unassigned people (not yet assigned to this booth)
  const unassignedPeople = useMemo(() => {
    const assignedEmails = new Set(members.map((m) => m.email));
    const seen = new Set<string>();
    return allMembers.filter((m) => {
      if (assignedEmails.has(m.email)) return false;
      if (seen.has(m.email)) return false;
      seen.add(m.email);
      return true;
    });
  }, [allMembers, members]);

  const handleAdd = () => {
    if (!newEmail.includes('@') || !newName.trim()) {
      showToast('이름과 이메일을 확인해주세요', 'error');
      return;
    }
    // Create base record (unassigned) if not exists
    const exists = allMembers.some((m) => m.email === newEmail.trim());
    if (!exists) {
      saveStaff({
        id: `staff-${Date.now()}-base`,
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        status: 'pending',
        invitedAt: new Date().toISOString(),
      });
    }
    // Create booth assignment record
    const alreadyAssigned = members.some((m) => m.email === newEmail.trim());
    if (alreadyAssigned) {
      showToast('이미 이 부스에 배치된 팀원이에요', 'error');
      return;
    }
    saveStaff({
      id: `staff-${Date.now()}-${boothId}`,
      boothId,
      eventId: newEventId || undefined,
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      status: 'pending',
      invitedAt: new Date().toISOString(),
    });
    reload();
    setNewName('');
    setNewEmail('');
    setNewRole('staff');
    setNewEventId('');
    setShowAddForm(false);
    showToast('팀원을 추가하고 이 부스에 배치했어요', 'success');
  };

  const handleAssignExisting = (person: StaffMember) => {
    saveStaff({
      id: `staff-${Date.now()}-${boothId}`,
      boothId,
      eventId: assignEventId || undefined,
      name: person.name,
      email: person.email,
      role: person.role,
      status: person.status,
      invitedAt: new Date().toISOString(),
    });
    reload();
    setShowAssignPicker(false);
    setAssignEventId('');
    showToast(`${person.name}을(를) 이 부스에 배치했어요`, 'success');
  };

  const handleEventChange = (member: StaffMember, eventId: string) => {
    saveStaff({ ...member, eventId: eventId || undefined });
    reload();
    showToast('담당 행사가 변경됐어요', 'info');
  };

  const handleRoleChange = (member: StaffMember, role: 'owner' | 'staff') => {
    saveStaff({ ...member, role });
    reload();
    showToast('권한이 변경됐어요', 'info');
  };

  const handleRemove = (memberId: string) => {
    deleteStaff(memberId);
    reload();
    showToast('이 부스에서 제외했어요', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => { setShowAddForm(!showAddForm); setShowAssignPicker(false); }}
          className="flex items-center justify-center gap-1.5 bg-brand-600 text-white hover:bg-brand-500 h-9 px-4 text-[13px] font-bold rounded-lg transition-all duration-150 shadow-md shadow-brand-100"
        >
          <UserPlus className="w-4 h-4" />
          팀원 추가
        </button>
        {unassignedPeople.length > 0 && (
          <button
            onClick={() => { setShowAssignPicker(!showAssignPicker); setShowAddForm(false); }}
            className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-9 px-4 text-[13px] font-medium rounded-lg transition-all duration-150"
          >
            <UserPlus className="w-4 h-4" />
            기존 팀원 배치
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white border-2 border-brand-200 rounded-xl p-5 shadow-lg animate-scale-in">
          <p className="text-sm font-bold text-gray-900 mb-4">새 팀원 추가</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">이름 *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="홍길동"
                className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">이메일 *</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">역할</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'staff' | 'owner')}
                className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
              >
                <option value="staff">스태프</option>
                <option value="owner">오너</option>
              </select>
            </div>
          </div>
          {eventOptions.length > 0 && (
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />담당 행사
              </label>
              <select
                value={newEventId}
                onChange={(e) => setNewEventId(e.target.value)}
                className="w-full sm:w-64 h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
              >
                <option value="">전체 행사 공통</option>
                {eventOptions.map(({ event }) => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>
          )}
          <p className="text-xs text-gray-400 mb-4">추가 시 이 부스에 자동 배치됩니다</p>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newEmail.includes('@')}
              className="h-10 px-5 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-all duration-150 disabled:opacity-40 shadow-md shadow-brand-100"
            >
              추가하기
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewName(''); setNewEmail(''); }}
              className="h-10 px-4 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-150"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Assign existing picker */}
      {showAssignPicker && unassignedPeople.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-lg animate-scale-in">
          <p className="text-sm font-bold text-gray-900 mb-1">기존 팀원 배치</p>
          <p className="text-xs text-gray-400 mb-4">아직 이 부스에 배치되지 않은 팀원을 선택하세요</p>
          {eventOptions.length > 0 && (
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />담당 행사
              </label>
              <select
                value={assignEventId}
                onChange={(e) => setAssignEventId(e.target.value)}
                className="w-full sm:w-64 h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
              >
                <option value="">전체 행사 공통</option>
                {eventOptions.map(({ event }) => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {unassignedPeople.map((person) => (
              <div key={person.email} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-gray-600">
                  {person.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{person.name}</p>
                  <p className="text-xs text-gray-400 truncate">{person.email}</p>
                </div>
                <button
                  onClick={() => handleAssignExisting(person)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 rounded-lg transition-all"
                >
                  배치
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowAssignPicker(false)}
            className="mt-3 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            닫기
          </button>
        </div>
      )}

      {/* Team Members — unified list */}
      <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <Users className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">팀원 목록</h2>
          <span className="inline-flex items-center h-5 px-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-md ml-auto">
            {members.length}명
          </span>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-10">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">이 부스에 배치된 팀원이 없어요</p>
            <p className="text-xs text-gray-300 mt-1">팀원을 추가하거나 기존 팀원을 배치해보세요</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((m) => (
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
                  <div className="flex items-center gap-1.5 mt-1">
                    <RoleBadge role={m.role} />
                    <StatusBadge status={m.status} />
                    {m.eventId && (
                      <span className="inline-flex items-center gap-1 h-6 px-2 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-md">
                        <Calendar className="w-3 h-3" /> {getEventName(m.eventId)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {eventOptions.length > 0 && (
                    <select
                      value={m.eventId ?? ''}
                      onChange={(e) => handleEventChange(m, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600 bg-white h-8 transition-all hidden sm:block"
                    >
                      <option value="">공통</option>
                      {eventOptions.map(({ event }) => (
                        <option key={event.id} value={event.id}>{event.name}</option>
                      ))}
                    </select>
                  )}
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m, e.target.value as 'owner' | 'staff')}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600 bg-white h-8 transition-all hidden sm:block"
                  >
                    <option value="staff">스태프</option>
                    <option value="owner">오너</option>
                  </select>
                  <button
                    onClick={() => handleRemove(m.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150"
                    title="이 부스에서 제외"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 sm:p-5 flex items-start gap-3">
        <Shield className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">권한 제어가 적용되고 있어요</p>
          <p className="text-xs text-amber-600 mt-1 leading-relaxed">
            스태프는 문의 응답과 리드 조회만 가능하며, 부스 설정·팀원 관리·데이터 내보내기는 오너만 접근할 수 있습니다.
            현재 데모에서는 모든 기능에 접근 가능하지만, 실제 환경에서는 역할에 따라 메뉴가 제한됩니다.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
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
  );
}
