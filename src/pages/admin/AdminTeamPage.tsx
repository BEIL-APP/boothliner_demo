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
  ChevronDown,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useBooths } from '../../hooks/useBooths';
import { useToast } from '../../contexts/ToastContext';
import { getAllStaff, getEvents, saveStaff, deleteStaff, getBoothParticipations } from '../../utils/localStorage';
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

// ─── Types ────────────────────────────────────────────────────────────────────

/** A "person" is a group of StaffMember records sharing the same email. */
interface Person {
  email: string;
  name: string;
  /** All StaffMember records for this person */
  records: StaffMember[];
  /** Booth IDs this person is assigned to */
  boothIds: string[];
  /** Map of boothId → assigned record for quick lookup */
  boothRecordMap: Record<string, StaffMember>;
  /** The "primary" record (unassigned one, or first) for role/status */
  primary: StaffMember;
}

export default function AdminTeamPage() {
  const { booths } = useBooths();
  const { showToast } = useToast();
  const [members, setMembers] = useState<StaffMember[]>(() => getAllStaff());
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  const [selectedBooth, setSelectedBooth] = useState('all');
  const events = getEvents();

  // ─── Add member form ───
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'staff' | 'owner'>('staff');

  // ─── Booth assignment expand ───
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  const refresh = () => setMembers(getAllStaff());

  // Group records by email → Person[]
  const people = useMemo<Person[]>(() => {
    const map = new Map<string, StaffMember[]>();
    members.forEach((m) => {
      const list = map.get(m.email) ?? [];
      list.push(m);
      map.set(m.email, list);
    });
    return Array.from(map.entries()).map(([email, records]) => {
      const primary = records.find((r) => !r.boothId) ?? records[0];
      const boothRecords = records.filter((r) => r.boothId);
      const boothRecordMap: Record<string, StaffMember> = {};
      boothRecords.forEach((r) => { boothRecordMap[r.boothId!] = r; });
      return {
        email,
        name: primary.name,
        records,
        boothIds: boothRecords.map((r) => r.boothId!),
        boothRecordMap,
        primary,
      };
    });
  }, [members]);

  // For grouped view
  const groupedByBooth = useMemo(() => {
    return booths
      .filter((booth) => selectedBooth === 'all' || booth.id === selectedBooth)
      .map((booth) => ({
        booth,
        assigned: people.filter((p) => p.boothIds.includes(booth.id)),
      }))
      .filter((g) => g.assigned.length > 0);
  }, [booths, people, selectedBooth]);

  // ─── Handlers ───

  const handleAdd = () => {
    if (!newName.trim() || !newEmail.includes('@')) {
      showToast('이름과 이메일을 확인해주세요', 'error');
      return;
    }
    const exists = members.some((m) => m.email === newEmail.trim() && !m.boothId);
    if (exists) {
      showToast('이미 등록된 이메일이에요', 'error');
      return;
    }
    const member: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      status: 'pending',
      invitedAt: new Date().toISOString(),
    };
    saveStaff(member);
    refresh();
    setNewName('');
    setNewEmail('');
    setNewRole('staff');
    setShowAddForm(false);
    showToast('팀원을 추가했어요', 'success');
  };

  const handleDeletePerson = (person: Person) => {
    person.records.forEach((r) => deleteStaff(r.id));
    refresh();
    showToast('팀원을 제거했어요', 'info');
  };

  const handleRoleChange = (person: Person, role: 'owner' | 'staff') => {
    person.records.forEach((r) => saveStaff({ ...r, role }));
    refresh();
    showToast('권한이 변경됐어요', 'info');
  };

  const handleToggleBooth = (person: Person, boothId: string) => {
    const existing = person.records.find((r) => r.boothId === boothId);
    if (existing) {
      // Unassign
      deleteStaff(existing.id);
    } else {
      // Assign
      const member: StaffMember = {
        id: `staff-${Date.now()}-${boothId}`,
        boothId,
        name: person.name,
        email: person.email,
        role: person.primary.role,
        status: person.primary.status,
        invitedAt: new Date().toISOString(),
      };
      saveStaff(member);
    }
    refresh();
  };

  const handleEventChange = (person: Person, boothId: string, eventId: string) => {
    const record = person.boothRecordMap[boothId];
    if (record) {
      saveStaff({ ...record, eventId: eventId || undefined });
      refresh();
    }
  };

  const handleRemoveFromBooth = (person: Person, boothId: string) => {
    const record = person.records.find((r) => r.boothId === boothId);
    if (record) {
      deleteStaff(record.id);
      refresh();
      showToast('부스 배정을 해제했어요', 'info');
    }
  };

  // ─── Render helpers ───

  const renderPersonCard = (person: Person) => {
    const isExpanded = expandedEmail === person.email;
    return (
      <div key={person.email} className="bg-white border border-gray-200/60 rounded-xl overflow-hidden">
        {/* Person header */}
        <div className="flex items-center gap-3 p-4 sm:p-5">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-gray-600">
            {person.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">{person.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 text-gray-400 shrink-0" />
              <p className="text-xs text-gray-400 truncate">{person.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <RoleBadge role={person.primary.role} />
              <StatusBadge status={person.primary.status} />
              {person.boothIds.length > 0 ? (
                <span className="inline-flex items-center gap-1 h-6 px-2 text-xs font-medium text-brand-700 bg-brand-50 rounded-md">
                  <Building2 className="w-3 h-3" /> {person.boothIds.length}개 부스
                </span>
              ) : (
                <span className="inline-flex items-center h-6 px-2 text-xs font-medium text-orange-600 bg-orange-50 rounded-md">
                  미배정
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={person.primary.role}
              onChange={(e) => handleRoleChange(person, e.target.value as 'owner' | 'staff')}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600 bg-white h-8 hidden sm:block"
            >
              <option value="staff">스태프</option>
              <option value="owner">오너</option>
            </select>
            <button
              onClick={() => handleDeletePerson(person)}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Booth assignment toggle */}
        <div className="border-t border-gray-100">
          <button
            onClick={() => setExpandedEmail(isExpanded ? null : person.email)}
            className="w-full flex items-center justify-between px-4 sm:px-5 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-xs font-bold text-gray-500">
              부스 배치
              {person.boothIds.length > 0 && (
                <span className="ml-1.5 text-gray-400 font-medium">
                  {person.boothIds.map((bid) => booths.find((b) => b.id === bid)?.name).filter(Boolean).join(', ')}
                </span>
              )}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {isExpanded && (
            <div className="px-4 sm:px-5 pb-4 space-y-3 animate-fade-in">
              {/* Booth chips */}
              <div className="flex flex-wrap gap-2">
                {booths.map((booth) => {
                  const assigned = person.boothIds.includes(booth.id);
                  return (
                    <button
                      key={booth.id}
                      onClick={() => handleToggleBooth(person, booth.id)}
                      className={`text-xs font-medium rounded-lg px-3 py-1.5 border transition-all duration-150 ${
                        assigned
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {booth.name}
                    </button>
                  );
                })}
              </div>

              {/* Per-booth event selection */}
              {person.boothIds.length > 0 && (
                <div className="space-y-2 pt-1">
                  {person.boothIds.map((boothId) => {
                    const booth = booths.find((b) => b.id === boothId);
                    if (!booth) return null;
                    const boothEvents = getBoothParticipations(boothId);
                    const record = person.boothRecordMap[boothId];
                    if (!record) return null;
                    return (
                      <div key={boothId} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 shrink-0">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          {booth.name}
                        </span>
                        <select
                          value={record.eventId ?? ''}
                          onChange={(e) => handleEventChange(person, boothId, e.target.value)}
                          className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600 bg-white h-7"
                        >
                          <option value="">전체 행사</option>
                          {boothEvents.map((bp) => {
                            const ev = events.find((e) => e.id === bp.eventId);
                            return ev ? (
                              <option key={ev.id} value={ev.id}>{ev.name}</option>
                            ) : null;
                          })}
                        </select>
                        <button
                          onClick={() => handleToggleBooth(person, boothId)}
                          className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                          title="배정 해제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
              팀원을 추가하고 부스에 배치할 수 있어요
              <span className="ml-2 text-xs text-gray-400">총 {people.length}명</span>
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold border-2 border-brand-600 text-brand-600 bg-white hover:bg-brand-50 transition-all duration-200 shrink-0 lg:bg-brand-600 lg:text-white lg:border-brand-600 lg:hover:bg-brand-500 lg:shadow-md lg:shadow-brand-100"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">팀원 추가</span>
          </button>
        </div>

        {/* Add member form */}
        {showAddForm && (
          <div className="bg-white border-2 border-brand-200 rounded-xl p-5 mb-6 shadow-lg animate-scale-in">
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
            <p className="text-xs text-gray-400 mb-4">추가 후 아래 목록에서 부스를 배치할 수 있어요</p>
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

        {/* View toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium transition-all ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> 전체 목록
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium transition-all ${
                viewMode === 'grouped' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> 부스별
            </button>
          </div>
          {viewMode === 'grouped' && (
            <select
              value={selectedBooth}
              onChange={(e) => setSelectedBooth(e.target.value)}
              className="h-9 bg-white border border-gray-200 rounded-lg px-3 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
            >
              <option value="all">전체 부스</option>
              {booths.map((booth) => (
                <option key={booth.id} value={booth.id}>{booth.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* ─── List view: all people ─── */}
        {viewMode === 'list' && (
          people.length === 0 ? (
            <div className="bg-white border border-gray-200/60 rounded-xl p-12 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400">아직 팀원이 없어요</p>
              <p className="text-xs text-gray-300 mt-1">팀원을 추가하고 부스에 배치해보세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {people.map((person) => renderPersonCard(person))}
            </div>
          )
        )}

        {/* ─── Grouped view: by booth ─── */}
        {viewMode === 'grouped' && (
          groupedByBooth.length === 0 ? (
            <div className="bg-white border border-gray-200/60 rounded-xl p-12 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400">배치된 팀원이 없어요</p>
              <p className="text-xs text-gray-300 mt-1">전체 목록에서 팀원을 부스에 배치해보세요</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedByBooth.map(({ booth, assigned }) => (
                <div key={booth.id} className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <h2 className="text-sm font-semibold text-gray-900 truncate">{booth.name}</h2>
                        <span className="inline-flex items-center h-5 px-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-md">
                          {assigned.length}명
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
                    {assigned.map((person) => {
                      const record = person.records.find((r) => r.boothId === booth.id);
                      const eventName = record?.eventId ? events.find((ev) => ev.id === record.eventId)?.name : null;
                      return (
                        <div key={person.email} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-sm font-semibold text-gray-600">
                            {person.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{person.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                              <p className="text-xs text-gray-400 truncate">{person.email}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <RoleBadge role={person.primary.role} />
                              <StatusBadge status={person.primary.status} />
                              {eventName && (
                                <span className="inline-flex items-center gap-1 h-6 px-2 text-xs font-medium text-sky-700 bg-sky-50 rounded-md">
                                  <Calendar className="w-3 h-3" /> {eventName}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFromBooth(person, booth.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                            title="이 부스에서 제외"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
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
