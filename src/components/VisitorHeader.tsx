import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, User, LogIn, Bell, Settings, Compass } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getGuestId, getUnreadNotificationCount } from '../utils/localStorage';

import { Logo } from './ui/Logo';

export function VisitorHeader() {
  const { isLoggedIn, toggleLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) { setUnreadCount(0); return; }
    const guestId = getGuestId();
    setUnreadCount(getUnreadNotificationCount(guestId));
  }, [location.pathname, isLoggedIn]);

  const navItems = [
    { to: '/explore', icon: Compass, label: '탐색', authOnly: false },
    { to: '/me', icon: Heart, label: '마이', authOnly: false },
    { to: '/messages', icon: MessageSquare, label: '문의', authOnly: true },
    { to: '/notifications', icon: Bell, label: '알림', authOnly: true },
    { to: '/settings', icon: Settings, label: '설정', authOnly: true },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="sm" />
        </Link>

        <div className="flex items-center">
          {navItems.filter((item) => !item.authOnly || isLoggedIn).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            const isBell = item.to === '/notifications';
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 h-9 px-2 md:px-3 rounded-lg transition-colors ${
                  isActive
                    ? 'text-brand-600 bg-brand-50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="relative">
                  <Icon className="w-[18px] h-[18px]" />
                  {isBell && unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </span>
                <span className="hidden md:inline text-[13px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {isLoggedIn && <div className="w-px h-5 bg-gray-200 mx-1.5 hidden md:block" />}

          <button
            onClick={() => isLoggedIn ? toggleLogin() : navigate('/auth')}
            className={`flex items-center gap-1.5 h-9 px-2 md:px-3 rounded-lg transition-colors ${
              isLoggedIn
                ? 'text-brand-600 bg-brand-50'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title={isLoggedIn ? '로그아웃' : '로그인'}
          >
            {isLoggedIn ? (
              <>
                <User className="w-[18px] h-[18px]" />
                <span className="hidden md:inline text-[13px] font-medium">마이</span>
              </>
            ) : (
              <>
                <LogIn className="w-[18px] h-[18px]" />
                <span className="hidden md:inline text-[13px] font-medium">로그인</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
