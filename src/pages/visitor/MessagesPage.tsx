import { useState } from 'react';
import { ArrowLeft, MessageSquare, Bell, Send } from 'lucide-react';
import { VisitorHeader } from '../../components/VisitorHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useThreads } from '../../hooks/useThreads';
import { getBooths } from '../../utils/localStorage';
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
  const { threads, reply } = useThreads();
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900">문의 내역</h1>
            <p className="text-[13px] sm:text-sm text-gray-500">부스에 남긴 문의와 답변을 확인해요</p>
          </div>
          {isLoggedIn && hasUnread && (
            <div className="h-5 px-1.5 rounded-md inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-medium">
              <Bell className="w-3 h-3" />
              새 답변
            </div>
          )}
        </div>

        <div className="md:flex md:gap-6">
          {/* ── Thread list ── */}
          <div className={`w-full md:w-[340px] md:shrink-0 ${selected ? 'hidden md:block' : ''}`}>
            {threads.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">아직 문의가 없어요</p>
                <p className="text-xs text-gray-300 mt-1">부스 페이지에서 문의를 남겨보세요</p>
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
                      className={`w-full text-left bg-white border rounded-xl p-3 hover:border-gray-300 transition-all duration-150 ${
                        isActive ? 'border-brand-300 ring-1 ring-brand-100' : 'border-gray-200/60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          {booth?.images[0] ? (
                            <img
                              src={booth.images[0]}
                              alt={booth.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1560472355-536de3962603?w=100&q=80';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-base">🏪</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {booth?.name ?? '알 수 없는 부스'}
                            </p>
                            <span className="text-xs text-gray-400 shrink-0 ml-2">
                              {formatTime(thread.lastUpdated)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{lastMsg?.text}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {isLoggedIn && isNew && (
                              <span className="h-5 px-1.5 rounded-md inline-flex items-center gap-1 text-xs font-medium text-brand-600 bg-brand-50">
                                <Bell className="w-2.5 h-2.5" /> 새 답변
                              </span>
                            )}
                            {hasBoothReply && (
                              <span className="h-5 px-1.5 rounded-md inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-50">
                                답변 완료
                              </span>
                            )}
                            <span
                              className={`h-5 px-1.5 rounded-md inline-flex items-center text-xs font-medium ${
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
                className="md:hidden flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                목록으로
              </button>

              <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden flex flex-col">
                {/* Thread header */}
                <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{selectedBooth?.name ?? '알 수 없는 부스'}</p>
                    <p className="text-xs text-gray-400">{selectedBooth?.category}</p>
                  </div>
                  <span
                    className={`h-5 px-1.5 rounded-md text-xs font-medium inline-flex items-center ${
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
                <div className="px-4 py-4 space-y-3 min-h-[40vh] md:min-h-[50vh] overflow-y-auto">
                  {selected.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.from === 'visitor' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.from === 'booth' && (
                        <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center mr-2 shrink-0 mt-1">
                          <span className="text-xs">🏪</span>
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] md:max-w-[70%] px-4 py-3 ${
                          msg.from === 'visitor'
                            ? 'bg-brand-600 text-white rounded-xl rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-xl rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p
                          className={`text-xs mt-1.5 ${
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
                <div className="border-t border-gray-200 px-4 py-3 flex items-end gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="추가 문의나 답변 확인 후 메시지를 보내세요…"
                    className="flex-1 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400 min-h-[44px] max-h-32"
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
                    className="w-10 h-10 bg-brand-600 text-white rounded-lg flex items-center justify-center hover:bg-brand-500 transition-all duration-150 disabled:opacity-40 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center min-h-[50vh]">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">스레드를 선택해 주세요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
