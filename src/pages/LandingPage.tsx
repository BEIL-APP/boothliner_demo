import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  MessageSquare,
  Users,
  ClipboardList,
  BarChart3,
  ArrowRight,
  Menu,
  X,
  Zap,
  ScanLine,
  FileDown,
  ChevronRight,
  Star,
} from 'lucide-react';
import { useBooths } from '../hooks/useBooths';

function Navbar() {
  const [open, setOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
            <QrCode className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">BoothLiner</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <button onClick={() => scrollTo('features')} className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">기능</button>
          <button onClick={() => scrollTo('how-it-works')} className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">이용 방법</button>
          <Link to="/explore" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">부스 둘러보기</Link>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/admin/login"
            className="h-8 px-3 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-150 inline-flex items-center"
          >
            운영자 로그인
          </Link>
          <Link
            to="/explore"
            className="h-8 px-3 text-[13px] font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-500 transition-all duration-150 inline-flex items-center gap-1"
          >
            부스 둘러보기 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in">
          <div className="max-w-6xl mx-auto px-4 py-4 space-y-1">
            <button onClick={() => scrollTo('features')} className="block w-full text-left px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">기능</button>
            <button onClick={() => scrollTo('how-it-works')} className="block w-full text-left px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50">이용 방법</button>
            <Link to="/explore" className="block px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50" onClick={() => setOpen(false)}>부스 둘러보기</Link>
            <div className="pt-2 flex flex-col gap-2 border-t border-gray-100 mt-2">
              <Link to="/admin/login" className="h-10 flex items-center justify-center text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">운영자 로그인</Link>
              <Link to="/explore" className="h-10 flex items-center justify-center text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-500 transition-colors">부스 둘러보기</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

const FEATURES = [
  {
    icon: MessageSquare,
    title: '실시간 문의 인박스',
    desc: '관람객 문의를 놓치지 않고, 태그와 메모로 체계적으로 관리하세요',
  },
  {
    icon: Users,
    title: '리드 자동 수집',
    desc: '명함 스캔, 설문, 이메일 신청을 통해 리드가 자동으로 쌓입니다',
  },
  {
    icon: ClipboardList,
    title: '1분 설문',
    desc: '관람객의 관심사와 방문 목적을 빠르게 파악하세요',
  },
  {
    icon: BarChart3,
    title: '운영 통계 대시보드',
    desc: '방문 수, 문의량, 리드 소스를 실시간으로 확인하고 리포트를 내보내세요',
  },
];

const STEPS_OPERATOR = [
  { num: '01', icon: Zap, title: '부스 등록', desc: '3분이면 부스 페이지 완성. AI가 내용을 자동 생성합니다.' },
  { num: '02', icon: QrCode, title: 'QR 공유', desc: 'QR 코드를 현장에 배치하면 관람객이 바로 접속합니다.' },
  { num: '03', icon: BarChart3, title: '리드 & 통계 확인', desc: '문의, 리드, 설문 응답을 대시보드에서 실시간 확인.' },
];

const STEPS_VISITOR = [
  { num: '01', icon: ScanLine, title: 'QR 스캔', desc: '부스 앞에서 QR을 스캔하면 부스 정보를 바로 확인.' },
  { num: '02', icon: MessageSquare, title: '문의 & 저장', desc: '관심 있는 부스에 바로 문의하고 관심 목록에 저장.' },
  { num: '03', icon: FileDown, title: '자료 받기', desc: '이메일로 카탈로그와 제품 자료를 편리하게 받아보세요.' },
];

const STATS = [
  { value: '120+', label: '등록 부스' },
  { value: '2,400+', label: '누적 방문' },
  { value: '890+', label: '수집 리드' },
  { value: '96%', label: '응답률' },
];

const TESTIMONIALS = [
  {
    quote: '이전에는 명함을 엑셀에 옮기느라 이벤트 후 일주일이 걸렸는데, BoothLiner로 현장에서 바로 정리됩니다.',
    name: '박서영',
    role: '마케팅 매니저, TechStart',
  },
  {
    quote: 'QR 스캔 하나로 부스 정보를 다 볼 수 있어서 관람이 훨씬 편했어요. 문의 답변도 빨리 와서 좋았습니다.',
    name: '김현우',
    role: '바이어, GreenCorp',
  },
];

export default function LandingPage() {
  const { booths } = useBooths();
  const previewBooths = booths.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ═══ Hero ═══ */}
      <section className="pt-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20">
          <div className="lg:flex lg:items-center lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1 rounded-full mb-5">
                <Zap className="w-3 h-3" /> B2B 이벤트 부스 운영 플랫폼
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
                이벤트 부스 운영,<br />
                <span className="text-brand-600">더 스마트하게</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-500 leading-relaxed max-w-lg mx-auto lg:mx-0">
                리드 수집부터 실시간 문의, 설문, 통계까지.<br className="hidden sm:block" />
                현장 부스 운영에 필요한 모든 것을 한 곳에서.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <Link
                  to="/admin/login"
                  className="w-full sm:w-auto h-11 px-6 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-500 transition-all duration-150 inline-flex items-center justify-center gap-2"
                >
                  부스 운영 시작하기 <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/explore"
                  className="w-full sm:w-auto h-11 px-6 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all duration-150 inline-flex items-center justify-center gap-2"
                >
                  부스 둘러보기
                </Link>
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="flex-1 mt-12 lg:mt-0 max-w-lg mx-auto lg:max-w-none">
              <div className="bg-gray-950 rounded-2xl p-1.5 shadow-2xl">
                <div className="bg-gray-900 rounded-xl overflow-hidden">
                  {/* Fake title bar */}
                  <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.06]">
                    <span className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                    <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                    <span className="ml-3 text-[10px] text-gray-500">BoothLiner Dashboard</span>
                  </div>
                  <div className="p-4 sm:p-5">
                    {/* Fake stats */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                      {[
                        { label: '오늘 방문', val: '284', trend: '+12%' },
                        { label: '신규 리드', val: '37', trend: '+8%' },
                        { label: '미처리 문의', val: '5', trend: '' },
                      ].map((s) => (
                        <div key={s.label} className="bg-white/[0.06] rounded-lg p-3">
                          <p className="text-[10px] text-gray-400">{s.label}</p>
                          <p className="text-lg font-bold text-white mt-0.5">{s.val}</p>
                          {s.trend && <p className="text-[10px] text-emerald-400">{s.trend}</p>}
                        </div>
                      ))}
                    </div>
                    {/* Fake chart bars */}
                    <div className="bg-white/[0.04] rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 mb-2">시간대별 방문</p>
                      <div className="flex items-end gap-1 h-16">
                        {[20, 35, 55, 80, 95, 70, 85, 60, 40, 25, 15, 10].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-brand-500/80 rounded-sm"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section id="features" className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">현장에서 바로 쓰는 기능</h2>
            <p className="mt-3 text-sm sm:text-base text-gray-500">복잡한 설정 없이, 등록 즉시 사용할 수 있습니다</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white border border-gray-200/60 rounded-xl p-6 hover:border-gray-300 hover:shadow-card-hover transition-all duration-200">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-brand-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section id="how-it-works" className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">이렇게 사용하세요</h2>
            <p className="mt-3 text-sm sm:text-base text-gray-500">운영자와 관람객 모두 간단한 3단계로 시작합니다</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Operator flow */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1 rounded-md">운영자</span>
                <span className="text-sm text-gray-500">부스 운영 시작하기</span>
              </div>
              <div className="space-y-5">
                {STEPS_OPERATOR.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.num} className="flex gap-4">
                      <div className="shrink-0 w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white text-xs font-bold">
                        {step.num}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <h4 className="text-sm font-semibold text-gray-900">{step.title}</h4>
                        </div>
                        <p className="mt-1 text-[13px] text-gray-500 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visitor flow */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-brand-600 text-white text-xs font-medium px-2.5 py-1 rounded-md">관람객</span>
                <span className="text-sm text-gray-500">부스 탐색하기</span>
              </div>
              <div className="space-y-5">
                {STEPS_VISITOR.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.num} className="flex gap-4">
                      <div className="shrink-0 w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white text-xs font-bold">
                        {step.num}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <h4 className="text-sm font-semibold text-gray-900">{step.title}</h4>
                        </div>
                        <p className="mt-1 text-[13px] text-gray-500 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Stats ═══ */}
      <section className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-14">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-sm text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-6">
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Event Booths Preview ═══ */}
      <section className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">부스를 둘러보세요</h2>
              <p className="mt-2 text-sm text-gray-500">지금 진행 중인 이벤트의 부스를 미리 확인하세요</p>
            </div>
            <Link
              to="/explore"
              className="text-[13px] font-medium text-brand-600 hover:text-brand-700 transition-colors inline-flex items-center gap-1 shrink-0"
            >
              전체 부스 보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {previewBooths.map((booth) => (
              <Link
                key={booth.id}
                to={`/scan/${booth.id}`}
                className="group bg-white border border-gray-200/60 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-card-hover transition-all duration-200"
              >
                {booth.images.length > 0 ? (
                  <img
                    src={booth.images[0]}
                    alt={booth.name}
                    className="w-full aspect-[16/10] object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80';
                    }}
                  />
                ) : (
                  <div className="w-full aspect-[16/10] bg-gray-100 flex items-center justify-center">
                    <span className="text-4xl opacity-40">🏪</span>
                  </div>
                )}
                <div className="p-4">
                  <span className="text-xs text-gray-500">{booth.category}</span>
                  <h3 className="text-sm font-semibold text-gray-900 mt-0.5 group-hover:text-brand-600 transition-colors">
                    {booth.name}
                  </h3>
                  <p className="text-[13px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{booth.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">지금 바로 시작하세요</h2>
          <p className="mt-3 text-sm sm:text-base text-gray-500 max-w-md mx-auto">
            부스 운영이든 관람이든, 30초면 시작할 수 있습니다
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Link
              to="/admin/login"
              className="w-full sm:w-auto h-11 px-8 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all duration-150 inline-flex items-center justify-center gap-2"
            >
              운영자로 시작 <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/explore"
              className="w-full sm:w-auto h-11 px-8 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all duration-150 inline-flex items-center justify-center gap-2"
            >
              관람객으로 입장
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center">
                  <QrCode className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-white">BoothLiner</span>
              </div>
              <p className="text-xs text-gray-500 max-w-xs">이벤트 부스 운영을 위한 올인원 B2B 플랫폼. 리드 수집, 문의 관리, 통계를 한 곳에서.</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link to="/explore" className="text-xs text-gray-400 hover:text-gray-200 transition-colors">부스 둘러보기</Link>
              <Link to="/admin/login" className="text-xs text-gray-400 hover:text-gray-200 transition-colors">운영자 로그인</Link>
              <Link to="/auth" className="text-xs text-gray-400 hover:text-gray-200 transition-colors">관람객 로그인</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-gray-600">&copy; 2026 BoothLiner. All rights reserved.</p>
            <p className="text-xs text-gray-600">Demo Project</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
