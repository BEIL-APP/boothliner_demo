import { useState, useMemo } from 'react';
import {
  Search, Tag, ChevronDown, Send, ArrowLeft,
  Clock, CheckCircle, PauseCircle, X, MessageSquare, ShieldOff, Shield,
  Settings, Plus, Pencil, Trash2,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useThreads } from '../../hooks/useThreads';
import { useToast } from '../../contexts/ToastContext';
import {
  getBooths, blockThread, saveNotification,
  getReplyTemplates, saveReplyTemplate, deleteReplyTemplate,
} from '../../utils/localStorage';
import type { Thread, ReplyTemplate } from '../../types';

type StatusFilter = 'all' | '미처리' | '처리' | '보류';

const TAG_SUGGESTIONS = ['견적문의', 'B2B', '대량주문', '기술문의', '납품일정', '샘플요청', 'OEM'];

function StatusBadge({ status }: { status: Thread['status'] }) {
  const map = {
    '미처리': { icon: <Clock className="w-3 h-3" />, cls: 'bg-gray-100 text-gray-600' },
    '처리': { icon: <CheckCircle className="w-3 h-3" />, cls: 'bg-emerald-50 text-emerald-700' },
    '보류': { icon: <PauseCircle className="w-3 h-3" />, cls: 'bg-amber-50 text-amber-700' },
  };
  const s = map[status];
  return (
    <span className={`h-6 px-2 rounded-md text-xs font-medium inline-flex items-center gap-1 ${s.cls}`}>
      {s.icon}
      {status}
    </span>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return '방금 전';
  if (diffH < 24) return `${Math.floor(diffH)}시간 전`;
  if (diffH < 48) return '어제';
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// ─── Template Management Modal ────────────────────────────────────────────────

function TemplateModal({ onClose }: { onClose: () => void }) {
  const [templates, setTemplates] = useState<ReplyTemplate[]>(() => getReplyTemplates());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editText, setEditText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { showToast } = useToast();

  const startEdit = (t: ReplyTemplate) => {
    setEditingId(t.id);
    setEditLabel(t.label);
    setEditText(t.text);
    setIsAdding(false);
  };

  const startAdd = () => {
    setEditingId(null);
    setEditLabel('');
    setEditText('');
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!editLabel.trim() || !editText.trim()) return;
    const tpl: ReplyTemplate = {
      id: editingId ?? `tpl-${Date.now()}`,
      label: editLabel.trim(),
      text: editText.trim(),
      createdAt: editingId
        ? (templates.find((t) => t.id === editingId)?.createdAt ?? new Date().toISOString())
        : new Date().toISOString(),
    };
    saveReplyTemplate(tpl);
    const updated = getReplyTemplates();
    setTemplates(updated);
    setEditingId(null);
    setIsAdding(false);
    showToast('템플릿이 저장됐어요', 'success');
  };

  const handleDelete = (id: string) => {
    deleteReplyTemplate(id);
    setTemplates(getReplyTemplates());
    if (editingId === id) { setEditingId(null); setIsAdding(false); }
    showToast('템플릿이 삭제됐어요', 'info');
  };

  const isEditing = editingId !== null || isAdding;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">템플릿 답변 관리</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-150">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 space-y-2">
          {templates.map((t) => (
            <div key={t.id} className="border border-gray-200/60 rounded-xl p-3">
              {editingId === t.id ? (
                <div className="space-y-2">
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    placeholder="템플릿 이름"
                    className="w-full h-9 text-xs bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                  />
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="템플릿 내용"
                    rows={3}
                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 h-9 text-xs font-medium bg-brand-600 text-white rounded-lg flex items-center justify-center hover:bg-brand-500 transition-all duration-150"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 h-9 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-150"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 mb-0.5">{t.label}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{t.text}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(t)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all duration-150"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-150"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isAdding && (
            <div className="border border-dashed border-gray-300 rounded-xl p-3 space-y-2">
              <input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="템플릿 이름"
                autoFocus
                className="w-full h-9 text-xs bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
              />
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="템플릿 내용"
                rows={3}
                className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={!editLabel.trim() || !editText.trim()}
                  className="flex-1 h-9 text-xs font-medium bg-brand-600 text-white rounded-lg flex items-center justify-center hover:bg-brand-500 transition-all duration-150 disabled:opacity-40"
                >
                  추가
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="flex-1 h-9 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-150"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="px-4 pb-3 sm:px-6 sm:pb-4">
            <button
              onClick={startAdd}
              className="w-full h-9 flex items-center justify-center gap-2 text-xs font-medium border border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-all duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              템플릿 추가
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminInboxPage() {
  const { threads, reply, updateStatus, updateMemo, addTag, removeTag } = useThreads();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Thread | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<ReplyTemplate[]>(() => getReplyTemplates());

  const allBooths = getBooths();
  const boothMap = Object.fromEntries(allBooths.map((b) => [b.id, b]));

  const filtered = useMemo(() => {
    return threads.filter((t) => {
      const matchStatus = filter === 'all' || t.status === filter;
      const booth = boothMap[t.boothId];
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        booth?.name.toLowerCase().includes(q) ||
        t.messages.some((m) => m.text.toLowerCase().includes(q)) ||
        t.tags.some((tg) => tg.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [threads, filter, search, boothMap]);

  // Keep selected up-to-date
  const selectedThread = selected
    ? threads.find((t) => t.id === selected.id) ?? null
    : null;

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedThread) return;
    reply(selectedThread.id, replyText.trim(), 'booth');
    if (selectedThread.status === '미처리') {
      updateStatus(selectedThread.id, '처리');
    }

    // Send in-app notification with PENDING→SENT lifecycle (A-3)
    if (selectedThread.visitorGuestId) {
      saveNotification({
        id: `notif-${Date.now()}`,
        targetGuestId: selectedThread.visitorGuestId,
        type: 'reply',
        title: `${boothMap[selectedThread.boothId]?.name ?? '부스'}에서 답변이 왔어요`,
        body: replyText.trim().slice(0, 100),
        read: false,
        status: 'PENDING',
        boothId: selectedThread.boothId,
        threadId: selectedThread.id,
        createdAt: new Date().toISOString(),
      });
    }

    setReplyText('');
    showToast('답변이 전송됐어요', 'success');
  };

  const handleToggleBlock = () => {
    if (!selectedThread) return;
    blockThread(selectedThread.id);
    showToast(
      selectedThread.blocked ? '차단이 해제됐어요' : '해당 문의를 차단했어요',
      selectedThread.blocked ? 'info' : 'error'
    );
  };

  const handleAddTag = (tag: string) => {
    if (!selectedThread || !tag.trim()) return;
    addTag(selectedThread.id, tag.trim());
    setNewTag('');
    setShowTagInput(false);
  };

  const counts: Record<StatusFilter, number> = {
    all: threads.length,
    '미처리': threads.filter((t) => t.status === '미처리').length,
    '처리': threads.filter((t) => t.status === '처리').length,
    '보류': threads.filter((t) => t.status === '보류').length,
  };

  return (
    <AdminLayout>
      {showTemplateModal && (
        <TemplateModal
          onClose={() => {
            setShowTemplateModal(false);
            setTemplates(getReplyTemplates());
          }}
        />
      )}

      <div className="flex h-screen overflow-hidden">
        {/* Left: Thread List */}
        <div className={`flex flex-col border-gray-100 ${selectedThread ? 'hidden md:flex' : 'flex'} w-full md:w-[340px] md:border-r md:shrink-0`}>
          {/* Inbox header */}
          <div className="px-4 py-4 sm:p-6 border-b border-gray-100">
            <h1 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4">문의 인박스</h1>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="부스명 또는 키워드 검색"
                className="w-full h-9 bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 text-sm focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Status filter */}
            <div className="flex gap-1.5 flex-wrap">
              {(['all', '미처리', '처리', '보류'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`flex items-center gap-1 text-xs font-medium px-2.5 h-7 rounded-md transition-all duration-150 ${
                    filter === s
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {s === 'all' ? '전체' : s}
                  <span className={`rounded-md px-1 text-[10px] ${filter === s ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-400'}`}>
                    {counts[s]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">문의가 없어요</p>
              </div>
            ) : (
              filtered.map((t) => {
                const booth = boothMap[t.boothId];
                const lastMsg = t.messages[t.messages.length - 1];
                const isActive = selectedThread?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className={`w-full text-left px-3 py-2.5 sm:px-4 sm:py-3 border-b border-gray-100 transition-colors ${
                      isActive ? 'bg-gray-50' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {booth?.images[0] ? (
                          <img src={booth.images[0]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-base">🏪</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">{booth?.name ?? t.boothId}</p>
                          <span className="text-xs text-gray-400 shrink-0 ml-2">{formatTime(t.lastUpdated)}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mb-1.5">{lastMsg?.text}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusBadge status={t.status} />
                          {t.blocked && (
                            <span className="h-6 px-2 rounded-md text-xs font-medium inline-flex items-center gap-0.5 bg-red-50 text-red-600">
                              <ShieldOff className="w-2.5 h-2.5" /> 차단
                            </span>
                          )}
                          {t.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="h-6 px-2 rounded-md text-xs bg-gray-100 text-gray-500 inline-flex items-center">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Thread Detail */}
        {selectedThread ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Detail Header */}
            <div className="bg-white px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setSelected(null)}
                className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-150 shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{boothMap[selectedThread.boothId]?.name}</p>
                  <span className="text-xs text-gray-400">
                    {selectedThread.visitorId === 'user'
                      ? `로그인: ${selectedThread.visitorName ?? '사용자'}`
                      : '비로그인'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                  <StatusBadge status={selectedThread.status} />
                  {selectedThread.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-0.5 h-6 px-2 rounded-md text-xs bg-gray-100 text-gray-500">
                      #{tag}
                      <button onClick={() => removeTag(selectedThread.id, tag)} className="ml-0.5 hover:text-red-400 transition-all duration-150">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => setShowTagInput(!showTagInput)}
                    className="text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 px-1.5 py-0.5 rounded-md transition-all duration-150 flex items-center gap-0.5"
                  >
                    <Tag className="w-3 h-3" /> 태그
                  </button>
                </div>
              </div>

              {/* Status actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={handleToggleBlock}
                  title={selectedThread.blocked ? '차단 해제' : '스팸 차단'}
                  className={`p-1.5 rounded-lg transition-all duration-150 ${
                    selectedThread.blocked
                      ? 'bg-red-50 text-red-500 hover:bg-red-100'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-red-500'
                  }`}
                >
                  {selectedThread.blocked ? (
                    <Shield className="w-4 h-4" />
                  ) : (
                    <ShieldOff className="w-4 h-4" />
                  )}
                </button>
                <select
                  value={selectedThread.status}
                  onChange={(e) => {
                    updateStatus(selectedThread.id, e.target.value as Thread['status']);
                    showToast(`상태가 "${e.target.value}"으로 변경됐어요`, 'info');
                  }}
                  className="h-8 sm:h-9 text-xs bg-white border border-gray-200 rounded-lg px-2 sm:px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 text-gray-700 transition-all"
                >
                  <option value="미처리">미처리</option>
                  <option value="처리">처리</option>
                  <option value="보류">보류</option>
                </select>
              </div>
            </div>

            {/* Tag input row */}
            {showTagInput && (
              <div className="bg-gray-50 px-4 py-2.5 sm:px-6 sm:py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">빠른 태그:</span>
                {TAG_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleAddTag(s)}
                    className="text-xs bg-white border border-gray-200 text-gray-600 rounded-md px-2.5 py-1 hover:border-gray-300 hover:text-gray-700 transition-all duration-150"
                  >
                    #{s}
                  </button>
                ))}
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(newTag); }}
                  placeholder="직접 입력 후 Enter"
                  className="h-8 sm:h-9 text-xs bg-white border border-gray-200 rounded-lg px-2.5 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400 flex-1 min-w-[120px]"
                />
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-4 space-y-3">
              {selectedThread.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.from === 'booth' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.from === 'visitor' && (
                    <div className="w-7 h-7 bg-gray-200 rounded-lg flex items-center justify-center mr-2 shrink-0 mt-1 text-xs">
                      {selectedThread.visitorId === 'user' ? '👤' : '👻'}
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] px-3 py-2.5 sm:px-4 sm:py-3 ${
                      msg.from === 'booth'
                        ? 'bg-brand-600 text-white rounded-xl rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-xl rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p className={`text-xs mt-1.5 ${msg.from === 'booth' ? 'text-brand-200' : 'text-gray-400'}`}>
                      {formatTime(msg.at)}
                      {msg.from === 'booth' && ' · 운영자'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Memo */}
            <div className="px-4 py-2.5 sm:px-6 sm:py-3 bg-amber-50/50 border-t border-amber-100">
              <textarea
                value={selectedThread.memo}
                onChange={(e) => updateMemo(selectedThread.id, e.target.value)}
                placeholder="내부 메모 (관람객에게 보이지 않아요)"
                rows={1}
                className="w-full text-xs text-amber-800 bg-transparent resize-none outline-none placeholder:text-amber-400"
              />
            </div>

            {/* Template replies */}
            <div className="px-4 py-2.5 sm:px-6 sm:py-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <ChevronDown className="w-3 h-3" /> 템플릿 답변
                </p>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 px-1.5 py-0.5 rounded-md transition-all duration-150"
                >
                  <Settings className="w-3 h-3" /> 관리
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setReplyText(t.text)}
                    className="text-xs text-gray-600 bg-white border border-gray-200 rounded-md px-3 py-1.5 hover:border-gray-300 hover:text-gray-700 transition-all duration-150"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply input */}
            <div className="px-3 py-3 sm:px-6 sm:py-4 border-t border-gray-100 bg-white flex items-end gap-2 sm:gap-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="관람객에게 답변을 작성하세요…"
                rows={2}
                className="flex-1 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 resize-none outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="h-9 px-3 sm:px-4 bg-brand-600 text-white text-[13px] font-medium rounded-lg flex items-center gap-1.5 sm:gap-2 hover:bg-brand-500 transition-all duration-150 disabled:opacity-40 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">답변 전송</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-center">
            <div>
              <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">왼쪽에서 문의를 선택하세요</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
