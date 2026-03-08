import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, QrCode, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { setUserEmail } from '../../utils/localStorage';

export default function SignupPage() {
  const [params] = useSearchParams();
  const role = params.get('role') ?? 'visitor';
  const returnUrl = params.get('returnUrl') ?? '';
  const isOrganizer = role === 'organizer';

  const { toggleLogin, loginAsAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    agree: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isValid =
    form.name.trim() &&
    form.email.includes('@') &&
    form.password.length >= 6 &&
    form.agree &&
    (isOrganizer ? form.company.trim() : true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    // Mock: save email and set login state
    setUserEmail(form.email);

    if (isOrganizer) {
      loginAsAdmin();
      setDone(true);
      setTimeout(() => navigate(returnUrl || '/admin/booths'), 1800);
    } else {
      toggleLogin();
      setDone(true);
      setTimeout(() => navigate(returnUrl || '/explore'), 1800);
    }

    showToast(`${isOrganizer ? '운영자' : '관람객'}로 가입 완료!`, 'success');
  };

  if (done) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4 py-8 sm:p-8">
        <div className="text-center">
          <div className="bg-emerald-50 rounded-xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-1">가입 완료!</h2>
          <p className="text-sm text-gray-500">잠시 후 이동합니다…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:p-8">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
          <QrCode className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-900">BoothLiner</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200/60 shadow-card p-6 sm:p-8 w-full max-w-sm">
        {/* Back */}
        <Link
          to="/auth"
          className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          뒤로
        </Link>

        <div className="mb-6">
          <span className="inline-flex items-center bg-gray-100 text-gray-600 rounded-md text-xs px-2 h-5 mb-3">
            {isOrganizer ? '기업 (운영자)' : '개인 (관람객)'}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">이메일로 가입</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isOrganizer ? '부스를 만들고 리드를 관리하세요' : '관심 부스를 저장하고 문의하세요'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">이름</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="홍길동"
              className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Company (organizer only) */}
          {isOrganizer && (
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">회사명</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="(주)예시컴퍼니"
                className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition-all placeholder:text-gray-400"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">이메일</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="name@company.com"
              className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">비밀번호</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="6자 이상"
                className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 pr-10 text-sm focus:ring-2 focus:ring-brand-200 focus:border-brand-400 outline-none transition-all placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Agreement */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => handleChange('agree', e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-gray-900 accent-gray-900"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              <span className="font-medium text-gray-700">이용약관</span> 및{' '}
              <span className="font-medium text-gray-700">개인정보처리방침</span>에 동의합니다
              {isOrganizer && (
                <span className="block text-gray-400 mt-0.5">
                  (운영자 계정은 관람객 리드 데이터 보관에 동의가 필요합니다)
                </span>
              )}
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid}
            className="w-full h-10 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            {isOrganizer ? '운영자 계정 만들기' : '관람객으로 가입하기'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">또는</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* OAuth */}
        <Link
          to="/auth/oauth"
          className="block text-center text-[13px] text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          소셜 계정으로 빠르게 가입 →
        </Link>
      </div>

      <p className="mt-5 text-xs text-gray-400 text-center">
        데모 모드 · 실제 계정 생성 없이 동작합니다
      </p>
    </div>
  );
}
