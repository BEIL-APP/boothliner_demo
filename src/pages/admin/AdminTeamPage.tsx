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
  const events = getEvents();

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

  const refresh = () => setMembers(getAllStaff());

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

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">전체 팀원 관리</h1>
          <p className="text-sm text-gray-500 font-medium">부스와 행사 기준으로 전체 운영팀을 한 번에 관리합니다</p>
        </div>

        <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>
        </div>

        {groupedMembers.length === 0 ? (
          <div className="bg-white border border-gray-200/60 rounded-xl p-8 text-center text-sm text-gray-400">
            표시할 팀원이 없어요.
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
                    className="text-xs font-semibold text-gray-500 hover:text-brand-600 inline-flex items-center gap-1 transition-colors"
                  >
                    부스별 팀 관리 <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="divide-y divide-gray-100">
                  {boothMembers.map((member) => {
                    const eventName = member.eventId ? events.find((event) => event.id === member.eventId)?.name : null;
                    return (
                      <div key={member.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-sm font-semibold text-gray-600">
                          {member.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-400 truncate">{member.email}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={member.status} />
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
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
                          <RoleBadge role={member.role} />
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member, e.target.value as 'owner' | 'staff')}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600 bg-white h-9 transition-all hidden sm:block"
                          >
                            <option value="staff">스태프</option>
                            <option value="owner">오너</option>
                          </select>
                          {member.status === 'pending' && (
                            <button
                              onClick={() => handleActivate(member)}
                              className="text-xs text-gray-600 hover:text-gray-900 font-medium transition-all duration-150"
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
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
