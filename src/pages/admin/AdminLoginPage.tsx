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
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">BoothLiner</div>
            <div className="text-xs text-gray-400">운영자 대시보드</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-gray-200/60 shadow-card p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-1.5">운영자 로그인</h1>
          <p className="text-sm text-gray-500 mb-8">
            데모 환경입니다. 버튼 하나로 로그인하세요.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-medium text-gray-700">데모 모드:</span> 실제 인증 없이 모든 운영자 기능을 체험할 수 있습니다.
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full h-10 flex items-center justify-center bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all duration-150 text-sm"
          >
            데모 로그인으로 시작하기
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          관람객 화면은{' '}
          <a href="/scan/booth-001" className="text-gray-600 hover:text-gray-900 underline underline-offset-2 transition-colors">
            /scan/booth-001
          </a>{' '}
          에서 확인하세요
        </p>
      </div>
    </div>
  );
}
