import { Link } from 'react-router-dom';
import { PlusCircle, QrCode, Eye, ChevronRight } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useBooths } from '../../hooks/useBooths';
import { useAnalytics } from '../../hooks/useAnalytics';

export default function AdminBoothsPage() {
  const { booths } = useBooths();
  const { analytics } = useAnalytics();

  const analyticsMap = Object.fromEntries(analytics.filter((a) => !a.eventId).map((a) => [a.boothId, a]));

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">내 부스</h1>
            <p className="text-sm text-gray-500 mt-1">총 {booths.length}개 부스 운영 중</p>
          </div>
          <Link
            to="/admin/booths/new"
            className="flex items-center justify-center gap-2 h-9 bg-brand-600 text-white text-[13px] font-medium rounded-lg px-4 hover:bg-brand-500 transition-all duration-150 w-full sm:w-auto"
          >
            <PlusCircle className="w-4 h-4" />
            새 부스 만들기
          </Link>
        </div>

        {/* Booths Grid */}
        {booths.length === 0 ? (
          <div className="text-center py-16 sm:py-24 bg-white rounded-xl border border-gray-200/60">
            <QrCode className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500 font-medium mb-1">아직 부스가 없어요</p>
            <p className="text-xs text-gray-400 mt-1 mb-6">첫 번째 부스를 만들어보세요</p>
            <Link
              to="/admin/booths/new"
              className="inline-flex items-center gap-2 h-9 bg-brand-600 text-white text-[13px] font-medium rounded-lg px-4 hover:bg-brand-500 transition-all duration-150"
            >
              <PlusCircle className="w-4 h-4" />
              부스 만들기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {booths.map((booth) => {
              const stats = analyticsMap[booth.id];
              return (
                <Link
                  key={booth.id}
                  to={`/admin/booths/${booth.id}`}
                  className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-6 hover:border-gray-300 hover:shadow-card-hover transition-all duration-150 group overflow-hidden"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {booth.images[0] ? (
                        <img
                          src={booth.images[0]}
                          alt={booth.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1560472355-536de3962603?w=200&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🏪</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="inline-flex items-center h-5 px-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-md">
                          {booth.category}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-all duration-150" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{booth.name}</h3>
                      <p className="text-xs text-gray-400 truncate">{booth.tagline}</p>

                      {/* Stats mini */}
                      {stats && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-medium text-gray-700">{stats.scans}</span>
                            <span className="text-gray-400">스캔</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="text-gray-400">♥</span>
                            <span className="font-medium text-gray-700">{stats.favorites}</span>
                            <span className="text-gray-400">관심</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="text-gray-400">✉</span>
                            <span className="font-medium text-gray-700">{stats.inquiries}</span>
                            <span className="text-gray-400">문의</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Summary cards */}
        {booths.length > 0 && (
          <div className="mt-6 lg:mt-8">
            <h2 className="text-[13px] font-medium text-gray-500 uppercase tracking-wider mb-3 sm:mb-4">전체 통계 요약</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-6">
              {[
                { label: '총 스캔', value: analytics.reduce((s, a) => s + a.scans, 0) },
                { label: '총 관심', value: analytics.reduce((s, a) => s + a.favorites, 0) },
                { label: '총 문의', value: analytics.reduce((s, a) => s + a.inquiries, 0) },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6">
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
