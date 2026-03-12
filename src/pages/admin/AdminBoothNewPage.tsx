import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save, Sparkles, Upload, Loader2, Layout, Calendar, Settings2, Gift, ToggleLeft, ToggleRight } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useBooths } from '../../hooks/useBooths';
import { useToast } from '../../contexts/ToastContext';
import { getEvents, saveEvent, saveParticipation } from '../../utils/localStorage';
import type { Booth, BoothEvent } from '../../types';

interface EventParticipationForm {
  id: string;
  mode: 'existing' | 'new';
  eventId: string;
  newEventName: string;
  newEventStartDate: string;
  newEventEndDate: string;
  newEventLocation: string;
  startAt: string;
  endAt: string;
  boothLocation: string;
}

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

const BOOTH_TEMPLATES = [
  { id: 'minimal', name: '미니멀', desc: '깔끔한 텍스트 중심 레이아웃', color: 'bg-gray-100 border-gray-200', accent: 'text-gray-600' },
  { id: 'visual', name: '비주얼', desc: '이미지와 갤러리 강조 레이아웃', color: 'bg-brand-50 border-brand-200', accent: 'text-brand-600' },
  { id: 'corporate', name: '기업형', desc: 'FAQ/자료 다운로드 중심 레이아웃', color: 'bg-emerald-50 border-emerald-200', accent: 'text-emerald-600' },
  { id: 'event', name: '이벤트', desc: '프로모션/이벤트 중심 레이아웃', color: 'bg-amber-50 border-amber-200', accent: 'text-amber-600' },
];

const DEFAULT_SURVEY_FIELDS = [
  { id: 'interests', label: '관심 분야', type: 'checkbox' as const, options: ['구매검토', '파트너십', 'B2B 납품', '정보수집'], required: false },
  { id: 'purpose', label: '방문 목적', type: 'select' as const, options: ['구매/계약 검토', '제품 정보 수집', '파트너십/협력', '견적 요청'], required: false },
];
const DEFAULT_SURVEY_INTRO = '설문에 참여해주시면 부스 운영자가 더 맞는 정보와 후속 안내를 드릴 수 있어요.';

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
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

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
  const [descriptionImages, setDescriptionImages] = useState<string[]>(['']);
  const [instagram, setInstagram] = useState('');
  const [store, setStore] = useState('');
  const [site, setSite] = useState('');
  const [faq, setFaq] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' },
  ]);
  const [surveyFields, setSurveyFields] = useState<Array<{ id: string; label: string; type: 'text' | 'select' | 'checkbox'; options?: string[]; required: boolean }>>(DEFAULT_SURVEY_FIELDS);
  const [surveyIntro, setSurveyIntro] = useState(DEFAULT_SURVEY_INTRO);
  const [surveyReward, setSurveyReward] = useState<{ enabled: boolean; name: string; count: number; description: string }>({ enabled: false, name: '', count: 1, description: '' });
  const [existingEvents] = useState<BoothEvent[]>(() => getEvents());
  const [participations, setParticipations] = useState<EventParticipationForm[]>([
    { id: `ep-${Date.now()}`, mode: 'existing', eventId: '', newEventName: '', newEventStartDate: '', newEventEndDate: '', newEventLocation: '', startAt: '', endAt: '', boothLocation: '' },
  ]);

  const handleSave = () => {
    if (!name.trim()) {
      showToast('부스 이름을 입력해주세요', 'error');
      return;
    }
    if (!tagline.trim()) {
      showToast('한 줄 소개를 입력해주세요', 'error');
      return;
    }

    const boothId = `booth-${Date.now()}`;

    const validParticipations = participations.filter((p) => {
      if (p.mode === 'existing') return p.eventId && p.startAt && p.endAt;
      return p.newEventName.trim() && p.newEventStartDate && p.newEventEndDate && p.startAt && p.endAt;
    });

    const resolvedEvents: Array<{ eventId: string; name: string; startDate: string; endDate: string; location: string; startAt: string; endAt: string; boothLocation: string }> = [];
    for (const p of validParticipations) {
      if (p.mode === 'new') {
        const newEvent: BoothEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: p.newEventName.trim(),
          startDate: p.newEventStartDate,
          endDate: p.newEventEndDate,
          location: p.newEventLocation.trim(),
          createdAt: new Date().toISOString(),
        };
        saveEvent(newEvent);
        resolvedEvents.push({ eventId: newEvent.id, name: newEvent.name, startDate: newEvent.startDate, endDate: newEvent.endDate, location: newEvent.location, startAt: p.startAt, endAt: p.endAt, boothLocation: p.boothLocation });
      } else {
        const ev = existingEvents.find((e) => e.id === p.eventId);
        if (ev) {
          resolvedEvents.push({ eventId: ev.id, name: ev.name, startDate: ev.startDate, endDate: ev.endDate, location: ev.location, startAt: p.startAt, endAt: p.endAt, boothLocation: p.boothLocation });
        }
      }
    }

    for (const re of resolvedEvents) {
      saveParticipation({
        id: `bp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        boothId,
        eventId: re.eventId,
        boothLocation: re.boothLocation || undefined,
        startAt: re.startAt,
        endAt: re.endAt,
      });
    }

    const nextEvents = resolvedEvents.map((re) => ({
      title: re.name,
      date: re.startDate === re.endDate ? re.startDate : `${re.startDate} ~ ${re.endDate}`,
      location: re.boothLocation || re.location,
    }));

    const booth: Booth = {
      id: boothId,
      name: name.trim(),
      category,
      tagline: tagline.trim(),
      description: description.trim(),
      images: images.filter((img) => img.trim()),
      descriptionImages: descriptionImages.filter((img) => img.trim()),
      links: {
        instagram: instagram.trim() || undefined,
        store: store.trim() || undefined,
        site: site.trim() || undefined,
      },
      faq: faq.filter((f) => f.question.trim() && f.answer.trim()),
      nextEvents,
      createdAt: new Date().toISOString(),
    };

    addBooth(booth);
    localStorage.setItem(`bep_survey_fields_${boothId}`, JSON.stringify(surveyFields));
    localStorage.setItem(`bep_survey_intro_${boothId}`, surveyIntro.trim() || DEFAULT_SURVEY_INTRO);
    localStorage.setItem(`bep_survey_reward_${boothId}`, JSON.stringify(surveyReward));
    showToast('부스가 생성됐어요!', 'success');
    navigate(`/admin/booths/${booth.id}/stats`);
  };

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 lg:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-150"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">새 부스 만들기</h1>
            <p className="text-sm text-gray-500 font-medium">부스 정보를 입력하고 QR을 발급받으세요</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Layout className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">페이지 템플릿</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">부스 페이지의 스타일을 선택하세요. 나중에 변경할 수 있어요.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {BOOTH_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`text-left p-3 rounded-xl border-2 transition-all duration-150 ${
                    selectedTemplate === tpl.id
                      ? `${tpl.color} border-current ring-2 ring-offset-1 ring-gray-300`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-0.5 ${selectedTemplate === tpl.id ? tpl.accent : 'text-gray-900'}`}>
                    {tpl.name}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{tpl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* AI Auto-fill */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
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

          {/* Event Participation */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">행사 참여</h2>
                  <p className="text-xs text-gray-400 mt-0.5">참여할 행사를 선택하거나 새로 등록하세요</p>
                </div>
              </div>
              {participations.length < 5 && (
                <button
                  onClick={() => setParticipations([...participations, { id: `ep-${Date.now()}`, mode: 'existing', eventId: '', newEventName: '', newEventStartDate: '', newEventEndDate: '', newEventLocation: '', startAt: '', endAt: '', boothLocation: '' }])}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-500 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> 행사 추가
                </button>
              )}
            </div>
            <div className="space-y-4">
              {participations.map((p, idx) => (
                <div key={p.id} className="bg-gray-50 border border-gray-200/60 rounded-lg p-3 sm:p-4 relative">
                  {participations.length > 1 && (
                    <button
                      onClick={() => setParticipations(participations.filter((_, i) => i !== idx))}
                      className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <p className="text-xs font-medium text-gray-500 mb-4">행사 {idx + 1}</p>

                  <div className="mb-4">
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => { const next = [...participations]; next[idx] = { ...next[idx], mode: 'existing' }; setParticipations(next); }}
                        className={`text-xs px-3 h-9 rounded-md font-medium transition-all ${p.mode === 'existing' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        기존 행사 선택
                      </button>
                      <button
                        onClick={() => { const next = [...participations]; next[idx] = { ...next[idx], mode: 'new', eventId: '' }; setParticipations(next); }}
                        className={`text-xs px-3 h-9 rounded-md font-medium transition-all ${p.mode === 'new' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        새 행사 등록
                      </button>
                    </div>

                    {p.mode === 'existing' ? (
                      <div>
                        <FieldLabel>행사 선택</FieldLabel>
                        <select
                          value={p.eventId}
                          onChange={(e) => {
                            const next = [...participations];
                            const selectedEvent = existingEvents.find((ev) => ev.id === e.target.value);
                            next[idx] = {
                              ...next[idx],
                              eventId: e.target.value,
                              startAt: next[idx].startAt || selectedEvent?.startDate || '',
                              endAt: next[idx].endAt || selectedEvent?.endDate || '',
                            };
                            setParticipations(next);
                          }}
                          className="w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                        >
                          <option value="">행사를 선택하세요</option>
                          {existingEvents.map((ev) => (
                            <option key={ev.id} value={ev.id}>
                              {ev.name} ({ev.startDate} ~ {ev.endDate}, {ev.location})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <FieldLabel required>행사명</FieldLabel>
                          <TextInput
                            value={p.newEventName}
                            onChange={(v) => { const next = [...participations]; next[idx] = { ...next[idx], newEventName: v }; setParticipations(next); }}
                            placeholder="예: 2026 부산 IT 박람회"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <FieldLabel required>행사 시작일</FieldLabel>
                            <input
                              type="date"
                              value={p.newEventStartDate}
                              onChange={(e) => {
                                const next = [...participations];
                                next[idx] = { ...next[idx], newEventStartDate: e.target.value, startAt: next[idx].startAt || e.target.value };
                                setParticipations(next);
                              }}
                              className="w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                            />
                          </div>
                          <div>
                            <FieldLabel required>행사 종료일</FieldLabel>
                            <input
                              type="date"
                              value={p.newEventEndDate}
                              onChange={(e) => {
                                const next = [...participations];
                                next[idx] = { ...next[idx], newEventEndDate: e.target.value, endAt: next[idx].endAt || e.target.value };
                                setParticipations(next);
                              }}
                              className="w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <FieldLabel>행사 장소</FieldLabel>
                          <TextInput
                            value={p.newEventLocation}
                            onChange={(v) => { const next = [...participations]; next[idx] = { ...next[idx], newEventLocation: v }; setParticipations(next); }}
                            placeholder="예: 벡스코 제1전시장"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200/60">
                    <div>
                      <FieldLabel>참여 시작일</FieldLabel>
                      <input
                        type="date"
                        value={p.startAt}
                        onChange={(e) => { const next = [...participations]; next[idx] = { ...next[idx], startAt: e.target.value }; setParticipations(next); }}
                        className="w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                      />
                    </div>
                    <div>
                      <FieldLabel>참여 종료일</FieldLabel>
                      <input
                        type="date"
                        value={p.endAt}
                        onChange={(e) => { const next = [...participations]; next[idx] = { ...next[idx], endAt: e.target.value }; setParticipations(next); }}
                        className="w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                      />
                    </div>
                    <div>
                      <FieldLabel>부스 위치</FieldLabel>
                      <TextInput
                        value={p.boothLocation}
                        onChange={(v) => { const next = [...participations]; next[idx] = { ...next[idx], boothLocation: v }; setParticipations(next); }}
                        placeholder="예: Hall A, B-12"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">이미지</h2>
            <p className="text-xs text-gray-400 mb-4">외부 이미지 URL을 입력하세요</p>

            <div className="mb-6">
              <p className="text-xs font-medium text-gray-600 mb-2">대표 이미지 <span className="text-gray-400 font-normal">· 목록 카드 및 상단 슬라이드에 표시</span></p>
              <div className="space-y-2">
                {images.map((img, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <TextInput
                      value={img}
                      onChange={(v) => { const next = [...images]; next[i] = v; setImages(next); }}
                      placeholder={`이미지 ${i + 1} URL (예: https://...)`}
                    />
                    {img && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
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

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-600 mb-2">소개 이미지 <span className="text-gray-400 font-normal">· 부스 상세 소개란에 표시</span></p>
              <div className="space-y-2">
                {descriptionImages.map((img, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <TextInput
                      value={img}
                      onChange={(v) => { const next = [...descriptionImages]; next[i] = v; setDescriptionImages(next); }}
                      placeholder={`소개 이미지 ${i + 1} URL (예: https://...)`}
                    />
                    {img && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                    {descriptionImages.length > 1 && (
                      <button
                        onClick={() => setDescriptionImages(descriptionImages.filter((_, idx) => idx !== i))}
                        className="p-2 text-gray-400 hover:text-red-500 transition-all duration-150"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {descriptionImages.length < 6 && (
                  <button
                    onClick={() => setDescriptionImages([...descriptionImages, ''])}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-all duration-150"
                  >
                    <Plus className="w-3.5 h-3.5" /> 소개 이미지 추가
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">링크</h2>
            <div className="space-y-4">
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

          {/* Survey Builder */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">설문 생성</h2>
              </div>
              <span className="text-xs text-gray-400">{surveyFields.length}개 항목</span>
            </div>

            <p className="text-xs text-gray-500 mb-4">관람객이 부스 페이지에서 작성할 설문 항목을 미리 구성하세요.</p>

            <div className="mb-4">
              <FieldLabel>설문 안내 문구</FieldLabel>
              <textarea
                value={surveyIntro}
                onChange={(e) => setSurveyIntro(e.target.value)}
                placeholder="설문 카드 아래에 보여줄 안내 문구를 입력하세요."
                rows={3}
                className="w-full min-h-[72px] text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-3 resize-none outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-4 mb-4">
              {surveyFields.map((field, i) => (
                <div key={field.id} className="bg-gray-50 border border-gray-200/60 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => {
                        const next = [...surveyFields];
                        next[i] = { ...next[i], label: e.target.value };
                        setSurveyFields(next);
                      }}
                      className="flex-1 text-sm font-medium bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => {
                        const next = [...surveyFields];
                        const nextType = e.target.value as 'text' | 'select' | 'checkbox';
                        next[i] = {
                          ...next[i],
                          type: nextType,
                          options: nextType === 'text' ? undefined : next[i].options?.length ? next[i].options : [''],
                        };
                        setSurveyFields(next);
                      }}
                      className="h-9 text-xs bg-white border border-gray-200 rounded-lg px-2 outline-none focus:ring-2 focus:ring-brand-200 text-gray-600"
                    >
                      <option value="text">직접 입력</option>
                      <option value="select">단일 선택</option>
                      <option value="checkbox">다중 선택</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => {
                          const next = [...surveyFields];
                          next[i] = { ...next[i], required: e.target.checked };
                          setSurveyFields(next);
                        }}
                        className="w-3.5 h-3.5 rounded accent-brand-600"
                      />
                      필수
                    </label>
                    <button
                      onClick={() => setSurveyFields((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1 text-gray-300 hover:text-red-400 rounded-md hover:bg-red-50 transition-all duration-150 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {(field.type === 'select' || field.type === 'checkbox') && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-2">선택 옵션</p>
                      <div className="space-y-2">
                        {(field.options ?? []).map((option, optionIndex) => (
                          <div key={`${field.id}-option-${optionIndex}`} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const next = [...surveyFields];
                                const nextOptions = [...(next[i].options ?? [])];
                                nextOptions[optionIndex] = e.target.value;
                                next[i] = { ...next[i], options: nextOptions };
                                setSurveyFields(next);
                              }}
                              className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                              placeholder={`옵션 ${optionIndex + 1}`}
                            />
                            <button
                              onClick={() => {
                                const next = [...surveyFields];
                                const nextOptions = (next[i].options ?? []).filter((_, idx) => idx !== optionIndex);
                                next[i] = { ...next[i], options: nextOptions.length ? nextOptions : [''] };
                                setSurveyFields(next);
                              }}
                              className="p-1.5 text-gray-300 hover:text-red-400 rounded-md hover:bg-red-50 transition-all duration-150"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const next = [...surveyFields];
                            next[i] = { ...next[i], options: [...(next[i].options ?? []), ''] };
                            setSurveyFields(next);
                          }}
                          className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium transition-all duration-150"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          옵션 추가
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setSurveyFields((prev) => [...prev, { id: `field-${Date.now()}`, label: '새 항목', type: 'text', required: false }])}
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium transition-all duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              항목 추가
            </button>
          </div>

          {/* 선물 추첨 설정 */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-semibold text-gray-900">선물 추첨</p>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">선택사항</span>
              </div>
              <button
                type="button"
                onClick={() => setSurveyReward((r) => ({ ...r, enabled: !r.enabled }))}
                className="text-gray-400 hover:text-brand-600 transition-colors"
              >
                {surveyReward.enabled
                  ? <ToggleRight className="w-7 h-7 text-brand-600" />
                  : <ToggleLeft className="w-7 h-7" />
                }
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">설문 완료 시 추첨을 통해 선물을 제공해 참여를 유도할 수 있어요.</p>

            {surveyReward.enabled && (
              <div className="space-y-3 bg-amber-50/50 border border-amber-100 rounded-xl p-4 animate-scale-in">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">상품명 *</label>
                  <input
                    value={surveyReward.name}
                    onChange={(e) => setSurveyReward((r) => ({ ...r, name: e.target.value }))}
                    placeholder="예: 스타벅스 아메리카노 기프티콘"
                    className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">당첨자 수</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={surveyReward.count}
                      onChange={(e) => setSurveyReward((r) => ({ ...r, count: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">설명 (선택)</label>
                    <input
                      value={surveyReward.description}
                      onChange={(e) => setSurveyReward((r) => ({ ...r, description: e.target.value }))}
                      placeholder="추가 안내 사항"
                      className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-300"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-amber-600 font-medium">
                  💡 설문 완료 후 추첨 대상에 자동 등록되며, 통계 탭에서 추첨할 수 있어요.
                </p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pb-4">
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
