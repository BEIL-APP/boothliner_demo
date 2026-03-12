import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ScanLine,
  Mail,
  CreditCard,
  ClipboardList,
  Search,
  Trash2,
  Dice5,
  FileDown,
  Filter,
  PhoneCall,
  ArrowRight,
  ChevronDown,
  Plus,
  X,
  Pencil,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useBooths } from '../../hooks/useBooths';
import { useToast } from '../../contexts/ToastContext';
import { getLeads, deleteLead, saveLead } from '../../utils/localStorage';
import { exportLeadsCSV } from '../../utils/csv';
import type { Lead, LeadStatus } from '../../types';

const SOURCE_LABELS: Record<Lead['source'], string> = {
  bizcard: '명함 스캔',
  inquiry: '문의 동의',
  email_info: '이메일 수신',
  survey: '설문',
  manual: '수동 추가',
};

const SOURCE_ICONS: Record<Lead['source'], React.ReactNode> = {
  bizcard: <CreditCard className="w-3.5 h-3.5" />,
  inquiry: <Mail className="w-3.5 h-3.5" />,
  email_info: <Mail className="w-3.5 h-3.5" />,
  survey: <ClipboardList className="w-3.5 h-3.5" />,
  manual: <Plus className="w-3.5 h-3.5" />,
};

const SOURCE_COLORS: Record<Lead['source'], string> = {
  bizcard: 'bg-brand-50 text-brand-700',
  inquiry: 'bg-brand-50 text-brand-700',
  email_info: 'bg-emerald-50 text-emerald-700',
  survey: 'bg-amber-50 text-amber-700',
  manual: 'bg-purple-50 text-purple-700',
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: '신규',
  CONTACTED: '연락완료',
  MEETING: '미팅예정',
  WON: '성사',
  LOST: '실패',
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: 'bg-brand-50 text-brand-700',
  CONTACTED: 'bg-sky-50 text-sky-700',
  MEETING: 'bg-amber-50 text-amber-700',
  WON: 'bg-emerald-50 text-emerald-700',
  LOST: 'bg-gray-100 text-gray-500',
};

export default function AdminLeadsPage() {
  const { booths } = useBooths();
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>(() => getLeads());
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState<Lead['source'] | 'all'>('all');
  const [filterBooth, setFilterBooth] = useState('all');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
  const [showLottery, setShowLottery] = useState(false);
  const [lotteryWinner, setLotteryWinner] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', company: '', phone: '', email: '', boothId: '', memo: '' });
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState({ name: '', company: '', phone: '', email: '', boothId: '', memo: '' });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setEditForm({
      name: lead.name ?? '',
      company: lead.company ?? '',
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      boothId: lead.boothId,
      memo: lead.memo,
    });
  };

  const handleEditLead = () => {
    if (!editingLead) return;
    if (!editForm.name && !editForm.email) { showToast('이름 또는 이메일을 입력해주세요', 'error'); return; }
    saveLead({
      ...editingLead,
      name: editForm.name || undefined,
      company: editForm.company || undefined,
      phone: editForm.phone || undefined,
      email: editForm.email || undefined,
      boothId: editForm.boothId,
      memo: editForm.memo,
    });
    setLeads(getLeads());
    setEditingLead(null);
    showToast('리드가 수정됐어요', 'success');
  };

  const handleAddLead = () => {
    if (!addForm.boothId) { showToast('부스를 선택해주세요', 'error'); return; }
    if (!addForm.name && !addForm.email) { showToast('이름 또는 이메일을 입력해주세요', 'error'); return; }
    saveLead({
      id: `lead-manual-${Date.now()}`,
      boothId: addForm.boothId,
      source: 'manual',
      name: addForm.name || undefined,
      company: addForm.company || undefined,
      phone: addForm.phone || undefined,
      email: addForm.email || undefined,
      memo: addForm.memo,
      consent: true,
      status: 'NEW',
      createdAt: new Date().toISOString(),
    });
    setLeads(getLeads());
    setAddForm({ name: '', company: '', phone: '', email: '', boothId: '', memo: '' });
    setShowAddModal(false);
    showToast('리드가 추가됐어요', 'success');
  };

  const boothMap = Object.fromEntries(booths.map((b) => [b.id, b.name]));

  const filtered = leads.filter((l) => {
    if (filterSource !== 'all' && l.source !== filterSource) return false;
    if (filterBooth !== 'all' && l.boothId !== filterBooth) return false;
    if (filterStatus !== 'all' && (l.status ?? 'NEW') !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.name?.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        false
      );
    }
    return true;
  });

  const followUpLeads = leads.filter((l) => {
    const status = l.status ?? 'NEW';
    return status === 'NEW' || status === 'CONTACTED';
  }).slice(0, 5);

  const handleStatusChange = (id: string, status: LeadStatus) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    const updated = { ...lead, status };
    saveLead(updated);
    setLeads(getLeads());
    showToast(`상태를 "${STATUS_LABELS[status]}"로 변경했어요`, 'info');
  };

  const handleDelete = (id: string) => {
    deleteLead(id);
    setLeads(getLeads());
    showToast('리드를 삭제했어요', 'info');
  };

  const handleLottery = () => {
    if (filtered.length === 0) {
      showToast('추첨할 리드가 없어요', 'error');
      return;
    }
    const winner = filtered[Math.floor(Math.random() * filtered.length)];
    setLotteryWinner(winner);
    setShowLottery(true);
  };

  const countBySource = (src: Lead['source']) => leads.filter((l) => l.source === src).length;

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 lg:mb-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">리드 목록</h1>
            <p className="text-sm text-gray-500 font-medium">
              수집된 잠재 고객 데이터를 관리하고 필터링하세요
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              onClick={() => { exportLeadsCSV(filtered); showToast('리드 CSV가 다운로드됐어요!', 'success'); }}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-10 px-4 text-[13px] font-bold rounded-xl transition-all duration-200 shadow-sm whitespace-nowrap"
            >
              <FileDown className="w-4 h-4 text-gray-400 shrink-0" />
              CSV 내보내기
            </button>
            <button
              onClick={handleLottery}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-10 px-4 text-[13px] font-bold rounded-xl transition-all duration-200 shadow-sm whitespace-nowrap"
            >
              <Dice5 className="w-4 h-4 text-gray-400 shrink-0" />
              명함 추첨
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-10 px-4 text-[13px] font-bold rounded-xl transition-all duration-200 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-gray-400 shrink-0" />
              리드 추가
            </button>
            <Link
              to="/admin/leads/scan"
              className="flex items-center justify-center gap-2 bg-brand-600 text-white hover:bg-brand-500 h-10 px-5 text-[13px] font-bold rounded-xl transition-all duration-200 shadow-lg shadow-brand-100 whitespace-nowrap"
            >
              <ScanLine className="w-4 h-4 shrink-0" />
              명함 스캔
            </Link>
          </div>
        </div>

        {/* Source stat chips */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <div className="flex flex-col gap-1 bg-white border border-gray-200/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">전체</span>
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">{leads.length}</p>
            <p className="text-[11px] font-bold text-gray-500 uppercase">전체 리드</p>
          </div>
          {(['bizcard', 'inquiry', 'email_info', 'survey', 'manual'] as Lead['source'][]).map((src) => (
            <div key={src} className="flex flex-col gap-1 bg-white border border-gray-200/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{SOURCE_ICONS[src]}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{src.split('_')[0]}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-1">{countBySource(src)}</p>
              <p className="text-[11px] font-bold text-gray-500 uppercase">{SOURCE_LABELS[src]}</p>
            </div>
          ))}
        </div>

        {/* Follow-up section */}
        {followUpLeads.length > 0 && (
          <div className="bg-white border border-brand-100 rounded-xl p-5 sm:p-6 mb-8 shadow-sm group">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
                  <PhoneCall className="w-4.5 h-4.5 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">팔로업 우선순위</h2>
                  <p className="text-xs text-gray-500 font-medium">빠른 연락이 필요한 신규 리드입니다</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md uppercase">
                긴급 {followUpLeads.length}건
              </span>
            </div>
            <div className="space-y-2">
              {followUpLeads.map((lead) => (
                <div key={lead.id} className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group/item">
                  <span className={`h-6 px-2 rounded-lg text-[10px] font-bold uppercase tracking-tight flex items-center shrink-0 ${STATUS_COLORS[lead.status ?? 'NEW']}`}>
                    {STATUS_LABELS[lead.status ?? 'NEW']}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{lead.name ?? lead.email ?? '이름 없음'}</p>
                    <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{lead.company ?? '소속 미정'} · {boothMap[lead.boothId] ?? lead.boothId}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <select
                      value={lead.status ?? 'NEW'}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      className="h-9 text-[11px] font-bold bg-white border border-gray-200 rounded-lg px-2 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 text-gray-600 cursor-pointer shadow-sm"
                    >
                      {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-50 flex justify-center">
              <button
                onClick={() => setFilterStatus('NEW')}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 transition-colors group/btn"
              >
                신규 리드 전체 보기 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="고객 이름, 회사명, 이메일로 검색..."
              className="w-full h-11 bg-white border border-gray-200 rounded-xl pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all placeholder:text-gray-400 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value as Lead['source'] | 'all')}
                className="w-full h-11 text-xs font-bold bg-white border border-gray-200 rounded-xl pl-8 pr-8 appearance-none outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all shadow-sm cursor-pointer"
              >
                <option value="all">전체 수집 유형</option>
                <option value="bizcard">명함 스캔</option>
                <option value="inquiry">문의 동의</option>
                <option value="email_info">이메일 수신</option>
                <option value="survey">설문 응답</option>
                <option value="manual">수동 추가</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filterBooth}
                onChange={(e) => setFilterBooth(e.target.value)}
                className="w-full h-11 text-xs font-bold bg-white border border-gray-200 rounded-xl px-4 pr-8 appearance-none outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all shadow-sm cursor-pointer"
              >
                <option value="all">전체 부스</option>
                {booths.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as LeadStatus | 'all')}
                className="w-full h-11 text-xs font-bold bg-white border border-gray-200 rounded-xl px-4 pr-8 appearance-none outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all shadow-sm cursor-pointer"
              >
                <option value="all">전체 리드 상태</option>
                {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Lead Table (desktop) / Card List (mobile) */}
        <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-200" />
              </div>
              <p className="text-base text-gray-500 font-bold">조건에 맞는 리드가 없습니다</p>
              <p className="text-sm text-gray-400 mt-1 font-medium">필터를 변경하거나 검색어를 확인해 보세요</p>
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-sm font-bold text-gray-500">
                      {(lead.name ?? lead.email ?? '?')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-gray-900 truncate">{lead.name ?? '이름 없음'}</p>
                        <span className={`shrink-0 h-5 px-1.5 rounded text-[10px] font-bold inline-flex items-center ${STATUS_COLORS[lead.status ?? 'NEW']}`}>
                          {STATUS_LABELS[lead.status ?? 'NEW']}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {lead.company && <span className="truncate">{lead.company}</span>}
                        {lead.company && <span>·</span>}
                        <span className="shrink-0">{SOURCE_LABELS[lead.source]}</span>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90 shrink-0" />
                  </button>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="text-left pl-5 pr-3 py-3">고객 정보</th>
                      <th className="text-left px-3 py-3">수집 경로</th>
                      <th className="text-left px-3 py-3">상태</th>
                      <th className="text-left px-3 py-3">부스</th>
                      <th className="text-left px-3 py-3">수집일</th>
                      <th className="text-left px-3 py-3">메모</th>
                      <th className="w-20 px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="pl-5 pr-3 py-3">
                          <p className="text-sm font-bold text-gray-900">{lead.name ?? '-'}</p>
                          <p className="text-xs text-gray-400 font-medium truncate max-w-[200px]">{lead.email ?? '-'}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {lead.company && <p className="text-xs text-gray-400">{lead.company}</p>}
                            {lead.phone && <p className="text-[11px] text-gray-400 font-mono">{lead.phone}</p>}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`h-6 px-2 rounded-lg text-[10px] font-bold uppercase tracking-tight inline-flex items-center gap-1 whitespace-nowrap ${SOURCE_COLORS[lead.source]}`}>
                            {SOURCE_ICONS[lead.source]}
                            {SOURCE_LABELS[lead.source]}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={lead.status ?? 'NEW'}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                            className={`h-8 text-[11px] font-bold uppercase rounded-lg px-2 border-0 outline-none cursor-pointer shadow-sm transition-all hover:brightness-95 ${STATUS_COLORS[lead.status ?? 'NEW']}`}
                          >
                            {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-xs font-bold text-gray-500 truncate max-w-[100px]">
                            {boothMap[lead.boothId] ?? lead.boothId}
                          </p>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <p className="text-[11px] font-bold text-gray-400 uppercase">
                            {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-xs text-gray-500 truncate max-w-[140px]">
                            {lead.memo || <span className="text-gray-300">-</span>}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => openEditModal(lead)}
                              className="p-1.5 text-gray-300 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-all"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(lead.id)}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lottery modal */}
      {showLottery && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-5 animate-fade-in">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-scale-in border border-gray-100">
            <div className="w-20 h-20 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Dice5 className="w-10 h-10 text-brand-600 animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">럭키 드로우 결과</h2>
            <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
              총 <span className="text-brand-600 font-bold">{filtered.length}명</span>의 리드 중에서<br />운 좋게 선택된 당첨자입니다!
            </p>
            
            {lotteryWinner && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8 text-left shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/5 rounded-full -translate-y-8 translate-x-8" />
                <p className="text-[11px] font-bold text-brand-600 uppercase tracking-widest mb-2">당첨자 정보</p>
                <p className="text-lg font-bold text-gray-900 mb-1">
                  {lotteryWinner.name ?? '이름 정보 없음'}
                </p>
                {lotteryWinner.company && (
                  <p className="text-sm text-gray-600 font-medium">{lotteryWinner.company}</p>
                )}
                <div className="mt-4 pt-4 border-t border-gray-200/60 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-xs text-gray-500 font-medium truncate">{lotteryWinner.email ?? '이메일 미제공'}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleLottery}
                className="flex-1 h-12 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                다시 추첨
              </button>
              <button
                onClick={() => { setShowLottery(false); setLotteryWinner(null); }}
                className="flex-1 h-12 bg-brand-600 text-white text-sm font-bold rounded-xl flex items-center justify-center hover:bg-brand-500 transition-all shadow-lg shadow-brand-100"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">리드 수정</h2>
              <button onClick={() => setEditingLead(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">부스</label>
                <select
                  value={editForm.boothId}
                  onChange={(e) => setEditForm((f) => ({ ...f, boothId: e.target.value }))}
                  className="w-full h-10 text-sm bg-white border border-gray-200 rounded-xl px-3 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all"
                >
                  {booths.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">이름</label>
                  <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="홍길동"
                    className="w-full h-10 text-sm bg-white border border-gray-200 rounded-xl px-3 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all placeholder:text-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">회사</label>
                  <input value={editForm.company} onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))}
                    placeholder="(주)회사명"
                    className="w-full h-10 text-sm bg-white border border-gray-200 rounded-xl px-3 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all placeholder:text-gray-300" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">이메일</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="example@co.kr"
                    className="w-full h-10 text-sm bg-white border border-gray-200 rounded-xl px-3 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all placeholder:text-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">전화번호</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="010-0000-0000"
                    className="w-full h-10 text-sm bg-white border border-gray-200 rounded-xl px-3 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all placeholder:text-gray-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">메모</label>
                <input value={editForm.memo} onChange={(e) => setEditForm((f) => ({ ...f, memo: e.target.value }))}
                  placeholder="메모"
                  className="w-full h-10 text-sm bg-white border border-gray-200 rounded-xl px-3 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all placeholder:text-gray-300" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setEditingLead(null)}
                className="flex-1 h-10 text-sm font-bold bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all">
                취소
              </button>
              <button onClick={handleEditLead}
                className="flex-1 h-10 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-all shadow-lg shadow-brand-100">
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">리드 직접 추가</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">부스 <span className="text-red-400">*</span></label>
                <select
                  value={addForm.boothId}
                  onChange={(e) => setAddForm((f) => ({ ...f, boothId: e.target.value }))}
                  className="w-full h-10 text-sm bg-white border border-gray-200 rounded-xl px-3 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all"
                >
                  <option value="">부스 선택</option>
                  {booths.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">이름</label>
                  <input value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="홍길동"
                    className="w-full h-10 text-sm bg-white border border-gray-200 rounded-xl px-3 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all placeholder:text-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">회사</label>
                  <input value={addForm.company} onChange={(e) => setAddForm((f) => ({ ...f, company: e.target.value }))}
                    placeholder="(주)회사명"
                    className="w-full h-10 text-sm bg-white border border-gray-200 rounded-xl px-3 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all placeholder:text-gray-300" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">이메일</label>
                  <input type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="example@co.kr"
                    className="w-full h-10 text-sm bg-white border border-gray-200 rounded-xl px-3 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all placeholder:text-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">전화번호</label>
                  <input value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="010-0000-0000"
                    className="w-full h-10 text-sm bg-white border border-gray-200 rounded-xl px-3 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all placeholder:text-gray-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">메모</label>
                <input value={addForm.memo} onChange={(e) => setAddForm((f) => ({ ...f, memo: e.target.value }))}
                  placeholder="현장 상담, 명함 수령 등"
                  className="w-full h-10 text-sm bg-white border border-gray-200 rounded-xl px-3 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all placeholder:text-gray-300" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 h-10 text-sm font-bold bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all">
                취소
              </button>
              <button onClick={handleAddLead}
                className="flex-1 h-10 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-all shadow-lg shadow-brand-100">
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setSelectedLead(null)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-slide-up-sheet max-h-[85vh] flex flex-col">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                  {(selectedLead.name ?? selectedLead.email ?? '?')[0]}
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">{selectedLead.name ?? '이름 없음'}</p>
                  {selectedLead.company && <p className="text-xs text-gray-400">{selectedLead.company}</p>}
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Status + Source row */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedLead.status ?? 'NEW'}
                  onChange={(e) => {
                    handleStatusChange(selectedLead.id, e.target.value as LeadStatus);
                    setSelectedLead({ ...selectedLead, status: e.target.value as LeadStatus });
                  }}
                  className={`h-8 text-[11px] font-bold rounded-lg px-2 border-0 outline-none cursor-pointer ${STATUS_COLORS[selectedLead.status ?? 'NEW']}`}
                >
                  {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <span className={`h-6 px-2 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 ${SOURCE_COLORS[selectedLead.source]}`}>
                  {SOURCE_ICONS[selectedLead.source]}
                  {SOURCE_LABELS[selectedLead.source]}
                </span>
              </div>

              {/* Info rows */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-400 uppercase mb-0.5">이메일</p>
                    <p className="text-sm text-gray-700 truncate">{selectedLead.email ?? '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <PhoneCall className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-400 uppercase mb-0.5">전화번호</p>
                    <p className="text-sm text-gray-700">{selectedLead.phone ?? '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Users className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-400 uppercase mb-0.5">부스</p>
                    <p className="text-sm text-gray-700 truncate">{boothMap[selectedLead.boothId] ?? selectedLead.boothId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <ClipboardList className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-400 uppercase mb-0.5">수집일</p>
                    <p className="text-sm text-gray-700">
                      {new Date(selectedLead.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                {selectedLead.memo && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">메모</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedLead.memo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => { openEditModal(selectedLead); setSelectedLead(null); }}
                className="flex-1 h-11 text-sm font-bold bg-white border border-gray-200 text-gray-700 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
              >
                <Pencil className="w-4 h-4" />
                수정
              </button>
              <button
                onClick={() => { handleDelete(selectedLead.id); setSelectedLead(null); }}
                className="h-11 px-5 text-sm font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
