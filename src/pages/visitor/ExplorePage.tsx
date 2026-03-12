import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Heart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  X,
  Calendar,
  MessageSquare,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { VisitorHeader } from '../../components/VisitorHeader';
import { useBooths } from '../../hooks/useBooths';
import { useFavorites } from '../../hooks/useFavorites';
import { getAnalytics, getPolicies, getFavorites, getVisits } from '../../utils/localStorage';

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

function isPolicyUpcoming(policy: BoothPolicy): boolean {
  return new Date(policy.startAt) > new Date();
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
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // AI 추천 로직: 방문·좋아요 기록 기반, 없으면 목데이터로 폴백
  const { aiRecommended, topCategory } = useMemo(() => {
    const boothMap = Object.fromEntries(booths.map((b) => [b.id, b]));
    const visits = getVisits();
    const favIds = new Set(getFavorites().map((f) => f.boothId));

    const categoryScore: Record<string, number> = {};
    visits.forEach((v) => {
      const cat = boothMap[v.boothId]?.category;
      if (cat) categoryScore[cat] = (categoryScore[cat] ?? 0) + 1;
    });
    favIds.forEach((id) => {
      const cat = boothMap[id]?.category;
      if (cat) categoryScore[cat] = (categoryScore[cat] ?? 0) + 3;
    });

    const topCats = Object.entries(categoryScore)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    const visited = new Set(visits.map((v) => v.boothId));
    const fromHistory = booths
      .filter((b) => !visited.has(b.id) && !favIds.has(b.id) && topCats.includes(b.category))
      .sort((a, b) => (categoryScore[b.category] ?? 0) - (categoryScore[a.category] ?? 0))
      .slice(0, 4);

    // 기록 없으면 목데이터: 시드 부스 중 앞에서 4개
    const mockRecommended = booths.slice(0, 4);

    return {
      aiRecommended: fromHistory.length > 0 ? fromHistory : mockRecommended,
      topCategory: topCats[0] ?? null,
    };
  }, [booths]);

  const scrollCategories = (dir: 'left' | 'right') => {
    if (!categoryScrollRef.current) return;
    categoryScrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  const MOCK_EVENTS = [
    { id: 'all', name: '전체 행사' },
    { id: 'event-001', name: '2026 서울 B2B 박람회', date: '2026-03-06 ~ 03-10' },
    { id: 'event-002', name: '스타트업 네트워킹 데이', date: '2026-03-15' },
    { id: 'event-003', name: '그린 비즈니스 엑스포', date: '2026-03-20 ~ 03-22' },
  ];

  const analytics = useMemo(() => getAnalytics(), []);
  const analyticsMap = useMemo(() => {
    const map: Record<string, Analytics> = {};
    analytics.filter((a) => !a.eventId).forEach((a) => { map[a.boothId] = a; });
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
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">부스 둘러보기</h1>
          <p className="text-sm text-gray-500 font-medium mb-6">관심 있는 부스를 찾아 문의하고 자료를 받아보세요</p>

          {/* AI 추천 섹션 */}
          <div className="bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">AI 맞춤 추천</p>
                <p className="text-xs text-gray-500 font-medium">
                  {topCategory
                    ? `${topCategory} 분야에 관심이 높으시네요`
                    : '지금 주목받는 부스를 소개해요'}
                </p>
              </div>
            </div>

            {aiRecommended.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {aiRecommended.map((b) => (
                  <Link
                    key={b.id}
                    to={`/scan/${b.id}`}
                    className="bg-white rounded-xl p-3 flex items-center gap-2.5 border border-white hover:border-brand-200 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {b.images[0] ? (
                        <img src={b.images[0]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">🏪</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate group-hover:text-brand-600 transition-colors">{b.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium truncate">{b.category}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white/60 rounded-xl py-5 text-center border border-white">
                <RefreshCw className="w-5 h-5 text-gray-300 mx-auto mb-1.5" />
                <p className="text-xs text-gray-400 font-medium">부스를 둘러보면 맞춤 추천이 시작돼요</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Event selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              {MOCK_EVENTS.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev.id)}
                  className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                    selectedEvent === ev.id
                      ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-100'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {ev.name}
                </button>
              ))}
            </div>

            <div className="relative max-w-xl group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="부스 이름, 카테고리, 키워드로 검색"
                className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-11 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 focus:bg-white transition-all placeholder:text-gray-400"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-2">
        {/* Category chips — full-width scrollable row */}
        <div className="relative flex items-center">
          <button
            onClick={() => scrollCategories('left')}
            className="flex shrink-0 w-8 h-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all mr-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div ref={categoryScrollRef} className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 text-[13px] font-medium px-3 h-9 rounded-lg border transition-all duration-150 ${
                  activeCategory === cat
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={() => scrollCategories('right')}
            className="flex shrink-0 w-8 h-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all ml-1"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Sort + filter toggles */}
        <div className="flex items-center gap-2 mt-3 ml-auto w-fit">
            <button
              onClick={() => setOnlyActive(!onlyActive)}
              className={`text-[13px] font-medium px-3 h-9 rounded-lg border transition-all duration-150 flex items-center gap-1.5 ${
                onlyActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              운영 중
            </button>

            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="text-[13px] font-medium px-3 h-9 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-all duration-150 flex items-center gap-1.5"
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

        {/* Result count */}
        <p className="text-[13px] text-gray-400 font-medium mt-4">
          총 <span className="text-gray-900 font-bold">{filtered.length}</span>개의 부스
          {activeCategory !== '전체' && <span className="text-brand-600"> · {activeCategory}</span>}
          {search && <span> · "{search}"</span>}
        </p>
      </div>

      {/* Booth Grid */}
      <div className="max-w-5xl mx-auto px-4 py-6 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-base text-gray-500 font-bold">검색 결과가 없어요</p>
            <p className="text-sm text-gray-400 mt-1">다른 키워드나 카테고리로 찾아보세요</p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('전체'); setOnlyActive(false); }}
              className="mt-6 h-10 px-6 rounded-xl bg-brand-50 text-brand-600 text-sm font-bold hover:bg-brand-100 transition-colors"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {filtered.map((booth) => {
              const faved = checkFav(booth.id);
              const policies = policyMap[booth.id] ?? [];
              const expired = policies.length > 0 && policies.every((p) => isPolicyExpired(p));
              const active = policies.some((p) => isPolicyActive(p));
              const upcoming = !active && !expired && policies.some((p) => isPolicyUpcoming(p));
              const stats = analyticsMap[booth.id];

              return (
                <div
                  key={booth.id}
                  className="group bg-white border border-gray-200/60 rounded-xl overflow-hidden hover:border-brand-200 hover:shadow-card-hover transition-all duration-300 shadow-sm"
                >
                  {/* Image */}
                  <Link to={`/scan/${booth.id}`} className="block relative">
                    {booth.images.length > 0 ? (
                      <img
                        src={booth.images[0]}
                        alt={booth.name}
                        className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500"
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
                    {active && (
                      <span className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> 운영 중
                      </span>
                    )}
                    {upcoming && (
                      <span className="absolute top-3 left-3 bg-brand-500/90 backdrop-blur-md text-white text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 운영 예정
                      </span>
                    )}
                    {expired && (
                      <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-white text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 운영 종료
                      </span>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{booth.category}</span>
                        <Link to={`/scan/${booth.id}`}>
                          <h3 className="text-base font-bold text-gray-900 mt-1.5 group-hover:text-brand-600 transition-colors truncate">
                            {booth.name}
                          </h3>
                        </Link>
                      </div>
                      <button
                        onClick={() => toggleFav(booth.id)}
                        className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 ${
                          faved
                            ? 'text-brand-600 bg-brand-50 shadow-sm'
                            : 'text-gray-300 border border-gray-100 hover:text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <Heart className={`w-4.5 h-4.5 ${faved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <p className="text-[13px] text-gray-500 font-medium leading-relaxed line-clamp-2 mb-4">
                      {booth.tagline}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-50 text-[11px] font-bold text-gray-400">
                      {stats && stats.scans > 0 && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> {stats.scans.toLocaleString()}
                        </span>
                      )}
                      {stats && stats.inquiries > 0 && (
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" /> {stats.inquiries.toLocaleString()}
                        </span>
                      )}
                      {booth.nextEvents.length > 0 && (
                        <span className="flex items-center gap-1.5 text-brand-600 bg-brand-50/50 px-1.5 py-0.5 rounded">
                          <Calendar className="w-3 h-3" /> 행사
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
