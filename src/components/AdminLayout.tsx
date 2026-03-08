import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Inbox,
  QrCode,
  LogOut,
  Plus,
  BarChart3,
  Users,
  ExternalLink,
  Menu,
  X,
  Settings,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/admin/dashboard', icon: BarChart3, label: '대시보드' },
  { to: '/admin/booths', icon: LayoutGrid, label: '내 부스' },
  { to: '/admin/inbox', icon: Inbox, label: '문의 인박스' },
  { to: '/admin/leads', icon: Users, label: '리드 목록' },
];

const pageTitles: Record<string, string> = {
  '/admin/dashboard': '대시보드',
  '/admin/booths': '내 부스',
  '/admin/inbox': '문의 인박스',
  '/admin/leads': '리드 목록',
  '/admin/settings': '설정',
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logoutAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  const sidebarContent = (
    <>
      <div className="h-14 flex items-center px-4 border-b border-white/[0.06]">
        <Link to="/admin/booths" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <QrCode className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[13px] font-semibold text-white tracking-tight">BoothLiner</span>
        </Link>
      </div>

      <div className="px-3 pt-3 pb-1">
        <Link
          to="/admin/booths/new"
          className="flex items-center gap-2 w-full bg-brand-600 text-white text-[13px] font-medium rounded-lg px-3 h-9 hover:bg-brand-500 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          새 부스 만들기
        </Link>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-white/[0.06] space-y-0.5">
        <Link
          to="/admin/settings"
          className={`flex items-center gap-2.5 w-full px-2.5 h-8 rounded-lg text-[13px] transition-colors ${
            location.pathname === '/admin/settings'
              ? 'bg-white/10 text-white font-medium'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.05]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          설정
        </Link>
        <Link
          to="/explore"
          className="flex items-center gap-2.5 w-full px-2.5 h-8 rounded-lg text-[13px] text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          관람객 탐색
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-2.5 h-8 rounded-lg text-[13px] text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          로그아웃
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[220px] shrink-0 bg-gray-950 flex-col border-r border-white/[0.06] sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-[260px] h-full bg-gray-950 flex flex-col shadow-2xl animate-slide-in-left">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3.5 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors -ml-1"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-gray-900">
              {Object.entries(pageTitles).find(([key]) => location.pathname.startsWith(key))?.[1] ?? 'BoothLiner'}
            </span>
          </div>
          <Link
            to="/admin/booths/new"
            className="flex items-center gap-1.5 h-8 px-3 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">새 부스</span>
          </Link>
        </header>

        <main className="flex-1 min-w-0 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
