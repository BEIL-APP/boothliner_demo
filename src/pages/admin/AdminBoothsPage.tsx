import { Link } from 'react-router-dom';
import { PlusCircle, QrCode, Eye, ChevronRight, Heart, Mail, TrendingUp } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useBooths } from '../../hooks/useBooths';
import { useAnalytics } from '../../hooks/useAnalytics';

export default function AdminBoothsPage() {
  const { booths } = useBooths();
  const { analytics } = useAnalytics();

  const analyticsMap = Object.fromEntries(analytics.filter((a) => !a.eventId).map((a) => [a.boothId, a]));

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 lg:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">내 부스</h1>
            <p className="text-sm text-gray-500 font-medium">총 {booths.length}개 부스 운영 중</p>
          </div>
          <Link
            to="/admin/booths/new"
            className="flex items-center justify-center gap-2 h-10 bg-brand-600 text-white text-[13px] font-bold rounded-xl px-5 hover:bg-brand-500 transition-all duration-150 w-full sm:w-auto shadow-lg shadow-brand-100"
          >
            <PlusCircle className="w-4 h-4" />
            새 부스 만들기
          </Link>
        </div>

        {/* Booths Grid */}
        {booths.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200/60 shadow-sm">
            <QrCode className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-base text-gray-500 font-bold mb-1">아직 부스가 없어요</p>
            <p className="text-sm text-gray-400 mt-1 mb-8">첫 번째 부스를 만들어 운영을 시작해보세요</p>
            <Link
              to="/admin/booths/new"
              className="inline-flex items-center gap-2 h-11 bg-brand-600 text-white text-sm font-bold rounded-xl px-6 hover:bg-brand-500 transition-all duration-150 shadow-lg shadow-brand-100"
            >
              <PlusCircle className="w-4.5 h-4.5" />
              부스 만들기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {booths.map((booth) => {
              const stats = analyticsMap[booth.id];
              return (
                <Link
                  key={booth.id}
                  to={`/admin/booths/${booth.id}`}
                  className="bg-white rounded-xl border border-gray-200/60 p-5 sm:p-6 hover:border-brand-300 hover:shadow-card-hover transition-all duration-200 group overflow-hidden shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 sm:w-16 sm:h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                      {booth.images[0] ? (
                        <img
                          src={booth.images[0]}
                          alt={booth.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1560472355-536de3962603?w=200&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🏪</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center h-5 px-2 text-[10px] font-bold text-gray-500 bg-gray-100 rounded-md uppercase tracking-wider">
                          {booth.category}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all duration-200" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1 truncate">{booth.name}</h3>
                      <p className="text-xs text-gray-400 truncate font-medium">{booth.tagline}</p>

                      {/* Stats mini */}
                      {stats && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 pt-4 border-t border-gray-50">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold">
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-900">{stats.scans.toLocaleString()}</span>
                            <span className="text-gray-400">스캔</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold">
                            <Heart className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-900">{stats.favorites.toLocaleString()}</span>
                            <span className="text-gray-400">관심</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-900">{stats.inquiries.toLocaleString()}</span>
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
          <div className="mt-10 lg:mt-12">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider">전체 통계 요약</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6">
              {[
                { label: '누적 스캔', value: analytics.reduce((s, a) => s + a.scans, 0), icon: <QrCode className="w-4 h-4 text-gray-400" /> },
                { label: '관심 등록', value: analytics.reduce((s, a) => s + a.favorites, 0), icon: <Heart className="w-4 h-4 text-gray-400" /> },
                { label: '문의량', value: analytics.reduce((s, a) => s + a.inquiries, 0), icon: <Mail className="w-4 h-4 text-gray-400" /> },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border border-gray-200/60 rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-card-hover transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs sm:text-sm font-bold text-gray-500">{stat.label}</p>
                    {stat.icon}
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{stat.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
