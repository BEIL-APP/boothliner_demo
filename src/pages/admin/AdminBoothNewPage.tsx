import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save, Sparkles, Upload, Loader2 } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useBooths } from '../../hooks/useBooths';
import { useToast } from '../../contexts/ToastContext';
import type { Booth } from '../../types';

const MOCK_AI_EXTRACTIONS = [
  {
    name: 'GreenLeaf Co.',
    category: '친환경 오피스',
    tagline: '지속가능한 오피스 환경을 만드는 파트너',
    description: 'FSC 인증 소재와 재활용 원단으로 제작한 사무용 가구 및 소모품 전문 기업입니다. ESG 경영을 실천하는 기업을 위한 탄소 중립 오피스 솔루션을 제공합니다.',
    faq: [
      { question: '납기는 얼마나 걸리나요?', answer: '일반 재고 품목은 3~5영업일, 커스텀 주문은 2~3주 소요됩니다.' },
      { question: 'ESG 인증서 발급이 가능한가요?', answer: '구매 제품에 대한 탄소 절감량 리포트와 ESG 기여 증명서를 발급합니다.' },
    ],
  },
  {
    name: 'TechBridge Solutions',
    category: 'IT & SaaS',
    tagline: '중소기업을 위한 스마트 디지털 전환',
    description: 'ERP, CRM, HR 솔루션을 한 플랫폼에서 통합 관리. 평균 도입 후 업무 효율 35% 향상. 30일 무료 트라이얼 및 전담 온보딩 지원.',
    faq: [
      { question: '기존 시스템과 연동이 가능한가요?', answer: '100여 개의 외부 서비스와 API 연동을 지원합니다.' },
      { question: '데이터 보안 정책은?', answer: 'ISO 27001 인증 획득, 데이터는 국내 IDC에 암호화 저장됩니다.' },
    ],
  },
  {
    name: 'Craft & Co.',
    category: '핸드크래프트',
    tagline: '정성이 담긴 수공예 기업 선물',
    description: '국내 장인이 직접 제작하는 프리미엄 수공예 기업 선물 브랜드. 가죽 소품, 도자기, 천연 비누 등 다양한 카테고리에서 로고 각인 서비스 제공.',
    faq: [
      { question: '최소 주문 수량은?', answer: '일반 각인 제품은 20개 이상, 단독 디자인 협업은 50개 이상.' },
      { question: '샘플 제작이 가능한가요?', answer: '원가로 샘플 1개를 제작해드립니다. 대량 주문 시 샘플 비용은 차감됩니다.' },
    ],
  },
];

const CATEGORIES = [
  '음료 & 식품', '인쇄 & 굿즈', '친환경 오피스', 'IT & SaaS',
  '핸드크래프트', '웰니스 & 복지', '마케팅', '패션 & 라이프스타일', '기타',
];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
}

function TextInput({
  value, onChange, placeholder, className = '',
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400 ${className}`}
    />
  );
}

export default function AdminBoothNewPage() {
  const navigate = useNavigate();
  const { addBooth } = useBooths();
  const { showToast } = useToast();

  // AI auto-fill state
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiFileName, setAiFileName] = useState('');

  const handleAiExtract = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiFileName(file.name);
    setAiExtracting(true);
    // Mock 2s AI extraction
    setTimeout(() => {
      const extracted = MOCK_AI_EXTRACTIONS[Math.floor(Math.random() * MOCK_AI_EXTRACTIONS.length)];
      setName(extracted.name);
      setCategory(extracted.category);
      setTagline(extracted.tagline);
      setDescription(extracted.description);
      setFaq([
        ...extracted.faq,
        { question: '', answer: '' },
      ]);
      setAiExtracting(false);
      showToast('AI가 자료에서 정보를 추출했어요! 내용을 확인하고 수정해주세요.', 'success');
    }, 2000);
    e.target.value = '';
  };

  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState(['', '']);
  const [instagram, setInstagram] = useState('');
  const [store, setStore] = useState('');
  const [site, setSite] = useState('');
  const [faq, setFaq] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' },
  ]);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      showToast('부스 이름을 입력해주세요', 'error');
      return;
    }
    if (!tagline.trim()) {
      showToast('한 줄 소개를 입력해주세요', 'error');
      return;
    }

    const booth: Booth = {
      id: `booth-${Date.now()}`,
      name: name.trim(),
      category,
      tagline: tagline.trim(),
      description: description.trim(),
      images: images.filter((img) => img.trim()),
      links: {
        instagram: instagram.trim() || undefined,
        store: store.trim() || undefined,
        site: site.trim() || undefined,
      },
      faq: faq.filter((f) => f.question.trim() && f.answer.trim()),
      nextEvents: eventTitle.trim()
        ? [{ title: eventTitle.trim(), date: eventDate, location: eventLocation.trim() }]
        : [],
      createdAt: new Date().toISOString(),
    };

    addBooth(booth);
    showToast('부스가 생성됐어요!', 'success');
    navigate(`/admin/booths/${booth.id}`);
  };

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:p-6 lg:p-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 lg:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-150"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">새 부스 만들기</h1>
            <p className="text-sm text-gray-500 mt-0.5">부스 정보를 입력하고 QR을 발급받으세요</p>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* AI Auto-fill */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">AI 부스 자동 생성</h2>
              <span className="inline-flex items-center h-5 px-2 text-xs font-medium text-gray-600 bg-gray-200/70 rounded-md ml-auto">베타</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              회사 소개서(PDF)나 브로셔 파일을 업로드하면 AI가 부스 정보를 자동으로 채워드려요.
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept=".pdf,.pptx,.docx,.txt"
                onChange={handleAiExtract}
                className="hidden"
                disabled={aiExtracting}
              />
              <span className={`inline-flex items-center gap-2 text-[13px] font-medium rounded-lg px-4 h-9 transition-all duration-150 ${
                aiExtracting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
              }`}>
                {aiExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    파일 업로드하여 자동 채우기
                  </>
                )}
              </span>
              {aiFileName && !aiExtracting && (
                <span className="text-xs text-gray-500 truncate max-w-[160px]">{aiFileName}</span>
              )}
            </label>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">기본 정보</h2>
            <div className="space-y-4">
              <div>
                <FieldLabel required>부스 이름</FieldLabel>
                <TextInput value={name} onChange={setName} placeholder="예: TeaCo" />
              </div>
              <div>
                <FieldLabel required>카테고리</FieldLabel>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel required>한 줄 소개 (tagline)</FieldLabel>
                <TextInput
                  value={tagline}
                  onChange={setTagline}
                  placeholder="예: 한 잔에 담긴 일상의 여유"
                />
              </div>
              <div>
                <FieldLabel>상세 소개</FieldLabel>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="부스를 찾아온 관람객에게 소개할 내용을 작성해주세요."
                  rows={4}
                  className="w-full min-h-[80px] text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-3 resize-none outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">이미지 URL</h2>
            <div className="space-y-3">
              {images.map((img, i) => (
                <div key={i} className="flex items-center gap-2">
                  <TextInput
                    value={img}
                    onChange={(v) => {
                      const next = [...images];
                      next[i] = v;
                      setImages(next);
                    }}
                    placeholder={`이미지 ${i + 1} URL (예: https://...)`}
                  />
                  {images.length > 1 && (
                    <button
                      onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                      className="p-2 text-gray-400 hover:text-red-500 transition-all duration-150"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {images.length < 4 && (
                <button
                  onClick={() => setImages([...images, ''])}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-all duration-150"
                >
                  <Plus className="w-3.5 h-3.5" /> 이미지 추가
                </button>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">링크</h2>
            <div className="space-y-3">
              <div>
                <FieldLabel>인스타그램</FieldLabel>
                <TextInput value={instagram} onChange={setInstagram} placeholder="https://instagram.com/..." />
              </div>
              <div>
                <FieldLabel>스토어</FieldLabel>
                <TextInput value={store} onChange={setStore} placeholder="https://..." />
              </div>
              <div>
                <FieldLabel>홈페이지</FieldLabel>
                <TextInput value={site} onChange={setSite} placeholder="https://..." />
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">자주 묻는 질문 (최대 3개)</h2>
            <div className="space-y-4">
              {faq.map((item, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200/60 rounded-lg p-3 sm:p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Q{i + 1}</p>
                  <TextInput
                    value={item.question}
                    onChange={(v) => {
                      const next = [...faq];
                      next[i] = { ...next[i], question: v };
                      setFaq(next);
                    }}
                    placeholder="질문을 입력하세요"
                    className="mb-2"
                  />
                  <textarea
                    value={item.answer}
                    onChange={(e) => {
                      const next = [...faq];
                      next[i] = { ...next[i], answer: e.target.value };
                      setFaq(next);
                    }}
                    placeholder="답변을 입력하세요"
                    rows={2}
                    className="w-full min-h-[60px] text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Current Event */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-6">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-900">이번 행사 정보</h2>
              <p className="text-xs text-gray-400 mt-1">현재 참가 중인 행사의 일정과 부스 위치를 입력하세요</p>
            </div>
            <div className="space-y-3">
              <div>
                <FieldLabel>행사명</FieldLabel>
                <TextInput value={eventTitle} onChange={setEventTitle} placeholder="예: 2026 서울 B2B 박람회" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>날짜</FieldLabel>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                  />
                </div>
                <div>
                  <FieldLabel>부스 위치</FieldLabel>
                  <TextInput value={eventLocation} onChange={setEventLocation} placeholder="예: Hall A, B-12" />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pb-4">
            <button
              onClick={() => navigate(-1)}
              className="h-9 px-4 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-150 w-full sm:w-auto"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-2 h-9 px-4 text-[13px] font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-500 transition-all duration-150 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              부스 생성 & QR 발급
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
