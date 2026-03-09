import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock, Heart, QrCode, ChevronRight, Share2, Trash2, AlertTriangle,
  FolderPlus, Folder, FolderOpen, Plus, X, Sparkles, TrendingUp, Wand2,
  LogIn, ChevronDown,
} from 'lucide-react';
import { VisitorHeader } from '../../components/VisitorHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useVisits } from '../../hooks/useVisits';
import { useFavorites } from '../../hooks/useFavorites';
import {
  getBooths, deleteMyData,
  getCollections, saveCollection, deleteCollection, addToCollection, removeFromCollection,
} from '../../utils/localStorage';
import type { Booth, Collection } from '../../types';

// ─── Booth Card ───────────────────────────────────────────────────────────────

function BoothCard({
  booth, meta, onShare, onAddToCollection,
}: {
  booth: Booth;
  meta?: string;
  onShare?: () => void;
  onAddToCollection?: () => void;
}) {
  return (
    <div className="flex items-center gap-4 bg-white border border-gray-200/60 rounded-xl p-4 hover:border-brand-200 hover:shadow-card-hover transition-all duration-300 shadow-sm group">
      <Link to={`/scan/${booth.id}`} className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
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
            <div className="w-full h-full flex items-center justify-center text-xl">🏪</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-1">{booth.category}</p>
          <p className="text-sm font-bold text-gray-900 truncate group-hover:text-brand-600 transition-colors">{booth.name}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate font-medium">{booth.tagline}</p>
          {meta && <p className="text-[11px] font-bold text-brand-500 mt-1.5">{meta}</p>}
        </div>
      </Link>
      <div className="flex items-center gap-1 shrink-0">
        {onAddToCollection && (
          <button
            onClick={onAddToCollection}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all duration-200"
            title="컬렉션에 추가"
          >
            <FolderPlus className="w-4.5 h-4.5" />
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all duration-200"
            title="공유하기"
          >
            <Share2 className="w-4.5 h-4.5" />
          </button>
        )}
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}

// ─── AI Insights (C-11) ──────────────────────────────────────────────────────

function AiInsights({ visitedBooths, favoriteBooths }: { visitedBooths: Booth[]; favoriteBooths: Booth[] }) {
  const [expanded, setExpanded] = useState(false);

  if (visitedBooths.length === 0) return null;

  const categoryCounts: Record<string, number> = {};
  visitedBooths.forEach((b) => {
    categoryCounts[b.category] = (categoryCounts[b.category] ?? 0) + 1;
  });
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const favCategories = new Set(favoriteBooths.map((b) => b.category));
  const allBooths = getBooths();
  const recommended = allBooths
    .filter((b) => favCategories.has(b.category) && !visitedBooths.some((v) => v.id === b.id))
    .slice(0, 3);

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 bg-white border border-brand-100 rounded-xl px-5 py-4 text-left transition-all duration-200 shadow-sm hover:shadow-md hover:border-brand-200 group"
      >
        <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Sparkles className="w-4.5 h-4.5 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900">AI 관람 분석 리포트</p>
          <p className="text-xs text-brand-600 font-bold truncate mt-0.5">
            {topCategories[0] ? `${topCategories[0][0]} 분야에 관심이 아주 높으시네요!` : '방문 기록 분석 중'}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-3 bg-white rounded-xl border border-gray-200 p-5 space-y-5 animate-fade-in shadow-lg">
          {/* Category summary */}
          <div>
            <p className="text-[13px] font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-brand-500" /> 주요 관심 카테고리
            </p>
            <div className="space-y-3">
              {topCategories.map(([cat, count]) => {
                const pct = Math.round((count / visitedBooths.length) * 100);
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-gray-700">{cat}</span>
                      <span className="text-brand-600">{count}개 부스 <span className="text-gray-300 mx-1">|</span> {pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          {recommended.length > 0 && (
            <div className="pt-4 border-t border-gray-50">
              <p className="text-[13px] font-bold text-gray-900 mb-3">놓치면 아쉬운 추천 부스</p>
              <div className="grid grid-cols-1 gap-2">
                {recommended.map((b) => (
                  <Link
                    key={b.id}
                    to={`/scan/${b.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50/50 border border-transparent hover:border-brand-100 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {b.images[0] ? (
                        <img src={b.images[0]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">🏪</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate group-hover:text-brand-600 transition-colors">{b.name}</p>
                      <p className="text-[11px] text-gray-400 font-medium truncate tracking-tight">{b.category}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-500 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-gray-400 text-center font-medium italic">AI 분석은 현재 세션의 활동 기록을 바탕으로 제공됩니다</p>
        </div>
      )}
    </div>
  );
}

// ─── Collections Tab (C-6) ───────────────────────────────────────────────────

function CollectionsTab({ favoriteBooths }: { favoriteBooths: Array<{ booth: Booth }> }) {
  const [collections, setCollections] = useState<Collection[]>(() => getCollections());
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [addingToId, setAddingToId] = useState<string | null>(null);
  const { showToast } = useToast();

  const allBooths = getBooths();
  const boothMap = Object.fromEntries(allBooths.map((b) => [b.id, b]));

  const handleCreate = () => {
    if (!newName.trim()) return;
    const col: Collection = {
      id: `col-${Date.now()}`,
      name: newName.trim(),
      boothIds: [],
      createdAt: new Date().toISOString(),
    };
    saveCollection(col);
    setCollections(getCollections());
    setNewName('');
    setCreating(false);
    showToast('컬렉션이 생성됐어요', 'success');
  };

  const handleDeleteCollection = (id: string) => {
    deleteCollection(id);
    setCollections(getCollections());
    if (openId === id) setOpenId(null);
    showToast('컬렉션이 삭제됐어요', 'info');
  };

  const handleAddBooth = (collectionId: string, boothId: string) => {
    addToCollection(collectionId, boothId);
    setCollections(getCollections());
    setAddingToId(null);
    showToast('부스가 추가됐어요', 'success');
  };

  const handleRemoveBooth = (collectionId: string, boothId: string) => {
    removeFromCollection(collectionId, boothId);
    setCollections(getCollections());
  };

  const handleShareCollection = async (col: Collection) => {
    const names = col.boothIds.map((id) => boothMap[id]?.name ?? id).join(', ');
    const shareText = `[${col.name}] ${names}`;
    if (navigator.share) {
      try { await navigator.share({ title: col.name, text: shareText }); } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast('컬렉션 목록이 복사됐어요', 'success');
      } catch {
        showToast('복사에 실패했어요', 'error');
      }
    }
  };

  return (
    <div>
      {/* Create button */}
      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-6 text-sm font-bold text-gray-400 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200 mb-6 group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          새 컬렉션 만들기
        </button>
      ) : (
        <div className="bg-white rounded-xl border-2 border-brand-200 p-5 mb-6 shadow-lg animate-scale-in">
          <p className="text-sm font-bold text-gray-900 mb-3">새 컬렉션 이름</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="예: 관심 업체, 파트너십 후보"
              autoFocus
              className="flex-1 h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 focus:bg-white transition-all placeholder:text-gray-400"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="h-11 px-5 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-all duration-150 disabled:opacity-40 shadow-md shadow-brand-100"
            >
              생성
            </button>
            <button
              onClick={() => { setCreating(false); setNewName(''); }}
              className="p-2.5 text-gray-400 hover:bg-gray-100 rounded-xl transition-all duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {collections.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Folder className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-base text-gray-500 font-bold">아직 컬렉션이 없어요</p>
          <p className="text-sm text-gray-400 mt-1 font-medium">관심 부스를 목적별로 모아보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {collections.map((col) => {
            const isOpen = openId === col.id;
            const colBooths = col.boothIds.map((id) => boothMap[id]).filter(Boolean) as Booth[];
            const addable = favoriteBooths
              .map((f) => f.booth)
              .filter((b) => !col.boothIds.includes(b.id));

            return (
              <div key={col.id} className="bg-white rounded-xl border border-gray-200/60 overflow-hidden shadow-sm hover:border-brand-200 transition-all duration-200">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <button
                    onClick={() => setOpenId(isOpen ? null : col.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isOpen ? 'bg-brand-50' : 'bg-gray-50'}`}>
                      {isOpen
                        ? <FolderOpen className="w-5 h-5 text-brand-600" />
                        : <Folder className="w-5 h-5 text-gray-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{col.name}</p>
                      <p className="text-[11px] font-bold text-gray-400 tracking-tight">부스 {col.boothIds.length}개</p>
                    </div>
                  </button>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleShareCollection(col)}
                      className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all duration-150"
                      title="컬렉션 공유"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCollection(col.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150"
                      title="컬렉션 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded: booth list + add */}
                {isOpen && (
                  <div className="border-t border-gray-50 px-5 pb-4 pt-3 space-y-2.5 bg-gray-50/30">
                    {colBooths.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4 font-medium italic">부스를 추가해보세요</p>
                    )}
                    {colBooths.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm group">
                        <Link to={`/scan/${b.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                            {b.images[0] ? (
                              <img src={b.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs">🏪</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate group-hover:text-brand-600 transition-colors">{b.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold truncate tracking-tight">{b.category}</p>
                          </div>
                        </Link>
                        <button
                          onClick={() => handleRemoveBooth(col.id, b.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add from favorites */}
                    {addable.length > 0 && (
                      addingToId === col.id ? (
                        <div className="pt-2 animate-fade-in">
                          <p className="text-[11px] font-bold text-gray-400 mb-2 tracking-wider px-1">관심 부스 목록:</p>
                          <div className="space-y-1 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
                            {addable.map((b) => (
                              <button
                                key={b.id}
                                onClick={() => handleAddBooth(col.id, b.id)}
                                className="w-full flex items-center gap-3 text-left px-2 py-2 rounded-xl bg-white border border-gray-100 hover:border-brand-300 hover:bg-brand-50 transition-all duration-150 shadow-sm group"
                              >
                                <Plus className="w-3.5 h-3.5 text-brand-500 shrink-0 group-hover:scale-110 transition-transform" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-700 truncate">{b.name}</p>
                                  <p className="text-[10px] text-gray-400 font-bold tracking-tight">{b.category}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setAddingToId(null)}
                            className="w-full text-xs font-bold text-gray-400 mt-2 py-2 hover:text-gray-600 transition-colors"
                          >
                            닫기
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingToId(col.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-brand-200 text-xs font-bold text-brand-600 hover:bg-brand-50 transition-all duration-200 mt-2"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          관심 부스에서 추가
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyPage() {
  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { visits } = useVisits();
  const { favorites } = useFavorites();
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites' | 'collections'>('recent');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const allBooths = getBooths();
  const boothMap = Object.fromEntries(allBooths.map((b) => [b.id, b]));

  // Deduplicated recent visits
  const seen = new Set<string>();
  const recentBooths = visits
    .filter((v) => {
      if (seen.has(v.boothId)) return false;
      seen.add(v.boothId);
      return true;
    })
    .slice(0, 20)
    .map((v) => ({
      booth: boothMap[v.boothId],
      visitedAt: v.visitedAt,
    }))
    .filter((item) => item.booth);

  const favoriteBooths = favorites
    .map((f) => ({ booth: boothMap[f.boothId], createdAt: f.createdAt }))
    .filter((item) => item.booth) as Array<{ booth: Booth; createdAt: string }>;

  const handleShare = async (booth: Booth) => {
    const url = `${window.location.origin}/scan/${booth.id}`;
    const shareData = { title: booth.name, text: booth.tagline, url };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try { await navigator.share(shareData); } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast('링크가 복사됐어요!', 'success');
      } catch {
        showToast('링크 복사에 실패했어요', 'error');
      }
    }
  };

  const handleDeleteMyData = () => {
    deleteMyData();
    showToast('내 데이터가 삭제됐어요. 새 세션으로 시작할게요.', 'success');
    setShowDeleteConfirm(false);
    navigate('/scan/booth-001');
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = diffMs / (1000 * 60 * 60);
    if (diffH < 1) return '방금 전';
    if (diffH < 24) return `${Math.floor(diffH)}시간 전`;
    if (diffH < 48) return '어제';
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <VisitorHeader />

      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 pb-24">
        {/* Page title */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">내 부스</h1>
        <p className="text-sm text-gray-500 font-medium mb-8">방문 기록과 관심 부스를 모아볼 수 있어요</p>

        {/* Login banner */}
        {!isLoggedIn && (
          <div className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 mb-8 shadow-sm">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
              <LogIn className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">로그인하면 기록이 안전하게 보관돼요</p>
              <p className="text-[13px] text-gray-500 mt-0.5 font-medium leading-relaxed">
                현재 비로그인 상태로 사용 중입니다. 기기를 바꾸거나 브라우저 캐시를 삭제하면 기록이 사라질 수 있어요.
              </p>
              <Link to="/auth" className="inline-block mt-3 text-[13px] font-bold text-brand-600 hover:text-brand-700 underline">
                지금 로그인 / 가입하기 →
              </Link>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-gray-200/50 p-1 rounded-xl mb-8 sm:max-w-md shadow-inner">
          {(['recent', 'favorites', 'collections'] as const).map((tab) => {
            const labels = { recent: '최근 본', favorites: '관심', collections: '컬렉션' };
            const Icons = { recent: Clock, favorites: Heart, collections: Folder };
            const Icon = Icons[tab];
            const isActive = activeTab === tab;
            const count = tab === 'recent' ? recentBooths.length : (tab === 'favorites' ? favoriteBooths.length : 0);

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-white shadow-md text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : ''}`} />
                {labels[tab]}
                {count > 0 && (
                  <span className={`text-[10px] rounded-md px-1.5 py-0.5 leading-none ${isActive ? 'bg-brand-50 text-brand-600' : 'bg-gray-200 text-gray-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Recent Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'recent' && (
          <div>
            {/* AI Auto-Organize */}
            {recentBooths.length > 3 && (
              <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                  <Wand2 className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">자동 정리 제안</p>
                  <p className="text-xs text-gray-500">방문 기록을 카테고리별로 자동 정리할까요?</p>
                </div>
                <button
                  onClick={() => showToast('방문 기록이 카테고리별로 정리됐어요 (데모)', 'success')}
                  className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700 bg-white border border-gray-200 rounded-lg px-3 h-8 transition-all duration-150"
                >
                  정리하기
                </button>
              </div>
            )}

            <AiInsights
              visitedBooths={recentBooths.map((r) => r.booth)}
              favoriteBooths={favoriteBooths.map((f) => f.booth)}
            />
            {recentBooths.length === 0 ? (
              <div className="text-center py-16">
                <QrCode className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">아직 방문한 부스가 없어요</p>
                <p className="text-xs text-gray-300 mt-1">QR을 스캔하면 자동으로 기록돼요</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {recentBooths.map(({ booth, visitedAt }) => (
                  <BoothCard
                    key={booth.id}
                    booth={booth}
                    meta={`방문: ${formatDate(visitedAt)}`}
                    onShare={() => handleShare(booth)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Favorites Tab ───────────────────────────────────────────────── */}
        {activeTab === 'favorites' && (
          <div>
            {favoriteBooths.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">저장한 부스가 없어요</p>
                <p className="text-xs text-gray-300 mt-1">부스 페이지에서 하트를 눌러보세요</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {favoriteBooths.map(({ booth }) => (
                  <BoothCard
                    key={booth.id}
                    booth={booth}
                    onShare={() => handleShare(booth)}
                    onAddToCollection={() => {
                      setActiveTab('collections');
                      showToast('컬렉션 탭에서 추가할 수 있어요', 'info');
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Collections Tab ─────────────────────────────────────────────── */}
        {activeTab === 'collections' && (
          <CollectionsTab favoriteBooths={favoriteBooths} />
        )}

        {/* Data Deletion */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-[13px] font-bold text-gray-400 tracking-wider mb-3">개인정보 관리</p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 transition-all duration-150 group"
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              내 데이터 삭제 요청
            </button>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-xl p-5 shadow-sm animate-scale-in">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700 font-bold leading-relaxed">
                  방문 기록, 관심 부스, 문의 내역, 알림 등 이 기기에 저장된 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없어요.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleDeleteMyData}
                  className="flex-1 text-sm font-bold text-white bg-red-500 rounded-xl h-11 hover:bg-red-600 transition-all duration-150 shadow-md shadow-red-100"
                >
                  데이터 전체 삭제
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl h-11 hover:bg-gray-50 transition-all duration-150"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
