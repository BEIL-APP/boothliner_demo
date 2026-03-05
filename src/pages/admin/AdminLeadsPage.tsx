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
};

const SOURCE_ICONS: Record<Lead['source'], React.ReactNode> = {
  bizcard: <CreditCard className="w-3.5 h-3.5" />,
  inquiry: <Mail className="w-3.5 h-3.5" />,
  email_info: <Mail className="w-3.5 h-3.5" />,
  survey: <ClipboardList className="w-3.5 h-3.5" />,
};

const SOURCE_COLORS: Record<Lead['source'], string> = {
  bizcard: 'bg-brand-50 text-brand-700',
  inquiry: 'bg-brand-50 text-brand-700',
  email_info: 'bg-emerald-50 text-emerald-700',
  survey: 'bg-amber-50 text-amber-700',
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
      <div className="px-4 py-5 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">리드 목록</h1>
            <p className="text-sm text-gray-500 mt-1">
              문의 동의 · 명함 스캔 · 이메일 수신 신청 · 설문 응답 기반
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { exportLeadsCSV(filtered); showToast('리드 CSV가 다운로드됐어요!', 'success'); }}
              className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-9 px-4 text-[13px] font-medium rounded-lg transition-all duration-150 flex-1 sm:flex-none"
            >
              <FileDown className="w-4 h-4" />
              CSV 내보내기
            </button>
            <button
              onClick={handleLottery}
              className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-9 px-4 text-[13px] font-medium rounded-lg transition-all duration-150 flex-1 sm:flex-none"
            >
              <Dice5 className="w-4 h-4" />
              명함 추첨
            </button>
            <Link
              to="/admin/leads/scan"
              className="flex items-center justify-center gap-1.5 bg-brand-600 text-white hover:bg-brand-500 h-9 px-4 text-[13px] font-medium rounded-lg transition-all duration-150 flex-1 sm:flex-none"
            >
              <ScanLine className="w-4 h-4" />
              명함 스캔
            </Link>
          </div>
        </div>

        {/* Source stat chips */}
        <div className="flex overflow-x-auto gap-2 pb-2 mb-4 sm:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <div className="flex items-center gap-1.5 text-xs bg-white border border-gray-200/60 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 shrink-0">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600 font-medium">전체</span>
            <span className="font-semibold text-gray-900">{leads.length}</span>
          </div>
          {(['bizcard', 'inquiry', 'email_info', 'survey'] as Lead['source'][]).map((src) => (
            <div key={src} className="flex items-center gap-1.5 text-xs bg-white border border-gray-200/60 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 shrink-0">
              <span className="text-gray-400">{SOURCE_ICONS[src]}</span>
              <span className="text-gray-600">{SOURCE_LABELS[src]}</span>
              <span className="font-semibold text-gray-900">{countBySource(src)}</span>
            </div>
          ))}
        </div>

        {/* Follow-up section */}
        {followUpLeads.length > 0 && (
          <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-3">
              <PhoneCall className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-semibold text-gray-900">팔로업 필요</h2>
              <span className="text-xs text-gray-500 bg-gray-100 rounded-md px-2 h-5 flex items-center">
                {followUpLeads.length}건
              </span>
            </div>
            <div className="space-y-2">
              {followUpLeads.map((lead) => (
                <div key={lead.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 py-2 border-b border-gray-100 last:border-0">
                  <span className={`h-5 px-1.5 rounded text-[10px] font-medium inline-flex items-center ${STATUS_COLORS[lead.status ?? 'NEW']}`}>
                    {STATUS_LABELS[lead.status ?? 'NEW']}
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate">{lead.name ?? lead.email ?? '이름 없음'}</span>
                  {lead.company && <span className="text-xs text-gray-400 hidden sm:inline">{lead.company}</span>}
                  <span className="text-xs text-gray-400 ml-auto shrink-0">{boothMap[lead.boothId] ?? lead.boothId}</span>
                  <select
                    value={lead.status ?? 'NEW'}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                    className="h-7 text-xs bg-white border border-gray-200 rounded-md px-1.5 outline-none focus:ring-2 focus:ring-brand-200 text-gray-600 shrink-0"
                  >
                    {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <Link
              to="/admin/leads"
              onClick={() => setFilterStatus('NEW')}
              className="mt-3 text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors"
            >
              신규 리드 전체 보기 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름, 회사, 이메일 검색"
              className="w-full h-9 text-sm bg-white border border-gray-200 rounded-lg pl-9 pr-4 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as Lead['source'] | 'all')}
              className="h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all flex-1 sm:flex-none"
            >
              <option value="all">전체 유형</option>
              <option value="bizcard">명함 스캔</option>
              <option value="inquiry">문의 동의</option>
              <option value="email_info">이메일 수신</option>
              <option value="survey">설문</option>
            </select>
            <select
              value={filterBooth}
              onChange={(e) => setFilterBooth(e.target.value)}
              className="h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all flex-1 sm:flex-none"
            >
              <option value="all">전체 부스</option>
              {booths.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as LeadStatus | 'all')}
              className="h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all flex-1 sm:flex-none"
            >
              <option value="all">전체 상태</option>
              {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lead Table */}
        <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">조건에 맞는 리드가 없어요</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-3 py-2.5 sm:px-5 sm:py-3">이름 / 이메일</th>
                    <th className="text-left px-3 py-2.5 sm:px-4 sm:py-3">회사</th>
                    <th className="text-left px-3 py-2.5 sm:px-4 sm:py-3">전화</th>
                    <th className="text-left px-3 py-2.5 sm:px-4 sm:py-3">유형</th>
                    <th className="text-left px-3 py-2.5 sm:px-4 sm:py-3">상태</th>
                    <th className="text-left px-3 py-2.5 sm:px-4 sm:py-3">부스</th>
                    <th className="text-left px-3 py-2.5 sm:px-4 sm:py-3">메모</th>
                    <th className="text-left px-3 py-2.5 sm:px-4 sm:py-3">수집일</th>
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2.5 sm:px-5 sm:py-3.5">
                        <p className="text-sm font-medium text-gray-800">{lead.name ?? '-'}</p>
                        <p className="text-xs text-gray-400">{lead.email ?? '-'}</p>
                      </td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3.5 text-sm text-gray-600">{lead.company ?? '-'}</td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3.5 text-xs text-gray-500 font-mono">{lead.phone ?? '-'}</td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3.5">
                        <span className={`h-6 px-2 rounded-md text-xs font-medium inline-flex items-center gap-1 ${SOURCE_COLORS[lead.source]}`}>
                          {SOURCE_ICONS[lead.source]}
                          {SOURCE_LABELS[lead.source]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3.5">
                        <select
                          value={lead.status ?? 'NEW'}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                          className={`h-6 text-xs font-medium rounded-md px-1.5 border-0 outline-none cursor-pointer ${STATUS_COLORS[lead.status ?? 'NEW']}`}
                        >
                          {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3.5 text-sm text-gray-600">
                        {boothMap[lead.boothId] ?? lead.boothId}
                      </td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3.5 text-xs text-gray-500 max-w-[180px] truncate">
                        {lead.memo || '-'}
                      </td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3.5 text-xs text-gray-400">
                        {new Date(lead.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3.5">
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-1.5 text-gray-300 hover:text-red-400 rounded-md hover:bg-red-50 transition-all duration-150"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Lottery modal */}
      {showLottery && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 sm:p-5">
          <div className="bg-white rounded-xl p-5 sm:p-6 max-w-sm w-full text-center shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">추첨 결과</h2>
            <p className="text-sm text-gray-500 mb-6">
              {filtered.length}명 중 1명이 선택됐어요
            </p>
            {lotteryWinner && (
              <div className="bg-gray-50 border border-gray-200/60 rounded-xl p-4 sm:p-5 mb-6 text-left">
                <p className="text-base font-semibold text-gray-900 mb-1">
                  {lotteryWinner.name ?? '이름 미상'}
                </p>
                {lotteryWinner.company && (
                  <p className="text-sm text-gray-600">{lotteryWinner.company}</p>
                )}
                {lotteryWinner.email && (
                  <p className="text-xs text-gray-500 mt-1">{lotteryWinner.email}</p>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleLottery}
                className="flex-1 h-9 bg-white border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-150"
              >
                다시 추첨
              </button>
              <button
                onClick={() => { setShowLottery(false); setLotteryWinner(null); }}
                className="flex-1 h-9 bg-brand-600 text-white text-[13px] font-medium rounded-lg flex items-center justify-center hover:bg-brand-500 transition-all duration-150"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
