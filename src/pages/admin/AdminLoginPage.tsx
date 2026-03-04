import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLoginPage() {
  const { isAdmin, loginAsAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) navigate('/admin/booths', { replace: true });
  }, [isAdmin, navigate]);

  const handleLogin = () => {
    loginAsAdmin();
    navigate('/admin/booths', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 bg-brand-600 rounded-2xl flex items-center justify-center shadow-sm">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900">BoothLiner</div>
            <div className="text-xs text-gray-400">운영자 대시보드</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card px-6 py-8">
          <h1 className="text-xl font-bold text-gray-900 mb-2">운영자 로그인</h1>
          <p className="text-sm text-gray-400 mb-8">
            데모 환경입니다. 버튼 하나로 로그인하세요.
          </p>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3.5 mb-6 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
            <p className="text-xs text-brand-700 leading-relaxed">
              <span className="font-medium">데모 모드:</span> 실제 인증 없이 모든 운영자 기능을 체험할 수 있습니다.
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-brand-600 text-white font-medium py-3.5 rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
          >
            데모 로그인으로 시작하기
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          관람객 화면은{' '}
          <a href="/scan/booth-001" className="text-brand-600 hover:underline">
            /scan/booth-001
          </a>{' '}
          에서 확인하세요
        </p>
      </div>
    </div>
  );
}
