import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Users,
  PhoneCall,
  Search,
  Download,
} from 'lucide-react';
import { getBoothSurveys } from '../../utils/localStorage';
import { exportSurveysCSV } from '../../utils/csv';

type SurveyField = {
  id: string;
  label: string;
  type: 'text' | 'select' | 'checkbox';
  options?: string[];
  required: boolean;
};

const DEFAULT_SURVEY_FIELDS: SurveyField[] = [
  { id: 'interests', label: '관심 분야', type: 'checkbox', options: ['구매검토', '파트너십', 'B2B 납품', '정보수집'], required: false },
  { id: 'purpose', label: '방문 목적', type: 'select', options: ['구매/계약 검토', '제품 정보 수집', '파트너십/협력', '견적 요청'], required: false },
];

function formatDate(iso: string): string {
  const date = new Date(iso);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${d} ${h}:${min}`;
}

function renderAnswerValue(value: string | string[] | boolean | undefined): string {
  if (value === undefined || value === null) return '-';
  if (typeof value === 'boolean') return value ? '예' : '아니오';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

const PER_PAGE = 10;

export function AdminBoothSurveyDetail({ boothId }: { boothId: string }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const surveys = useMemo(() => getBoothSurveys(boothId), [boothId]);

  const surveyFields = useMemo<SurveyField[]>(() => {
    try {
      const raw = localStorage.getItem(`bep_survey_fields_${boothId}`);
      return raw ? JSON.parse(raw) as SurveyField[] : DEFAULT_SURVEY_FIELDS;
    } catch {
      return DEFAULT_SURVEY_FIELDS;
    }
  }, [boothId]);

  // Collect all unique answer keys from surveys for display
  const allFieldIds = useMemo(() => {
    const knownIds = new Set(surveyFields.map((f) => f.id));
    const extraIds = new Set<string>();
    for (const s of surveys) {
      for (const key of Object.keys(s.answers)) {
        if (!knownIds.has(key) && key !== 'wantsContact') extraIds.add(key);
      }
    }
    return [...surveyFields.map((f) => f.id), ...Array.from(extraIds)];
  }, [surveys, surveyFields]);

  const getFieldLabel = (id: string) => surveyFields.find((f) => f.id === id)?.label ?? id;

  const filtered = useMemo(() => {
    if (!search) return surveys;
    const q = search.toLowerCase();
    return surveys.filter((s) =>
      s.visitorId.toLowerCase().includes(q) ||
      Object.values(s.answers).some((v) => renderAnswerValue(v).toLowerCase().includes(q))
    );
  }, [surveys, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  // Summary stats
  const wantsContactCount = surveys.filter((s) => s.answers.wantsContact).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/admin/booths/${boothId}/stats`}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">설문 응답 상세</h1>
            <p className="text-xs text-gray-400 mt-0.5">총 {surveys.length}건의 응답</p>
          </div>
        </div>
        {surveys.length > 0 && (
          <button
            onClick={() => exportSurveysCSV(boothId, surveys, surveyFields)}
            className="flex items-center gap-1.5 h-9 px-3 sm:px-4 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV 내보내기</span>
            <span className="sm:hidden">CSV</span>
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200/60 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-4 h-4 text-gray-400" />
            <p className="text-[11px] font-bold text-gray-400 uppercase">총 응답</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{surveys.length}</p>
        </div>
        <div className="bg-white border border-gray-200/60 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <p className="text-[11px] font-bold text-gray-400 uppercase">연락 희망</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {wantsContactCount}
            <span className="text-sm font-medium text-gray-400 ml-1">
              ({surveys.length > 0 ? Math.round((wantsContactCount / surveys.length) * 100) : 0}%)
            </span>
          </p>
        </div>
        <div className="bg-white border border-gray-200/60 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-400" />
            <p className="text-[11px] font-bold text-gray-400 uppercase">설문 항목</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{surveyFields.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="응답 내용 또는 방문자 ID로 검색..."
          className="w-full h-11 bg-white border border-gray-200 rounded-xl pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all placeholder:text-gray-400 shadow-sm"
        />
      </div>

      {/* Response list */}
      <div className="space-y-3">
        {paginated.length === 0 ? (
          <div className="bg-white border border-gray-200/60 rounded-xl py-16 text-center shadow-sm">
            <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">
              {search ? '검색 결과가 없습니다' : '설문 응답이 없습니다'}
            </p>
          </div>
        ) : (
          paginated.map((survey, idx) => {
            const isExpanded = expandedId === survey.id;
            const globalIndex = page * PER_PAGE + idx + 1;
            return (
              <div
                key={survey.id}
                className="bg-white border border-gray-200/60 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Collapsed header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : survey.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {globalIndex}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        응답 #{globalIndex}
                      </p>
                      {survey.answers.wantsContact && (
                        <span className="shrink-0 h-5 px-1.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600">연락 희망</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(survey.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Preview of first answer */}
                    <span className="hidden sm:inline text-xs text-gray-400 truncate max-w-[200px]">
                      {(() => {
                        const firstKey = allFieldIds[0];
                        if (!firstKey) return '';
                        const val = survey.answers[firstKey];
                        return val ? `${getFieldLabel(firstKey)}: ${renderAnswerValue(val)}` : '';
                      })()}
                    </span>
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-300" />
                    }
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {allFieldIds.map((fieldId) => {
                        const value = survey.answers[fieldId];
                        if (value === undefined || value === null) return null;
                        return (
                          <div key={fieldId} className="bg-gray-50 rounded-xl p-3.5">
                            <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">{getFieldLabel(fieldId)}</p>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                              {renderAnswerValue(value)}
                            </p>
                          </div>
                        );
                      })}
                      <div className="bg-gray-50 rounded-xl p-3.5">
                        <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">연락 희망</p>
                        <p className="text-sm text-gray-700">{survey.answers.wantsContact ? '예' : '아니오'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3.5">
                        <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">개인정보 동의</p>
                        <p className="text-sm text-gray-700">{survey.consent ? '동의' : '미동의'}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-400">
                      <span>방문자: {survey.visitorId.slice(0, 12)}…</span>
                      <span>응답일: {formatDate(survey.createdAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="h-9 px-3 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            이전
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-9 h-9 text-xs font-bold rounded-lg transition-all ${
                  i === page
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="h-9 px-3 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
