import { useState } from 'react';
import { ArrowLeft, MessageSquare, Bell, Send } from 'lucide-react';
import { VisitorHeader } from '../../components/VisitorHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useThreads } from '../../hooks/useThreads';
import { getBooths, getGuestId } from '../../utils/localStorage';
import type { Thread } from '../../types';

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  if (diffH < 1) return '방금 전';
  if (diffH < 24) return `${Math.floor(diffH)}시간 전`;
  if (diffH < 48) return '어제';
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function MessagesPage() {
  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const { threads: allThreads, reply } = useThreads();
  const guestId = getGuestId();
  const threads = allThreads.filter((t) => t.visitorGuestId === guestId);
  const [selected, setSelected] = useState<Thread | null>(null);
  const [replyText, setReplyText] = useState('');

  const allBooths = getBooths();
  const boothMap = Object.fromEntries(allBooths.map((b) => [b.id, b]));

  const hasUnread = threads.some((t) => {
    const last = t.messages[t.messages.length - 1];
    return last?.from === 'booth';
  });

  const handleSendReply = (threadId: string) => {
    if (!replyText.trim()) return;
    const updated = reply(threadId, replyText.trim(), 'visitor');
    if (updated) {
      setSelected(updated);
      setReplyText('');
      showToast('메시지를 보냈어요', 'success');
    }
  };

  const selectedBooth = selected ? boothMap[selected.boothId] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <VisitorHeader />
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">문의 내역</h1>
            <p className="text-sm text-gray-500 font-medium">부스에 남긴 문의와 답변을 확인하세요</p>
          </div>
          {isLoggedIn && hasUnread && (
            <div className="h-6 px-2 rounded-lg inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-bold shadow-sm shadow-brand-100">
              <Bell className="w-3.5 h-3.5" />
              새로운 답변이 있어요
            </div>
          )}
        </div>

        <div className="md:flex md:gap-8">
          {/* ── Thread list ── */}
          <div className={`w-full md:w-[360px] md:shrink-0 ${selected ? 'hidden md:block' : ''}`}>
            {threads.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-base text-gray-500 font-bold">아직 문의가 없어요</p>
                <p className="text-sm text-gray-400 mt-1">관심 있는 부스에 궁금한 점을 물어보세요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {threads.map((thread) => {
                  const booth = boothMap[thread.boothId];
                  const lastMsg = thread.messages[thread.messages.length - 1];
                  const hasBoothReply = thread.messages.some((m) => m.from === 'booth');
                  const isNew = lastMsg?.from === 'booth';
                  const isActive = selected?.id === thread.id;
                  return (
                    <button
                      key={thread.id}
                      onClick={() => { setSelected(thread); setReplyText(''); }}
                      className={`w-full text-left bg-white border rounded-xl p-4 transition-all duration-200 shadow-sm group ${
                        isActive ? 'border-brand-400 ring-2 ring-brand-500/10' : 'border-gray-200/60 hover:border-brand-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                          {booth?.images[0] ? (
                            <img
                              src={booth.images[0]}
                              alt={booth.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1560472355-536de3962603?w=100&q=80';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🏪</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-[15px] text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                              {booth?.name ?? '알 수 없는 부스'}
                            </p>
                            <span className="text-[11px] font-bold text-gray-400 shrink-0 ml-2">
                              {formatTime(thread.lastUpdated)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate font-medium">{lastMsg?.text}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            {isNew && (
                              <span className="h-5 px-2 rounded font-bold text-[10px] text-brand-600 bg-brand-50">
                                새 답변
                              </span>
                            )}
                            {hasBoothReply && (
                              <span className="h-5 px-2 rounded font-bold text-[10px] text-emerald-600 bg-emerald-50">
                                답변 완료
                              </span>
                            )}
                            <span
                              className={`h-5 px-2 rounded font-bold text-[10px] ${
                                thread.status === '처리'
                                  ? 'text-emerald-600 bg-emerald-50'
                                  : thread.status === '보류'
                                  ? 'text-amber-600 bg-amber-50'
                                  : 'text-gray-500 bg-gray-100'
                              }`}
                            >
                              {thread.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Thread detail ── */}
          {selected ? (
            <div className="flex-1 min-w-0">
              {/* Back button — mobile only */}
              <button
                onClick={() => { setSelected(null); setReplyText(''); }}
                className="md:hidden flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                목록으로 돌아가기
              </button>

              <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden flex flex-col h-[600px] md:h-[700px] animate-fade-in">
                {/* Thread header */}
                <div className="px-6 py-4 flex items-center gap-4 border-b border-gray-100 bg-gray-50/30">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base text-gray-900 truncate">{selectedBooth?.name ?? '알 수 없는 부스'}</p>
                    <p className="text-xs font-bold text-gray-400">{selectedBooth?.category}</p>
                  </div>
                  <span
                    className={`h-6 px-2 rounded-lg text-[11px] font-bold inline-flex items-center ${
                      selected.status === '처리'
                        ? 'bg-emerald-50 text-emerald-700'
                        : selected.status === '보류'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {selected.status}
                  </span>
                </div>

                {/* Messages */}
                <div className="flex-1 px-6 py-6 space-y-4 overflow-y-auto bg-white/50 backdrop-blur-sm">
                  {selected.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.from === 'visitor' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.from === 'booth' && (
                        <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center mr-3 shrink-0 mt-1 shadow-sm">
                          <span className="text-sm">🏪</span>
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] md:max-w-[75%] px-4 py-3 shadow-sm ${
                          msg.from === 'visitor'
                            ? 'bg-brand-600 text-white rounded-xl rounded-tr-none'
                            : 'bg-white border border-gray-100 text-gray-800 rounded-xl rounded-tl-none'
                        }`}
                      >
                        <p className="text-[15px] leading-relaxed font-medium">{msg.text}</p>
                        <p
                          className={`text-[10px] font-bold mt-2 ${
                            msg.from === 'visitor' ? 'text-brand-200' : 'text-gray-400'
                          }`}
                        >
                          {formatTime(msg.at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply input */}
                <div className="border-t border-gray-100 px-6 py-5 bg-white">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="답변 확인 후 추가 문의를 남겨주세요…"
                      className="flex-1 text-[15px] text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 focus:bg-white transition-all placeholder:text-gray-400 min-h-[52px] max-h-32"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply(selected.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleSendReply(selected.id)}
                      disabled={!replyText.trim()}
                      className="w-12 h-12 bg-brand-600 text-white rounded-xl flex items-center justify-center hover:bg-brand-500 transition-all duration-200 disabled:opacity-40 shadow-lg shadow-brand-100 shrink-0 group"
                    >
                      <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center bg-white rounded-xl border border-gray-100 shadow-sm min-h-[600px]">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-base text-gray-500 font-bold">확인할 문의를 선택해 주세요</p>
                <p className="text-sm text-gray-400 mt-1">왼쪽 목록에서 대화 내용을 볼 수 있습니다</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
