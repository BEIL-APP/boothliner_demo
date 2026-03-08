import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Heart,
  ChevronDown,
  Clock,
  MapPin,
  X,
  Calendar,
} from 'lucide-react';
import { VisitorHeader } from '../../components/VisitorHeader';
import { useBooths } from '../../hooks/useBooths';
import { useFavorites } from '../../hooks/useFavorites';
import { getAnalytics, getPolicies } from '../../utils/localStorage';
import type { Analytics, BoothPolicy } from '../../types';

type SortOption = 'latest' | 'popular' | 'name';

const SORT_LABELS: Record<SortOption, string> = {
  latest: '최신순',
  popular: '인기순',
  name: '이름순',
};

function isPolicyActive(policy: BoothPolicy): boolean {
  const now = new Date();
  return new Date(policy.startAt) <= now && now <= new Date(policy.endAt);
}

function isPolicyExpired(policy: BoothPolicy): boolean {
  return new Date(policy.endAt) < new Date();
}

export default function ExplorePage() {
  const { booths } = useBooths();
  const { checkFav, toggleFav } = useFavorites();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [sort, setSort] = useState<SortOption>('latest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [onlyActive, setOnlyActive] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');

  const MOCK_EVENTS = [
    { id: 'all', name: '전체 행사' },
    { id: 'event-001', name: '2026 서울 B2B 박람회', date: '2026-03-10 ~ 03-12' },
    { id: 'event-002', name: '스타트업 네트워킹 데이', date: '2026-03-15' },
    { id: 'event-003', name: '그린 비즈니스 엑스포', date: '2026-03-20 ~ 03-22' },
  ];

  const analytics = useMemo(() => getAnalytics(), []);
  const analyticsMap = useMemo(() => {
    const map: Record<string, Analytics> = {};
    analytics.forEach((a) => { map[a.boothId] = a; });
    return map;
  }, [analytics]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(booths.map((b) => b.category)));
    return ['전체', ...cats];
  }, [booths]);

  const policyMap = useMemo(() => {
    const map: Record<string, BoothPolicy[]> = {};
    booths.forEach((b) => { map[b.id] = []; });
    getPolicies().forEach((p) => {
      if (map[p.boothId]) map[p.boothId].push(p);
    });
    return map;
  }, [booths]);

  const filtered = useMemo(() => {
    let result = [...booths];

    if (selectedEvent !== 'all') {
      result = result.filter((b) =>
        policyMap[b.id]?.some((p) => p.eventId === selectedEvent)
      );
    }

    if (activeCategory !== '전체') {
      result = result.filter((b) => b.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.tagline.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      );
    }

    if (onlyActive) {
      result = result.filter((b) => {
        const policies = policyMap[b.id];
        if (!policies || policies.length === 0) return false;
        return policies.some((p) => isPolicyActive(p));
      });
    }

    switch (sort) {
      case 'popular':
        result.sort((a, b) => {
          const aScore = (analyticsMap[a.id]?.scans ?? 0) + (analyticsMap[a.id]?.favorites ?? 0) * 2;
          const bScore = (analyticsMap[b.id]?.scans ?? 0) + (analyticsMap[b.id]?.favorites ?? 0) * 2;
          return bScore - aScore;
        });
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        break;
      case 'latest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [booths, activeCategory, search, sort, onlyActive, analyticsMap, policyMap]);

  return (
    <div className="min-h-screen bg-gray-50">
      <VisitorHeader />

      {/* Hero / Search */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">부스 둘러보기</h1>
          <p className="text-sm text-gray-500 mb-4">관심 있는 부스를 찾아 문의하고 자료를 받아보세요</p>

          {/* Event selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-3 scrollbar-hide">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            {MOCK_EVENTS.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setSelectedEvent(ev.id)}
                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                  selectedEvent === ev.id
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {ev.name}
              </button>
            ))}
          </div>

          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="부스 이름, 카테고리, 키워드로 검색"
              className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 focus:bg-white transition-all placeholder:text-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Category chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 text-[13px] font-medium px-3 h-8 rounded-lg border transition-all duration-150 ${
                  activeCategory === cat
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort + filter toggles */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setOnlyActive(!onlyActive)}
              className={`text-[13px] font-medium px-3 h-8 rounded-lg border transition-all duration-150 flex items-center gap-1.5 ${
                onlyActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              운영중만
            </button>

            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="text-[13px] font-medium px-3 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-all duration-150 flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {SORT_LABELS[sort]}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-modal py-1 z-20 min-w-[120px] animate-scale-in">
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => { setSort(key); setShowSortMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-[13px] transition-colors ${
                          sort === key ? 'text-brand-600 font-medium bg-brand-50' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {SORT_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Result count */}
        <p className="text-xs text-gray-400 mt-3">
          {filtered.length}개 부스
          {activeCategory !== '전체' && <span> · {activeCategory}</span>}
          {search && <span> · "{search}"</span>}
        </p>
      </div>

      {/* Booth Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 pb-12">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">검색 결과가 없어요</p>
            <p className="text-xs text-gray-400 mt-1">다른 키워드나 카테고리로 찾아보세요</p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('전체'); setOnlyActive(false); }}
              className="mt-4 text-[13px] font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {filtered.map((booth) => {
              const faved = checkFav(booth.id);
              const policies = policyMap[booth.id] ?? [];
              const expired = policies.length > 0 && policies.every((p) => isPolicyExpired(p));
              const active = policies.some((p) => isPolicyActive(p));
              const stats = analyticsMap[booth.id];

              return (
                <div
                  key={booth.id}
                  className="group bg-white border border-gray-200/60 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-card-hover transition-all duration-200"
                >
                  {/* Image */}
                  <Link to={`/scan/${booth.id}`} className="block relative">
                    {booth.images.length > 0 ? (
                      <img
                        src={booth.images[0]}
                        alt={booth.name}
                        className="w-full aspect-[16/10] object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-full aspect-[16/10] bg-gray-100 flex items-center justify-center">
                        <span className="text-4xl opacity-40">🏪</span>
                      </div>
                    )}

                    {/* Status badge */}
                    {expired && (
                      <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 종료
                      </span>
                    )}
                    {!expired && active && policies.length > 0 && (
                      <span className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> 운영중
                      </span>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <span className="text-xs text-gray-500">{booth.category}</span>
                        <Link to={`/scan/${booth.id}`}>
                          <h3 className="text-sm font-semibold text-gray-900 mt-0.5 group-hover:text-brand-600 transition-colors truncate">
                            {booth.name}
                          </h3>
                        </Link>
                      </div>
                      <button
                        onClick={() => toggleFav(booth.id)}
                        className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 ${
                          faved
                            ? 'text-brand-600 bg-brand-50'
                            : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${faved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-3">
                      {booth.tagline}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {stats && stats.scans > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {stats.scans}회 방문
                        </span>
                      )}
                      {stats && stats.inquiries > 0 && (
                        <span>{stats.inquiries}건 문의</span>
                      )}
                      {booth.nextEvents.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 이벤트 {booth.nextEvents.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
