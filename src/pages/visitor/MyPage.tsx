import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock, Heart, QrCode, ChevronRight, Info, Share2, Trash2, AlertTriangle,
  FolderPlus, Folder, FolderOpen, Plus, X, Sparkles, TrendingUp,
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
    <div className="flex items-center gap-3 bg-white border border-gray-200/60 rounded-xl p-3 hover:border-gray-300 transition-all duration-150">
      <Link to={`/scan/${booth.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
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
            <div className="w-full h-full flex items-center justify-center text-xl">🏪</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-0.5">{booth.category}</p>
          <p className="text-sm font-medium text-gray-900 truncate">{booth.name}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{booth.tagline}</p>
          {meta && <p className="text-xs text-gray-300 mt-1">{meta}</p>}
        </div>
      </Link>
      <div className="flex items-center gap-1 shrink-0">
        {onAddToCollection && (
          <button
            onClick={onAddToCollection}
            className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all duration-150"
            title="컬렉션에 추가"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all duration-150"
            title="공유하기"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
        <ChevronRight className="w-4 h-4 text-gray-300" />
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
    <div className="mb-5">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-left transition-all duration-150"
      >
        <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900">AI 관람 요약</p>
          <p className="text-xs text-gray-500 truncate">
            {topCategories[0] ? `${topCategories[0][0]} 분야에 관심이 많으시네요` : '방문 기록 분석 중'}
          </p>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-2 bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          {/* Category summary */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-gray-500" /> 관심 분야 분석
            </p>
            <div className="space-y-1.5">
              {topCategories.map(([cat, count]) => {
                const pct = Math.round((count / visitedBooths.length) * 100);
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span>{cat}</span>
                      <span className="text-gray-400">{count}개 부스 · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-400 rounded-full"
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
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">관심 기반 추천 부스</p>
              <div className="space-y-2">
                {recommended.map((b) => (
                  <Link
                    key={b.id}
                    to={`/scan/${b.id}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 transition-all duration-150"
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {b.images[0] ? (
                        <img src={b.images[0]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">🏪</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{b.name}</p>
                      <p className="text-xs text-gray-400 truncate">{b.category}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-300 text-center">AI 분석은 방문·저장 기록 기반 추정입니다</p>
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
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg py-4 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-600 transition-all duration-150 mb-4"
        >
          <Plus className="w-4 h-4" />
          새 컬렉션 만들기
        </button>
      ) : (
        <div className="bg-white rounded-lg border-2 border-brand-200 p-4 mb-4">
          <p className="text-[13px] font-semibold text-gray-900 mb-2">컬렉션 이름</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="예: 관심 업체, 파트너십 후보"
              autoFocus
              className="flex-1 h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="h-10 px-4 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-all duration-150 disabled:opacity-40"
            >
              생성
            </button>
            <button
              onClick={() => { setCreating(false); setNewName(''); }}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {collections.length === 0 ? (
        <div className="text-center py-16">
          <Folder className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">아직 컬렉션이 없어요</p>
          <p className="text-xs text-gray-300 mt-1">관심 부스를 컬렉션으로 묶어보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {collections.map((col) => {
            const isOpen = openId === col.id;
            const colBooths = col.boothIds.map((id) => boothMap[id]).filter(Boolean) as Booth[];
            const addable = favoriteBooths
              .map((f) => f.booth)
              .filter((b) => !col.boothIds.includes(b.id));

            return (
              <div key={col.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <button
                    onClick={() => setOpenId(isOpen ? null : col.id)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                  >
                    {isOpen
                      ? <FolderOpen className="w-4.5 h-4.5 text-brand-500 shrink-0" />
                      : <Folder className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{col.name}</p>
                      <p className="text-xs text-gray-400">{col.boothIds.length}개 부스</p>
                    </div>
                  </button>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleShareCollection(col)}
                      className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all duration-150"
                      title="컬렉션 공유"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCollection(col.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150"
                      title="컬렉션 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded: booth list + add */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-4 pb-3 pt-2 space-y-2">
                    {colBooths.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">부스를 추가해보세요</p>
                    )}
                    {colBooths.map((b) => (
                      <div key={b.id} className="flex items-center gap-2.5">
                        <Link to={`/scan/${b.id}`} className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            {b.images[0] ? (
                              <img src={b.images[0]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs">🏪</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{b.name}</p>
                            <p className="text-xs text-gray-400 truncate">{b.category}</p>
                          </div>
                        </Link>
                        <button
                          onClick={() => handleRemoveBooth(col.id, b.id)}
                          className="p-1 text-gray-300 hover:text-red-400 rounded-lg transition-all duration-150 shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Add from favorites */}
                    {addable.length > 0 && (
                      addingToId === col.id ? (
                        <div className="pt-1">
                          <p className="text-xs text-gray-500 mb-1.5">관심 부스에서 추가:</p>
                          <div className="space-y-1">
                            {addable.map((b) => (
                              <button
                                key={b.id}
                                onClick={() => handleAddBooth(col.id, b.id)}
                                className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-all duration-150"
                              >
                                <Plus className="w-3 h-3 text-brand-500 shrink-0" />
                                <span className="text-xs text-gray-700 truncate">{b.name}</span>
                                <span className="text-xs text-gray-400">{b.category}</span>
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setAddingToId(null)}
                            className="w-full text-xs text-gray-400 mt-1 py-1 hover:text-gray-600"
                          >
                            닫기
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingToId(col.id)}
                          className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 transition-all duration-150"
                        >
                          <Plus className="w-3 h-3" />
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-20">
        {/* Page title */}
        <h1 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">내 부스</h1>
        <p className="text-[13px] sm:text-sm text-gray-500 mb-5">방문 기록과 관심 부스를 모아볼 수 있어요</p>

        {/* Login banner */}
        <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-5">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {isLoggedIn ? (
              <>
                <span className="font-medium">로그인 중이에요.</span> 기록이 계정에 보관돼요.
              </>
            ) : (
              <>
                <span className="font-medium">비로그인으로 사용 중이에요.</span> 이 기기에서만 기록이 유지돼요.
              </>
            )}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-5 sm:max-w-md">
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
              activeTab === 'recent'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            최근 본
            {recentBooths.length > 0 && (
              <span className="bg-gray-200 text-gray-600 text-xs rounded-md px-1.5 py-0.5 leading-none">
                {recentBooths.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
              activeTab === 'favorites'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            관심
            {favoriteBooths.length > 0 && (
              <span className="bg-gray-200 text-gray-600 text-xs rounded-md px-1.5 py-0.5 leading-none">
                {favoriteBooths.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
              activeTab === 'collections'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            컬렉션
          </button>
        </div>

        {/* ─── Recent Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'recent' && (
          <div>
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
        <div className="mt-8 border-t border-gray-100 pt-6">
          <p className="text-xs font-medium text-gray-500 mb-2">개인정보 관리</p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-xs text-red-500 hover:text-red-600 transition-all duration-150"
            >
              <Trash2 className="w-3.5 h-3.5" />
              내 데이터 삭제 요청
            </button>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 leading-relaxed">
                  방문 기록, 관심 부스, 문의 내역, 알림 등 이 기기에 저장된 모든 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없어요.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleDeleteMyData}
                  className="flex-1 text-xs font-medium text-white bg-red-500 rounded-lg h-10 hover:bg-red-600 transition-all duration-150"
                >
                  삭제 확인
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg h-10 hover:bg-gray-50 transition-all duration-150"
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
