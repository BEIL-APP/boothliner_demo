import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown,
  UserCheck,
  Clock,
  Mail,
  Trash2,
  Building2,
  Calendar,
  ArrowRight,
  Plus,
  Users,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useBooths } from '../../hooks/useBooths';
import { useToast } from '../../contexts/ToastContext';
import { getAllStaff, getEvents, saveStaff, deleteStaff } from '../../utils/localStorage';
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

export default function AdminTeamPage() {
  const { booths } = useBooths();
  const { showToast } = useToast();
  const [members, setMembers] = useState<StaffMember[]>(() => getAllStaff());
  const [selectedBooth, setSelectedBooth] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');
  const events = getEvents();

  // ─── Add member form ───
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'staff' | 'owner'>('staff');
  const [newBoothIds, setNewBoothIds] = useState<string[]>([]);
  const [newEventId, setNewEventId] = useState('');

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (selectedBooth !== 'all' && member.boothId !== selectedBooth) return false;
      if (selectedEvent !== 'all' && member.eventId !== selectedEvent) return false;
      return true;
    });
  }, [members, selectedBooth, selectedEvent]);

  const groupedMembers = useMemo(() => {
    return booths
      .filter((booth) => selectedBooth === 'all' || booth.id === selectedBooth)
      .map((booth) => ({
        booth,
        members: filteredMembers.filter((member) => member.boothId === booth.id),
      }))
      .filter((group) => group.members.length > 0);
  }, [booths, filteredMembers, selectedBooth]);

  // Group by email for flat list view
  const membersByEmail = useMemo(() => {
    const map = new Map<string, StaffMember[]>();
    filteredMembers.forEach((m) => {
      const list = map.get(m.email) ?? [];
      list.push(m);
      map.set(m.email, list);
    });
    return Array.from(map.values());
  }, [filteredMembers]);

  const uniqueCount = membersByEmail.length;

  const refresh = () => setMembers(getAllStaff());

  const toggleNewBooth = (boothId: string) => {
    setNewBoothIds((prev) =>
      prev.includes(boothId) ? prev.filter((id) => id !== boothId) : [...prev, boothId],
    );
  };

  const handleAdd = () => {
    if (!newName.trim() || !newEmail.includes('@') || newBoothIds.length === 0) {
      showToast('이름, 이메일, 부스를 확인해주세요', 'error');
      return;
    }
    const existing = members.filter((m) => m.email === newEmail.trim());
    const duplicateBooths = newBoothIds.filter((bid) => existing.some((m) => m.boothId === bid));
    const boothsToAdd = newBoothIds.filter((bid) => !duplicateBooths.includes(bid));

    if (boothsToAdd.length === 0) {
      showToast('이미 해당 부스에 등록된 팀원이에요', 'error');
      return;
    }

    boothsToAdd.forEach((boothId, i) => {
      const member: StaffMember = {
        id: `staff-${Date.now()}-${i}`,
        boothId,
        eventId: newEventId || undefined,
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        status: 'pending',
        invitedAt: new Date().toISOString(),
      };
      saveStaff(member);
    });

    refresh();
    setNewName('');
    setNewEmail('');
    setNewRole('staff');
    setNewBoothIds([]);
    setNewEventId('');
    setShowAddForm(false);
    const count = boothsToAdd.length;
    showToast(
      count === 1
        ? '팀원을 추가했어요'
        : `${count}개 부스에 팀원을 추가했어요${duplicateBooths.length > 0 ? ` (중복 ${duplicateBooths.length}개 제외)` : ''}`,
      'success',
    );
  };

  const handleDelete = (memberId: string) => {
    deleteStaff(memberId);
    refresh();
    showToast('팀원을 제거했어요', 'info');
  };

  const handleActivate = (member: StaffMember) => {
    saveStaff({ ...member, status: 'active' });
    refresh();
    showToast('팀원을 활성화했어요', 'success');
  };

  const handleRoleChange = (member: StaffMember, role: 'owner' | 'staff') => {
    saveStaff({ ...member, role });
    refresh();
    showToast('권한이 변경됐어요', 'info');
  };

  const handleBoothChange = (member: StaffMember, boothId: string) => {
    saveStaff({ ...member, boothId });
    refresh();
    showToast('소속 부스가 변경됐어요', 'info');
  };

  const handleEventChange = (member: StaffMember, eventId: string) => {
    saveStaff({ ...member, eventId: eventId || undefined });
    refresh();
    showToast('담당 행사가 변경됐어요', 'info');
  };

  const renderMemberRow = (member: StaffMember, showBoothName?: boolean) => {
    const eventName = member.eventId ? events.find((event) => event.id === member.eventId)?.name : null;
    const boothName = booths.find((b) => b.id === member.boothId)?.name;
    return (
      <div key={member.id} className="flex items-start sm:items-center gap-3 py-3.5 first:pt-0 last:pb-0">
        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-sm font-semibold text-gray-600">
          {member.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{member.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3 text-gray-400 shrink-0" />
            <p className="text-xs text-gray-400 truncate">{member.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <StatusBadge status={member.status} />
            <RoleBadge role={member.role} />
            {showBoothName && boothName && (
              <span className="inline-flex items-center gap-1 h-6 px-2 text-xs font-medium text-brand-700 bg-brand-50 rounded-md">
                <Building2 className="w-3 h-3" /> {boothName}
              </span>
            )}
            {eventName ? (
              <span className="inline-flex items-center gap-1 h-6 px-2 text-xs font-medium text-sky-700 bg-sky-50 rounded-md">
                <Calendar className="w-3 h-3" /> {eventName}
              </span>
            ) : (
              <span className="inline-flex items-center h-6 px-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-md">
                전체 행사 공통
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-2 shrink-0">
          <select
            value={member.boothId}
            onChange={(e) => handleBoothChange(member, e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600 bg-white h-8 transition-all w-28 truncate"
          >
            {booths.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            value={member.eventId ?? ''}
            onChange={(e) => handleEventChange(member, e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600 bg-white h-8 transition-all w-28 truncate"
          >
            <option value="">전체 행사</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
          <select
            value={member.role}
            onChange={(e) => handleRoleChange(member, e.target.value as 'owner' | 'staff')}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600 bg-white h-8 transition-all hidden sm:block"
          >
            <option value="staff">스태프</option>
            <option value="owner">오너</option>
          </select>
          <div className="flex items-center gap-1">
            {member.status === 'pending' && (
              <button
                onClick={() => handleActivate(member)}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-all duration-150 px-2 py-1"
              >
                수락
              </button>
            )}
            <button
              onClick={() => handleDelete(member.id)}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-all duration-150"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">전체 팀원 관리</h1>
            <p className="text-sm text-gray-500 font-medium">
              부스와 행사 기준으로 전체 운영팀을 한 번에 관리합니다
              <span className="ml-2 text-xs text-gray-400">총 {new Set(members.map((m) => m.email)).size}명</span>
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-500 transition-all duration-200 shadow-md shadow-brand-100 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">팀원 추가</span>
          </button>
        </div>

        {/* Add member form */}
        {showAddForm && (
          <div className="bg-white border-2 border-brand-200 rounded-xl p-5 mb-6 shadow-lg animate-scale-in">
            <p className="text-sm font-bold text-gray-900 mb-4">새 팀원 추가</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
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
              <div className="sm:col-span-2">
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  소속 부스 * <span className="text-gray-400 font-normal">({newBoothIds.length}개 선택)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {booths.map((b) => {
                    const selected = newBoothIds.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => toggleNewBooth(b.id)}
                        className={`text-xs font-medium rounded-lg px-3 py-1.5 border transition-all duration-150 ${
                          selected
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">담당 행사</label>
                <select
                  value={newEventId}
                  onChange={(e) => setNewEventId(e.target.value)}
                  className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
                >
                  <option value="">전체 행사 공통</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
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
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || !newEmail.includes('@') || newBoothIds.length === 0}
                className="h-10 px-5 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-all duration-150 disabled:opacity-40 shadow-md shadow-brand-100"
              >
                추가하기
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewName(''); setNewEmail(''); setNewBoothIds([]); }}
                className="h-10 px-4 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-150"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* Filters + view toggle */}
        <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">부스</label>
              <select
                value={selectedBooth}
                onChange={(e) => setSelectedBooth(e.target.value)}
                className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
              >
                <option value="all">전체 부스</option>
                {booths.map((booth) => (
                  <option key={booth.id} value={booth.id}>{booth.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">행사</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
              >
                <option value="all">전체 행사</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'grouped' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> 부스별
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" /> 전체 목록
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── List view (flat, grouped by person) ─── */}
        {viewMode === 'list' && (
          membersByEmail.length === 0 ? (
            <div className="bg-white border border-gray-200/60 rounded-xl p-8 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">표시할 팀원이 없어요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-semibold text-gray-900">전체 팀원</p>
                <span className="text-xs font-medium text-gray-400">{uniqueCount}명</span>
              </div>
              {membersByEmail.map((personMembers) => {
                const first = personMembers[0];
                return (
                  <div key={first.email} className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-5">
                    {/* Person header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-sm font-semibold text-gray-600">
                        {first.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{first.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-400 truncate">{first.email}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-400">{personMembers.length}개 부스</span>
                    </div>

                    {/* Assignment rows */}
                    <div className="space-y-2">
                      {personMembers.map((member) => {
                        const boothName = booths.find((b) => b.id === member.boothId)?.name ?? member.boothId;
                        const eventName = member.eventId ? events.find((ev) => ev.id === member.eventId)?.name : null;
                        return (
                          <div key={member.id} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                            <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                              <span className="inline-flex items-center gap-1 h-6 px-2 text-xs font-medium text-brand-700 bg-brand-50 rounded-md shrink-0">
                                <Building2 className="w-3 h-3" /> {boothName}
                              </span>
                              {eventName ? (
                                <span className="inline-flex items-center gap-1 h-6 px-2 text-xs font-medium text-sky-700 bg-sky-50 rounded-md shrink-0">
                                  <Calendar className="w-3 h-3" /> {eventName}
                                </span>
                              ) : (
                                <span className="inline-flex items-center h-6 px-2 text-xs font-medium text-gray-500 bg-gray-100 rounded-md shrink-0">
                                  전체 행사
                                </span>
                              )}
                              <RoleBadge role={member.role} />
                              <StatusBadge status={member.status} />
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member, e.target.value as 'owner' | 'staff')}
                                className="text-xs border border-gray-200 rounded-lg px-1.5 py-1 outline-none text-gray-600 bg-white h-7 hidden sm:block"
                              >
                                <option value="staff">스태프</option>
                                <option value="owner">오너</option>
                              </select>
                              {member.status === 'pending' && (
                                <button
                                  onClick={() => handleActivate(member)}
                                  className="text-xs text-brand-600 hover:text-brand-700 font-medium px-1.5 py-1"
                                >
                                  수락
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(member.id)}
                                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ─── Grouped view (by booth) ─── */}
        {viewMode === 'grouped' && (
          groupedMembers.length === 0 ? (
            <div className="bg-white border border-gray-200/60 rounded-xl p-8 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">표시할 팀원이 없어요.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedMembers.map(({ booth, members: boothMembers }) => (
                <div key={booth.id} className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <h2 className="text-sm font-semibold text-gray-900 truncate">{booth.name}</h2>
                        <span className="inline-flex items-center h-5 px-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-md">
                          {boothMembers.length}명
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{booth.category}</p>
                    </div>
                    <Link
                      to={`/admin/booths/${booth.id}/team`}
                      className="text-xs font-semibold text-gray-500 hover:text-brand-600 inline-flex items-center gap-1 transition-colors shrink-0"
                    >
                      부스별 팀 관리 <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {boothMembers.map((member) => renderMemberRow(member))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </AdminLayout>
  );
}
