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
  UserCheck,
  MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/admin/dashboard', icon: BarChart3, label: '대시보드', mobileLabel: '대시보드' },
  { to: '/admin/booths', icon: LayoutGrid, label: '내 부스 관리', mobileLabel: '부스' },
  { to: '/admin/inbox', icon: Inbox, label: '문의 인박스', mobileLabel: '문의' },
  { to: '/admin/leads', icon: Users, label: '리드 목록', mobileLabel: '리드' },
  { to: '/admin/team', icon: UserCheck, label: '전체 팀원 관리', mobileLabel: '팀원' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logoutAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (sidebarOpen || mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen, mobileMenuOpen]);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  const sidebarContent = (
    <>
      <div className="h-12 flex items-center px-4 border-b border-white/[0.06]">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
            <QrCode className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">BoothLiner</span>
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

      {/* Tablet sidebar overlay */}
      {sidebarOpen && (
        <div className="hidden md:block fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[260px] h-screen h-[100dvh] bg-gray-950 flex flex-col overflow-y-auto shadow-2xl animate-slide-in-left">
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
        {/* Tablet top bar */}
        <header className="hidden md:flex lg:hidden items-center justify-between h-12 px-4 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors -ml-1"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <Link
            to="/admin/booths/new"
            className="flex items-center gap-1.5 h-8 px-3 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">새 부스</span>
          </Link>
        </header>

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-gray-100 shrink-0">
          <Link to="/admin/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
              <QrCode className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900 tracking-tight">BoothLiner</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/booths/new"
              className="flex items-center gap-1.5 h-9 px-3 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-500 transition-colors shadow-sm shadow-brand-100"
            >
              <Plus className="w-3.5 h-3.5" />
              새 부스
            </Link>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="관리 메뉴 열기"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-auto bg-gray-50 pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-xl shadow-[0_-8px_24px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-5 px-2 pt-2 pb-5">
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-colors ${
                    active ? 'text-brand-600 bg-brand-50' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="text-[11px] font-semibold leading-none">{item.mobileLabel}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Mobile overflow actions */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl border-t border-gray-100 animate-slide-up-sheet">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-4 pb-6">
              <div className="flex items-center justify-between px-1 py-3">
                <p className="text-sm font-bold text-gray-900">관리 메뉴</p>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  aria-label="관리 메뉴 닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <Link
                  to="/admin/settings"
                  className="flex items-center gap-3 h-12 px-4 rounded-xl bg-gray-50 text-sm font-medium text-gray-700"
                >
                  <Settings className="w-4 h-4" />
                  설정
                </Link>
                <Link
                  to="/explore"
                  className="flex items-center gap-3 h-12 px-4 rounded-xl bg-gray-50 text-sm font-medium text-gray-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  관람객 탐색
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full h-12 px-4 rounded-xl bg-red-50 text-sm font-medium text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
