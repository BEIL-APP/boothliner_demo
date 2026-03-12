import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MessageSquare, Info, ArrowRight } from 'lucide-react';
import { VisitorHeader } from '../../components/VisitorHeader';
import { getGuestId, getNotifications, markAllNotificationsRead } from '../../utils/localStorage';
import type { AppNotification } from '../../types';

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return '방금 전';
  if (diffH < 24) return `${Math.floor(diffH)}시간 전`;
  if (diffH < 48) return '어제';
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
  const guestId = getGuestId();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    setNotifications(getNotifications(guestId));
    markAllNotificationsRead(guestId);
  }, [guestId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <VisitorHeader />

      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 pb-24">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">알림</h1>
        <p className="text-sm text-gray-500 font-medium mb-8">이 기기에서 받은 새로운 소식들을 확인하세요</p>

        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-200" />
            </div>
            <p className="text-base text-gray-500 font-bold">아직 알림이 없어요</p>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              문의 답변이 오면 여기서 알려드릴게요
            </p>
          </div>
        ) : (
          <div className="max-w-2xl space-y-3">
            {notifications.map((n) => (
              <Link
                key={n.id}
                to={n.threadId ? '/messages' : (n.boothId ? `/scan/${n.boothId}` : '#')}
                className="flex items-start gap-4 bg-white border border-gray-200/60 rounded-xl p-4 hover:border-brand-200 hover:shadow-card-hover transition-all duration-200 shadow-sm group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform ${
                  n.type === 'reply' ? 'bg-brand-50' : 'bg-gray-50'
                }`}>
                  {n.type === 'reply' ? (
                    <MessageSquare className="w-5 h-5 text-brand-600" />
                  ) : (
                    <Info className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[15px] font-bold text-gray-900 leading-tight group-hover:text-brand-600 transition-colors">{n.title}</p>
                    <p className="text-[11px] font-bold text-gray-300 ml-3 shrink-0">{formatTime(n.createdAt)}</p>
                  </div>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-2">{n.body}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 shrink-0 mt-1 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
