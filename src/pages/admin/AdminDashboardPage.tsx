import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Users,
  QrCode,
  Download,
  ArrowRight,
  UserCheck,
  ClipboardList,
  CreditCard,
  Clock,
  Lightbulb,
  MessageSquare,
  PhoneCall,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useBooths } from '../../hooks/useBooths';
import { useThreads } from '../../hooks/useThreads';
import { exportAnalyticsCSV } from '../../utils/csv';
import { useToast } from '../../contexts/ToastContext';
import { getVisits, getLeads, getSurveys, getFavorites } from '../../utils/localStorage';

const HOUR_LABELS = ['9', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
const MOCK_HOURLY = [8, 22, 35, 28, 18, 42, 56, 38, 25, 14];

type Period = 'all' | 'week' | 'month' | 'custom';

function getPeriodRange(period: Period, customFrom: string, customTo: string): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (period === 'week') {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    return { from, to: now };
  }
  if (period === 'month') {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    return { from, to: now };
  }
  if (period === 'custom' && customFrom && customTo) {
    return { from: new Date(customFrom), to: new Date(customTo + 'T23:59:59') };
  }
  return { from: null, to: null };
}

function inRange(dateStr: string, from: Date | null, to: Date | null): boolean {
  if (!from || !to) return true;
  const d = new Date(dateStr);
  return d >= from && d <= to;
}

export default function AdminDashboardPage() {
  const { analytics: allAnalytics } = useAnalytics();
  const { booths } = useBooths();
  const { showToast } = useToast();
  const { threads } = useThreads();

  const [period, setPeriod] = useState<Period>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const { from, to } = getPeriodRange(period, customFrom, customTo);

  // All raw data (unfiltered) — for KPI cards
  const allVisitsRaw = getVisits();
  const allFavoritesRaw = getFavorites();
  const allLeadsRaw = getLeads();
  const allSurveysRaw = getSurveys();

  // KPIs — always full data, not affected by period filter
  const qrVisits = allVisitsRaw.filter((v) => v.source === 'qr').length;
  const directVisits = allVisitsRaw.filter((v) => v.source === 'direct' || !v.source).length;
  const totalFavorites = allFavoritesRaw.length;
  const totalInquiries = threads.length;

  // Period-filtered data — for charts / tables below the filter
  const filteredVisits = allVisitsRaw.filter((v) => inRange(v.visitedAt, from, to));
  const filteredFavorites = allFavoritesRaw.filter((f) => inRange(f.createdAt, from, to));
  const filteredLeads = allLeadsRaw.filter((l) => inRange(l.createdAt, from, to));
  const filteredSurveys = allSurveysRaw.filter((s) => inRange(s.createdAt, from, to));
  const filteredThreads = threads.filter((t) => {
    const firstMsgAt = t.messages[0]?.at;
    return firstMsgAt ? inRange(firstMsgAt, from, to) : inRange(t.lastUpdated, from, to);
  });

  // 이벤트별 항목 제외 — 총계만
  const analytics = allAnalytics.filter((a) => !a.eventId);

  // Top booths by filtered visit count
  const visitCountByBooth: Record<string, number> = {};
  filteredVisits.forEach((v) => {
    visitCountByBooth[v.boothId] = (visitCountByBooth[v.boothId] ?? 0) + 1;
  });
  const topBooths = Object.entries(visitCountByBooth)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Insight cards — always unfiltered
  const pendingInquiries = threads.filter((t) => t.status === '미처리').length;
  const newLeads = allLeadsRaw.filter((l) => !l.status || l.status === 'NEW').length;
  const allInterests: Record<string, number> = {};
  for (const s of allSurveysRaw) {
    (s.answers.interests ?? []).forEach((tag) => {
      allInterests[tag] = (allInterests[tag] ?? 0) + 1;
    });
  }
  const topInterestName = Object.entries(allInterests).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Filtered survey aggregates — for charts below the filter
  const globalInterests: Record<string, number> = {};
  const globalPurposes: Record<string, number> = {};
  let globalWantsContact = 0;
  for (const s of filteredSurveys) {
    (s.answers.interests ?? []).forEach((tag) => {
      globalInterests[tag] = (globalInterests[tag] ?? 0) + 1;
    });
    if (s.answers.purpose) {
      globalPurposes[s.answers.purpose] = (globalPurposes[s.answers.purpose] ?? 0) + 1;
    }
    if (s.answers.wantsContact) globalWantsContact++;
  }
  const topGlobalInterests = Object.entries(globalInterests).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topGlobalPurposes = Object.entries(globalPurposes).sort((a, b) => b[1] - a[1]);
  const maxGlobalInterest = topGlobalInterests[0]?.[1] ?? 1;

  const leadsBySource = {
    bizcard: filteredLeads.filter((l) => l.source === 'bizcard').length,
    inquiry: filteredLeads.filter((l) => l.source === 'inquiry').length,
    email_info: filteredLeads.filter((l) => l.source === 'email_info').length,
    survey: filteredLeads.filter((l) => l.source === 'survey').length,
  };

  const boothMap = Object.fromEntries(booths.map((b) => [b.id, b]));

  const handleExportAll = () => {
    exportAnalyticsCSV(analytics);
    showToast('전체 통계 CSV가 다운로드됐어요!', 'success');
  };

  const peakHourIdx = MOCK_HOURLY.indexOf(Math.max(...MOCK_HOURLY));
  const peakHour = HOUR_LABELS[peakHourIdx];

  const insights = [
    pendingInquiries > 0
      ? { icon: MessageSquare, color: 'text-brand-600 bg-brand-50', text: `미처리 문의 ${pendingInquiries}건이 있어요`, action: '인박스 확인', to: '/admin/inbox' }
      : null,
    newLeads > 0
      ? { icon: PhoneCall, color: 'text-amber-600 bg-amber-50', text: `신규 리드 ${newLeads}건 — 팔로업이 필요해요`, action: '리드 목록', to: '/admin/leads' }
      : null,
    topInterestName
      ? { icon: Lightbulb, color: 'text-emerald-600 bg-emerald-50', text: `관심 분야 1위 "${topInterestName}" — 관련 자료를 부스에 추가해 보세요`, action: '내 부스', to: '/admin/booths' }
      : null,
    peakHour
      ? { icon: Clock, color: 'text-sky-600 bg-sky-50', text: `방문 피크 시간대 ${peakHour}시 — 이 시간에 인력을 집중 배치하세요`, action: null, to: null }
      : null,
  ].filter(Boolean) as Array<{ icon: typeof MessageSquare; color: string; text: string; action: string | null; to: string | null }>;

  const maxHourly = Math.max(...MOCK_HOURLY);
  const maxTopBooth = topBooths[0]?.[1] ?? 1;

  const PERIOD_LABELS: Record<Period, string> = {
    all: '전체 기간',
    week: '최근 7일',
    month: '최근 30일',
    custom: '기간 설정',
  };

  const handlePeriodClick = (p: Period) => {
    setPeriod(p);
    setShowCustom(p === 'custom');
  };

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">대시보드</h1>
            <p className="text-sm text-gray-500 font-medium">내 부스의 전체 성과를 한눈에 확인하세요</p>
          </div>
          <button
            onClick={handleExportAll}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 h-10 rounded-lg px-4 text-[13px] font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-150"
          >
            <Download className="w-4 h-4 text-gray-400" />
            전체 CSV 내보내기
          </button>
        </div>

        {/* Insight + Action Cards */}
        {insights.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {insights.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white border border-gray-200/60 rounded-xl p-4 flex items-start gap-4 hover:shadow-card-hover transition-all duration-200">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-relaxed">{item.text}</p>
                    {item.action && item.to && (
                      <Link to={item.to} className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 transition-colors">
                        {item.action} <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Period selector */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            {(['all', 'week', 'month', 'custom'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodClick(p)}
                className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  period === p
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {PERIOD_LABELS[p]}
                {p === 'custom' && <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          {showCustom && (
            <div className="mt-3 flex flex-wrap items-center gap-2 pl-6">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 border border-gray-200 rounded-lg px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              />
              <span className="text-sm text-gray-400 font-medium">~</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                min={customFrom}
                className="h-9 border border-gray-200 rounded-lg px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              />
              {customFrom && customTo && (
                <span className="text-[12px] text-gray-400 font-medium">
                  {customFrom} ~ {customTo}
                </span>
              )}
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'QR 방문 수',
              value: qrVisits.toLocaleString(),
              icon: <QrCode className="w-5 h-5" />,
              sub: 'QR 코드 스캔 기준',
            },
            {
              label: '직접 방문 수',
              value: directVisits.toLocaleString(),
              icon: <UserCheck className="w-5 h-5" />,
              sub: 'URL 직접 접근 기준',
            },
            {
              label: '관심 저장',
              value: totalFavorites.toLocaleString(),
              icon: <Users className="w-5 h-5" />,
              sub: '하트 누른 횟수',
            },
            {
              label: '총 문의',
              value: totalInquiries.toLocaleString(),
              icon: <TrendingUp className="w-5 h-5" />,
              sub: '스레드 생성 기준',
            },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white border border-gray-200/60 rounded-xl p-5 sm:p-6 hover:shadow-card-hover transition-all duration-200">
              <div className="text-gray-400 mb-4">{kpi.icon}</div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{kpi.value}</p>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">{kpi.label}</p>
              <p className="text-[11px] text-gray-400 mt-2">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Lead source + Survey count */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: '명함 스캔 리드', value: leadsBySource.bizcard, icon: <CreditCard className="w-5 h-5" /> },
            { label: '문의 동의 리드', value: leadsBySource.inquiry, icon: <UserCheck className="w-5 h-5" /> },
            { label: '이메일 수신 신청', value: leadsBySource.email_info, icon: <TrendingUp className="w-5 h-5" /> },
            { label: '설문 응답 수', value: filteredSurveys.length, icon: <ClipboardList className="w-5 h-5" /> },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-gray-200/60 rounded-xl p-4 hover:shadow-card-hover transition-all duration-200">
              <div className="text-gray-400 mb-3">{item.icon}</div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{item.value}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
          {/* Top Booths */}
          <div className="bg-white border border-gray-200/60 rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">부스별 방문 Top 5</h2>
              </div>
              <Link
                to="/admin/booths"
                className="text-xs font-medium text-gray-500 hover:text-brand-600 flex items-center gap-1 transition-colors"
              >
                전체 보기 <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {topBooths.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400">해당 기간에 방문 기록이 없어요</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topBooths.map(([boothId, count], i) => {
                  const booth = boothMap[boothId];
                  return (
                    <div key={boothId} className="group">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                          {booth?.images[0] && (
                            <img src={booth.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-sm font-semibold text-gray-800 truncate">{booth?.name ?? boothId}</p>
                            <span className="text-xs font-bold text-gray-900 ml-2">{count.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full transition-all duration-500"
                              style={{ width: `${(count / maxTopBooth) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hourly visit bar chart (mock) */}
          <div className="bg-white border border-gray-200/60 rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">시간대별 방문 (오늘)</h2>
              <span className="bg-amber-50 text-amber-600 rounded-md h-6 px-2 text-[11px] font-semibold flex items-center ml-auto">실시간</span>
            </div>

            <div className="flex items-end gap-2 h-32">
              {MOCK_HOURLY.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-brand-500 rounded-t-lg transition-all hover:bg-brand-600 cursor-help"
                    style={{ height: `${(val / maxHourly) * 100}%` }}
                    title={`${val}명`}
                  />
                  <span className="text-[11px] font-medium text-gray-400">{HOUR_LABELS[i]}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-4 text-right">단위: 방문 수 / 시간대</p>
          </div>
        </div>

        {/* Survey Aggregate */}
        {filteredSurveys.length > 0 && (
          <div className="bg-white border border-gray-200/60 rounded-xl p-5 sm:p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <ClipboardList className="w-5 h-5 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">설문 집계</h2>
              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-md px-2 h-5 flex items-center ml-auto">
                총 {filteredSurveys.length}건
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {topGlobalInterests.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">주요 관심 분야</p>
                  <div className="space-y-4">
                    {topGlobalInterests.map(([tag, count]) => (
                      <div key={tag}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-700">{tag}</span>
                          <span className="text-xs font-bold text-gray-500">{count}명</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all duration-700"
                            style={{ width: `${(count / maxGlobalInterest) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {topGlobalPurposes.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">방문 목적 분포</p>
                    <div className="space-y-2.5">
                      {topGlobalPurposes.map(([purpose, count]) => (
                        <div key={purpose} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 font-medium">{purpose}</span>
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 bg-brand-200 rounded-full overflow-hidden w-24">
                              <div className="h-full bg-brand-500" style={{ width: `${(count / filteredSurveys.length) * 100}%` }} />
                            </div>
                            <span className="font-bold text-gray-600 w-8 text-right">{count}건</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-emerald-50 border border-emerald-100/50 rounded-xl p-5">
                  <p className="text-xs font-semibold text-emerald-600 mb-1">연락 희망 응답자</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {globalWantsContact}명
                    <span className="text-sm font-medium text-emerald-500 ml-2">
                      ({filteredSurveys.length > 0 ? Math.round((globalWantsContact / filteredSurveys.length) * 100) : 0}%)
                    </span>
                  </p>
                  <p className="text-[11px] text-emerald-600/60 mt-1 font-medium italic">잠재 리드로 연결될 가능성이 높습니다</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Leads */}
        <div className="bg-white border border-gray-200/60 rounded-xl p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">최근 리드</h2>
            </div>
            <Link
              to="/admin/leads"
              className="text-xs font-semibold text-gray-500 hover:text-brand-600 flex items-center gap-1 transition-colors"
            >
              전체 보기 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-gray-400 font-medium">해당 기간에 수집된 리드가 없어요</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredLeads.slice(0, 5).map((lead) => {
                const sourceColors = {
                  bizcard: 'bg-gray-100 text-gray-600',
                  inquiry: 'bg-blue-50 text-blue-600',
                  email_info: 'bg-emerald-50 text-emerald-600',
                  survey: 'bg-amber-50 text-amber-600',
                  manual: 'bg-purple-50 text-purple-600',
                } as const;
                const sourceLabels = {
                  bizcard: '명함',
                  inquiry: '문의',
                  email_info: '이메일',
                  survey: '설문',
                  manual: '수동',
                } as const;
                return (
                  <div key={lead.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                    <span className={`text-[11px] font-bold rounded-md px-1.5 py-0.5 shrink-0 ${sourceColors[lead.source]}`}>
                      {sourceLabels[lead.source]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{lead.name ?? lead.email ?? '이름 없음'}</p>
                      {lead.company && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{lead.company}</p>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-400 shrink-0">
                      {boothMap[lead.boothId]?.name ?? lead.boothId}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* All booths stats table */}
        <div className="bg-white border border-gray-200/60 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 sm:px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between bg-gray-50/30">
            <h2 className="text-sm font-semibold text-gray-900">부스별 상세 통계</h2>
            <button
              onClick={handleExportAll}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 h-9 rounded-lg px-3 text-[13px] font-medium hover:bg-gray-50 transition-all duration-150 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-gray-400" /> CSV 다운로드
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="text-left px-6 py-3.5">부스</th>
                  <th className="text-left px-4 py-3.5">카테고리</th>
                  <th className="text-right px-4 py-3.5">방문</th>
                  <th className="text-right px-4 py-3.5">관심</th>
                  <th className="text-right px-4 py-3.5">문의</th>
                  <th className="text-right px-4 py-3.5">리드</th>
                  <th className="text-right px-6 py-3.5">전환율</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {booths.map((booth) => {
                  const visits = filteredVisits.filter((v) => v.boothId === booth.id).length;
                  const favs = filteredFavorites.filter((f) => f.boothId === booth.id).length;
                  const inqs = filteredThreads.filter((t) => t.boothId === booth.id).length;
                  const leads = filteredLeads.filter((l) => l.boothId === booth.id).length;
                  const convRate = visits > 0 ? ((inqs / visits) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={booth.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                            {booth.images[0] && (
                              <img src={booth.images[0]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            )}
                          </div>
                          <Link
                            to={`/admin/booths/${booth.id}`}
                            className="text-sm font-semibold text-gray-900 hover:text-brand-600 transition-colors"
                          >
                            {booth.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-100 rounded-md px-2 py-0.5">
                          {booth.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-bold text-gray-900">{visits.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-gray-600">{favs.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-gray-600">{inqs.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-gray-600">{leads.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-brand-600 bg-brand-50/20">{convRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
