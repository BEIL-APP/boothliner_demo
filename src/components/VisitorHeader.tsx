import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { QrCode, Heart, MessageSquare, User, LogIn, Bell, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getGuestId, getUnreadNotificationCount } from '../utils/localStorage';

export function VisitorHeader() {
  const { isLoggedIn, toggleLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const guestId = getGuestId();
    setUnreadCount(getUnreadNotificationCount(guestId));
  }, [location.pathname]);

  const navItems = [
    { to: '/me', icon: Heart, label: '마이' },
    { to: '/messages', icon: MessageSquare, label: '문의' },
    { to: '/notifications', icon: Bell, label: '알림' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
            <QrCode className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm tracking-tight">BoothLiner</span>
        </Link>

        <div className="flex items-center">
          {navItems.map((item) => {
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

          <Link
            to="/settings"
            className={`relative flex items-center gap-1.5 h-9 px-2 md:px-3 rounded-lg transition-colors ${
              location.pathname === '/settings'
                ? 'text-brand-600 bg-brand-50'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-[18px] h-[18px]" />
            <span className="hidden md:inline text-[13px] font-medium">설정</span>
          </Link>

          <div className="w-px h-5 bg-gray-200 mx-1.5 hidden md:block" />

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
