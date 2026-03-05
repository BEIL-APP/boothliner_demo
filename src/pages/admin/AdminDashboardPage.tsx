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
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useBooths } from '../../hooks/useBooths';
import { exportAnalyticsCSV } from '../../utils/csv';
import { useToast } from '../../contexts/ToastContext';
import { getVisits, getLeads, getSurveys } from '../../utils/localStorage';

const HOUR_LABELS = ['9', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
const MOCK_HOURLY = [8, 22, 35, 28, 18, 42, 56, 38, 25, 14];

export default function AdminDashboardPage() {
  const { analytics } = useAnalytics();
  const { booths } = useBooths();
  const { showToast } = useToast();

  const totalScans = analytics.reduce((s, a) => s + a.scans, 0);
  const totalFavorites = analytics.reduce((s, a) => s + a.favorites, 0);
  const totalInquiries = analytics.reduce((s, a) => s + a.inquiries, 0);

  const allVisits = getVisits();
  const uniqueVisitors = new Set(allVisits.map((v) => v.visitorId ?? 'unknown')).size;

  const allLeads = getLeads();
  const allSurveys = getSurveys();

  const globalInterests: Record<string, number> = {};
  const globalPurposes: Record<string, number> = {};
  let globalWantsContact = 0;
  for (const s of allSurveys) {
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
    bizcard: allLeads.filter((l) => l.source === 'bizcard').length,
    inquiry: allLeads.filter((l) => l.source === 'inquiry').length,
    email_info: allLeads.filter((l) => l.source === 'email_info').length,
    survey: allLeads.filter((l) => l.source === 'survey').length,
  };

  const boothMap = Object.fromEntries(booths.map((b) => [b.id, b]));

  const topBooths = [...analytics].sort((a, b) => b.scans - a.scans).slice(0, 5);

  const handleExportAll = () => {
    exportAnalyticsCSV(analytics);
    showToast('전체 통계 CSV가 다운로드됐어요!', 'success');
  };

  const maxHourly = Math.max(...MOCK_HOURLY);

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">대시보드</h1>
            <p className="text-sm text-gray-500 mt-1">내 부스의 전체 성과를 한눈에 확인하세요</p>
          </div>
          <button
            onClick={handleExportAll}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 h-9 rounded-lg px-4 text-[13px] font-medium hover:bg-gray-50 transition-all duration-150"
          >
            <Download className="w-4 h-4" />
            전체 CSV Export
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          {[
            {
              label: '총 스캔 수',
              value: totalScans.toLocaleString(),
              icon: <QrCode className="w-4 h-4" />,
              trend: '+12% 전주 대비',
            },
            {
              label: '고유 방문자',
              value: uniqueVisitors.toLocaleString(),
              icon: <UserCheck className="w-4 h-4" />,
              trend: '전체 부스 기준',
            },
            {
              label: '관심 저장',
              value: totalFavorites.toLocaleString(),
              icon: <Users className="w-4 h-4" />,
              trend: '+8% 전주 대비',
            },
            {
              label: '총 문의',
              value: totalInquiries.toLocaleString(),
              icon: <TrendingUp className="w-4 h-4" />,
              trend: '+22% 전주 대비',
            },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6">
              <div className="text-gray-400 mb-3">{kpi.icon}</div>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">{kpi.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{kpi.label}</p>
              <p className="text-xs text-gray-400 mt-1">{kpi.trend}</p>
            </div>
          ))}
        </div>

        {/* Lead source + Survey count */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: '명함 스캔 리드', value: leadsBySource.bizcard, icon: <CreditCard className="w-4 h-4" /> },
            { label: '문의 동의 리드', value: leadsBySource.inquiry, icon: <UserCheck className="w-4 h-4" /> },
            { label: '이메일 수신 신청', value: leadsBySource.email_info, icon: <TrendingUp className="w-4 h-4" /> },
            { label: '설문 응답 수', value: allSurveys.length, icon: <ClipboardList className="w-4 h-4" /> },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-gray-200/60 rounded-xl p-3 sm:p-4">
              <div className="text-gray-400 mb-2">{item.icon}</div>
              <p className="text-lg sm:text-xl font-semibold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
          {/* Top Booths */}
          <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">부스별 성과</h2>
              </div>
              <Link
                to="/admin/booths"
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
              >
                전체 보기 <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {topBooths.map((a, i) => {
                const booth = boothMap[a.boothId];
                const maxScans = topBooths[0]?.scans ?? 1;
                return (
                  <div key={a.boothId}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {booth?.images[0] && (
                          <img src={booth.images[0]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">{booth?.name ?? a.boothId}</p>
                          <span className="text-xs font-semibold text-gray-700 ml-2">{a.scans.toLocaleString()}</span>
                        </div>
                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all"
                            style={{ width: `${(a.scans / maxScans) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hourly visit bar chart (mock) */}
          <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">시간대별 방문 (오늘)</h2>
              <span className="bg-amber-50 text-amber-700 rounded-md h-6 px-2 text-xs flex items-center ml-auto">mock 데이터</span>
            </div>

            <div className="flex items-end gap-1.5 h-32">
              {MOCK_HOURLY.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-brand-500 rounded-t-md transition-all hover:bg-brand-600"
                    style={{ height: `${(val / maxHourly) * 100}%` }}
                    title={`${val}명`}
                  />
                  <span className="text-xs text-gray-400">{HOUR_LABELS[i]}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">단위: 방문 수 / 시간대</p>
          </div>
        </div>

        {/* Survey Aggregate */}
        {allSurveys.length > 0 && (
          <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <ClipboardList className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">설문 집계</h2>
              <span className="text-xs text-gray-500 bg-gray-100 rounded-md px-2 h-5 flex items-center ml-auto">
                총 {allSurveys.length}건
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {topGlobalInterests.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-3">관심 분야</p>
                  <div className="space-y-2">
                    {topGlobalInterests.map(([tag, count]) => (
                      <div key={tag}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-700">{tag}</span>
                          <span className="text-xs font-medium text-gray-500">{count}명</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-400 rounded-full"
                            style={{ width: `${(count / maxGlobalInterest) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                {topGlobalPurposes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-3">방문 목적 분포</p>
                    <div className="space-y-1.5">
                      {topGlobalPurposes.map(([purpose, count]) => (
                        <div key={purpose} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">{purpose}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 bg-brand-400 rounded-full" style={{ width: `${(count / allSurveys.length) * 80}px` }} />
                            <span className="font-medium text-gray-600 w-8 text-right">{count}건</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-0.5">연락 희망 응답자</p>
                  <p className="text-xl font-semibold text-emerald-600">
                    {globalWantsContact}명
                    <span className="text-sm font-normal text-emerald-500 ml-1.5">
                      ({allSurveys.length > 0 ? Math.round((globalWantsContact / allSurveys.length) * 100) : 0}%)
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">잠재 리드로 연결 가능</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Leads */}
        <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">최근 리드</h2>
            </div>
            <Link
              to="/admin/leads"
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              전체 보기 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {allLeads.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">아직 리드가 없어요</p>
          ) : (
            <div className="space-y-0">
              {allLeads.slice(0, 5).map((lead) => {
                const sourceColors = {
                  bizcard: 'bg-gray-100 text-gray-700',
                  inquiry: 'bg-gray-100 text-gray-700',
                  email_info: 'bg-emerald-50 text-emerald-700',
                  survey: 'bg-amber-50 text-amber-700',
                } as const;
                const sourceLabels = {
                  bizcard: '명함',
                  inquiry: '문의',
                  email_info: '이메일',
                  survey: '설문',
                } as const;
                return (
                  <div key={lead.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 py-3 border-b border-gray-100 last:border-0">
                    <span className={`text-xs font-medium rounded-md px-2 py-0.5 shrink-0 ${sourceColors[lead.source]}`}>
                      {sourceLabels[lead.source]}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">{lead.name ?? lead.email ?? '이름 없음'}</span>
                    {lead.company && (
                      <span className="text-xs text-gray-400 hidden sm:inline">{lead.company}</span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto shrink-0 truncate max-w-[120px] sm:max-w-none">
                      {boothMap[lead.boothId]?.name ?? lead.boothId}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* All booths stats table */}
        <div className="bg-white border border-gray-200/60 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <h2 className="text-sm font-semibold text-gray-900">부스별 상세 통계</h2>
            <button
              onClick={handleExportAll}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 h-9 rounded-lg px-3 text-[13px] font-medium hover:bg-gray-50 transition-all duration-150"
            >
              <Download className="w-3.5 h-3.5" /> CSV 다운로드
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-6 py-3">부스</th>
                  <th className="text-left px-4 py-3">카테고리</th>
                  <th className="text-right px-4 py-3">스캔</th>
                  <th className="text-right px-4 py-3">관심</th>
                  <th className="text-right px-4 py-3">문의</th>
                  <th className="text-right px-4 py-3">리드</th>
                  <th className="text-right px-6 py-3">전환율</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((a) => {
                  const booth = boothMap[a.boothId];
                  const boothLeads = allLeads.filter((l) => l.boothId === a.boothId).length;
                  const convRate = a.scans > 0 ? ((a.inquiries / a.scans) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={a.boothId} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            {booth?.images[0] && (
                              <img src={booth.images[0]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            )}
                          </div>
                          <Link
                            to={`/admin/booths/${a.boothId}`}
                            className="text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors"
                          >
                            {booth?.name ?? a.boothId}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-500 bg-gray-100 rounded-md px-2 py-0.5">
                          {booth?.category ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-medium text-gray-900">{a.scans}</td>
                      <td className="px-4 py-3.5 text-right text-sm font-medium text-gray-700">{a.favorites}</td>
                      <td className="px-4 py-3.5 text-right text-sm font-medium text-gray-700">{a.inquiries}</td>
                      <td className="px-4 py-3.5 text-right text-sm font-medium text-gray-700">{boothLeads}</td>
                      <td className="px-6 py-3.5 text-right text-sm font-medium text-gray-500">{convRate}%</td>
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
