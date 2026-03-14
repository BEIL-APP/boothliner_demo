import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Logo } from '../../components/ui/Logo';

export default function AdminLoginPage() {
  const { isAdmin, loginAsAdmin } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) navigate('/admin/dashboard', { replace: true });
  }, [isAdmin, navigate]);

  const handleDemoLogin = () => {
    loginAsAdmin();
    navigate('/admin/dashboard', { replace: true });
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('이메일과 비밀번호를 입력해주세요', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      loginAsAdmin();
      showToast('로그인 성공!', 'success');
      navigate('/admin/dashboard', { replace: true });
    }, 800);
  };

  const handleOAuth = (provider: string) => {
    setLoading(true);
    showToast(`${provider} 로그인 연동 중... (데모)`, 'info');
    setTimeout(() => {
      loginAsAdmin();
      navigate('/admin/dashboard', { replace: true });
    }, 1000);
  };

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-10 text-center">
          <Logo size="md" />
          <div className="text-xs text-gray-400 font-medium">운영자 대시보드</div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-card p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">운영자 로그인</h1>
          <p className="text-sm text-gray-500 font-medium mb-8">부스 운영 대시보드에 접속하세요</p>

          {/* Demo Quick Login */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-5 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-medium text-gray-700">데모 모드:</span> 빠른 체험을 원하시면 아래 버튼으로 바로 시작하세요.
            </p>
          </div>

          <button
            onClick={handleDemoLogin}
            className="w-full h-10 flex items-center justify-center bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all duration-150 text-sm mb-5"
          >
            데모 로그인으로 시작하기
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* OAuth */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => handleOAuth('Google')}
              disabled={loading}
              className="flex-1 h-10 flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-150 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
            <button
              onClick={() => handleOAuth('Kakao')}
              disabled={loading}
              className="flex-1 h-10 flex items-center justify-center gap-2 bg-[#FEE500] border border-[#FEE500] rounded-lg text-sm font-medium text-[#191919] hover:bg-[#FDD800] transition-all duration-150 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.63 1.74 4.95 4.38 6.3l-1.12 4.1c-.1.36.3.65.62.45l4.77-3.18c.44.05.89.08 1.35.08 5.52 0 10-3.36 10-7.5S17.52 3 12 3z" fill="#191919"/></svg>
              카카오
            </button>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleFormLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">이메일</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-10 bg-white border border-gray-200 rounded-lg pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full h-10 bg-white border border-gray-200 rounded-lg pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 flex items-center justify-center bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-500 transition-all duration-150 text-sm disabled:opacity-50"
            >
              {loading ? '로그인 중...' : '이메일로 로그인'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          관람객 화면은{' '}
          <a href="/explore" className="text-gray-600 hover:text-gray-900 underline underline-offset-2 transition-colors">
            부스 둘러보기
          </a>{' '}
          에서 확인하세요
        </p>
      </div>
    </div>
  );
}
