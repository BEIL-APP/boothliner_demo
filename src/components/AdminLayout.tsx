import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Inbox,
  QrCode,
  LogOut,
  PlusCircle,
  BarChart3,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/admin/booths', icon: <LayoutGrid className="w-4 h-4" />, label: '내 부스' },
  { to: '/admin/inbox', icon: <Inbox className="w-4 h-4" />, label: '문의 인박스' },
  { to: '/admin/leads', icon: <Users className="w-4 h-4" />, label: '리드 목록' },
  { to: '/organizer/preview', icon: <BarChart3 className="w-4 h-4" />, label: '주최자 프리뷰' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logoutAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-gray-100 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-100">
          <Link to="/admin/booths" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 leading-tight">BoothLiner</div>
              <div className="text-[10px] text-gray-400 leading-tight">운영자 대시보드</div>
            </div>
          </Link>
        </div>

        {/* New Booth CTA */}
        <div className="px-4 pt-4 pb-2">
          <Link
            to="/admin/booths/new"
            className="flex items-center gap-2 w-full bg-brand-600 text-white text-sm font-medium rounded-xl px-3 py-2.5 hover:bg-brand-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            새 부스 만들기
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <Link
            to="/auth"
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <QrCode className="w-4 h-4" />
            관람객 모드
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
