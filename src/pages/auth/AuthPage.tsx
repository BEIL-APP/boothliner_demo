import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Building2, User, ArrowRight, ChevronRight } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center p-5">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 bg-brand-600 rounded-2xl flex items-center justify-center shadow-md">
          <QrCode className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900 leading-tight">BoothLiner</div>
          <div className="text-xs text-gray-400 leading-tight">B2B 팝업 이벤트 플랫폼</div>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-card p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1.5">로그인 / 가입</h1>
        <p className="text-sm text-gray-500 mb-7">어떻게 참여하시나요?</p>

        <div className="space-y-3">
          {/* 개인(관람객) */}
          <button
            onClick={() => navigate('/auth/signup?role=visitor')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-brand-300 hover:bg-brand-50 transition-all group text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
              <User className="w-5 h-5 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">개인 (관람객)</p>
              <p className="text-xs text-gray-500 mt-0.5">부스 탐색, 저장, 문의하기</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-400 shrink-0 transition-colors" />
          </button>

          {/* 기업(운영자) */}
          <button
            onClick={() => navigate('/auth/signup?role=organizer')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-brand-300 hover:bg-brand-50 transition-all group text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
              <Building2 className="w-5 h-5 text-purple-600 group-hover:text-brand-600 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">기업 (부스 운영자)</p>
              <p className="text-xs text-gray-500 mt-0.5">부스 생성, QR 발급, 문의 관리</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-400 shrink-0 transition-colors" />
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">또는 소셜 로그인</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* OAuth quick buttons */}
        <button
          onClick={() => navigate('/auth/oauth')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 계속하기
        </button>
      </div>

      {/* Demo note */}
      <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
        <span>데모 모드: OAuth는 UI만 표시, 실제 연동 없음</span>
      </div>

      {/* Admin shortcut */}
      <div className="mt-4 text-center">
        <Link
          to="/admin/login"
          className="text-xs text-gray-400 hover:text-brand-600 transition-colors flex items-center gap-1 justify-center"
        >
          운영자 대시보드로 직접 이동 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Visitor shortcut */}
      <div className="mt-2 text-center">
        <Link
          to="/scan/booth-001"
          className="text-xs text-gray-400 hover:text-brand-600 transition-colors"
        >
          로그인 없이 관람객으로 둘러보기 →
        </Link>
      </div>
    </div>
  );
}
