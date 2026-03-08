import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { QrCode, Building2, User, ArrowRight, ChevronRight } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnUrl = params.get('returnUrl') ?? '';

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:p-8">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
          <QrCode className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-900">BoothLiner</span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border border-gray-200/60 shadow-card p-6 sm:p-8 w-full max-w-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">로그인 / 가입</h1>
        <p className="text-sm text-gray-500 font-medium mb-8">어떻게 참여하시나요?</p>

        <div className="space-y-3">
          {/* 개인(관람객) */}
          <button
            onClick={() => navigate(`/auth/signup?role=visitor${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}`)}
            className="w-full flex items-center gap-4 border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">개인 (관람객)</p>
              <p className="text-xs text-gray-500 mt-0.5">부스 탐색, 저장, 문의하기</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
          </button>

          {/* 기업(운영자) */}
          <button
            onClick={() => navigate(`/auth/signup?role=organizer${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}`)}
            className="w-full flex items-center gap-4 border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">기업 (부스 운영자)</p>
              <p className="text-xs text-gray-500 mt-0.5">부스 생성, QR 발급, 문의 관리</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">또는 소셜 로그인</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* OAuth quick button */}
        <button
          onClick={() => navigate('/auth/oauth')}
          className="w-full h-10 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-150 flex items-center justify-center gap-2"
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
      <p className="mt-6 text-xs text-gray-400">
        데모 모드: OAuth는 UI만 표시, 실제 연동 없음
      </p>

      {/* Admin shortcut */}
      <div className="mt-4 text-center">
        <Link
          to="/admin/login"
          className="text-[13px] text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1 justify-center"
        >
          운영자 대시보드로 직접 이동 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Visitor shortcut */}
      <div className="mt-2 text-center">
        <Link
          to="/scan/booth-001"
          className="text-[13px] text-gray-500 hover:text-gray-700 transition-colors"
        >
          로그인 없이 관람객으로 둘러보기 →
        </Link>
      </div>
    </div>
  );
}
