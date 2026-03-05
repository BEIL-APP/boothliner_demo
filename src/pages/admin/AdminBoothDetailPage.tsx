import { useRef, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Download, Eye, Heart, MessageSquare, ExternalLink, FileDown,
  Upload, Trash2, Calendar, ToggleLeft, ToggleRight, Paperclip,
  ClipboardList, Users, Link2, Plus, X, Instagram, ShoppingBag, Globe,
  Edit3, ImagePlus, HelpCircle, Settings2,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { AdminLayout } from '../../components/AdminLayout';
import { useBooth } from '../../hooks/useBooths';
import { useBoothAnalytics } from '../../hooks/useAnalytics';
import { useThreads } from '../../hooks/useThreads';
import { useToast } from '../../contexts/ToastContext';
import { exportBoothThreadsCSV, exportAnalyticsCSV } from '../../utils/csv';
import {
  getAnalytics,
  getBoothPolicy,
  saveBoothPolicy,
  getBoothAttachments,
  saveAttachment,
  deleteAttachment,
  getSurveyAggregate,
  saveBooth,
  getBoothParticipations,
  getEvents,
  saveEvent,
  saveParticipation,
  deleteParticipation,
  getBoothAnalyticsByEvent,
} from '../../utils/localStorage';
import type { BoothPolicy, Attachment, BoothEvent, BoothEventParticipation } from '../../types';

export default function AdminBoothDetailPage() {
  const { boothId } = useParams<{ boothId: string }>();
  const { booth } = useBooth(boothId ?? '');
  const { data: stats, refresh: refreshStats } = useBoothAnalytics(boothId ?? '');
  const { threads } = useThreads();
  const { showToast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const boothUrl = `${window.location.origin}/scan/${boothId}`;

  // Policy state
  const [policy, setPolicy] = useState<BoothPolicy>(() =>
    getBoothPolicy(boothId ?? '') ?? {
      boothId: boothId ?? '',
      startAt: new Date().toISOString().slice(0, 16),
      endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      allowViewAfterEnd: true,
      allowInquiryAfterEnd: false,
    }
  );
  const [policySaved, setPolicySaved] = useState(false);

  // Links state (A-5)
  const [links, setLinks] = useState({
    instagram: booth?.links.instagram ?? '',
    store: booth?.links.store ?? '',
    site: booth?.links.site ?? '',
  });
  const [customLinks, setCustomLinks] = useState<Array<{ label: string; url: string }>>(
    () => booth?.customLinks ?? []
  );
  const [linksSaved, setLinksSaved] = useState(false);
  const [newCustomLabel, setNewCustomLabel] = useState('');
  const [newCustomUrl, setNewCustomUrl] = useState('');

  // Booth content edit state (B-2)
  const [editName, setEditName] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editFaq, setEditFaq] = useState<Array<{ question: string; answer: string }>>([]);
  // editNextEvents removed — managed via participation editing
  const [contentSaved, setContentSaved] = useState(false);

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Survey aggregate
  const surveyAgg = boothId ? getSurveyAggregate(boothId) : { total: 0, interests: {}, purposes: {}, wantsContact: 0 };
  const topInterests = Object.entries(surveyAgg.interests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const topPurposes = Object.entries(surveyAgg.purposes)
    .sort((a, b) => b[1] - a[1]);
  const maxInterest = topInterests[0]?.[1] ?? 1;

  const [surveyFields, setSurveyFields] = useState<Array<{ id: string; label: string; type: 'text' | 'select' | 'checkbox'; options?: string[]; required: boolean }>>(() => {
    try {
      const raw = localStorage.getItem(`bep_survey_fields_${boothId}`);
      return raw ? JSON.parse(raw) : [
        { id: 'interests', label: '관심 분야', type: 'checkbox', options: ['구매검토', '파트너십', 'B2B 납품', '정보수집'], required: false },
        { id: 'purpose', label: '방문 목적', type: 'select', options: ['구매/계약 검토', '제품 정보 수집', '파트너십/협력', '견적 요청'], required: false },
      ];
    } catch { return []; }
  });
  const [surveyFieldsSaved, setSurveyFieldsSaved] = useState(false);

  // Event filter for analytics
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [boothParticipations, setBoothParticipations] = useState<BoothEventParticipation[]>([]);
  const [allEvents, setAllEvents] = useState<BoothEvent[]>([]);

  // Event participation editing
  const [editParticipations, setEditParticipations] = useState<Array<{
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
  }>>([]);
  const [participationsSaved, setParticipationsSaved] = useState(false);

  useEffect(() => {
    if (boothId) {
      setAttachments(getBoothAttachments(boothId));
      const parts = getBoothParticipations(boothId);
      setBoothParticipations(parts);
      setAllEvents(getEvents());
      setEditParticipations(parts.map((p) => {
        return {
          id: p.id,
          mode: 'existing' as const,
          eventId: p.eventId,
          newEventName: '',
          newEventStartDate: '',
          newEventEndDate: '',
          newEventLocation: '',
          startAt: p.startAt,
          endAt: p.endAt,
          boothLocation: p.boothLocation ?? '',
        };
      }));
    }
  }, [boothId]);

  useEffect(() => {
    if (booth) {
      setLinks({
        instagram: booth.links.instagram ?? '',
        store: booth.links.store ?? '',
        site: booth.links.site ?? '',
      });
      setCustomLinks(booth.customLinks ?? []);
      setEditName(booth.name);
      setEditTagline(booth.tagline);
      setEditCategory(booth.category);
      setEditDescription(booth.description);
      setEditImages([...booth.images]);
      setEditFaq(booth.faq.map((f) => ({ ...f })));
    }
  }, [booth?.id]);

  const handleSaveLinks = () => {
    if (!booth) return;
    const updated = {
      ...booth,
      links: {
        instagram: links.instagram || undefined,
        store: links.store || undefined,
        site: links.site || undefined,
      },
      customLinks: customLinks.filter((l) => l.label && l.url),
    };
    saveBooth(updated);
    setLinksSaved(true);
    setTimeout(() => setLinksSaved(false), 2000);
    showToast('링크가 저장됐어요!', 'success');
  };

  const handleAddCustomLink = () => {
    if (!newCustomLabel.trim() || !newCustomUrl.trim()) return;
    setCustomLinks((prev) => [...prev, { label: newCustomLabel.trim(), url: newCustomUrl.trim() }]);
    setNewCustomLabel('');
    setNewCustomUrl('');
  };

  const handleRemoveCustomLink = (i: number) => {
    setCustomLinks((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSaveContent = () => {
    if (!booth) return;
    const updated = {
      ...booth,
      name: editName.trim() || booth.name,
      tagline: editTagline.trim(),
      category: editCategory.trim() || booth.category,
      description: editDescription.trim(),
      images: editImages.filter((img) => img.trim()),
      faq: editFaq.filter((f) => f.question.trim()),
    };
    saveBooth(updated);
    setContentSaved(true);
    setTimeout(() => setContentSaved(false), 2000);
    showToast('부스 정보가 저장됐어요!', 'success');
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('booth-qr-canvas') as HTMLCanvasElement;
    if (!canvas) {
      showToast('QR 다운로드에 실패했어요', 'error');
      return;
    }
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${booth?.name ?? boothId}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('QR 코드가 다운로드됐어요!', 'success');
  };

  const handleExportCSV = () => {
    const all = getAnalytics();
    const filtered = selectedEventId
      ? all.filter((a) => a.boothId === boothId && a.eventId === selectedEventId)
      : all.filter((a) => a.boothId === boothId);
    exportAnalyticsCSV(filtered);
    showToast('CSV 파일이 다운로드됐어요!', 'success');
  };

  const handleExportThreadsCSV = () => {
    exportBoothThreadsCSV(boothId ?? '', threads);
    showToast('문의 데이터가 다운로드됐어요!', 'success');
  };

  const handleSavePolicy = () => {
    const updated = { ...policy, boothId: boothId ?? '' };
    saveBoothPolicy(updated);
    setPolicy(updated);
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 2000);
    showToast('운영 정책이 저장됐어요!', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !boothId) return;

    const sizeKB = file.size / 1024;
    const sizeStr = sizeKB > 1024
      ? `${(sizeKB / 1024).toFixed(1)} MB`
      : `${Math.round(sizeKB)} KB`;

    const att: Attachment = {
      id: `att-${Date.now()}`,
      boothId,
      filename: file.name,
      type: file.type,
      size: sizeStr,
      createdAt: new Date().toISOString(),
    };
    saveAttachment(att);
    setAttachments(getBoothAttachments(boothId));
    showToast(`${file.name} 업로드 완료!`, 'success');
    e.target.value = '';
  };

  const handleDeleteAttachment = (id: string) => {
    deleteAttachment(id);
    setAttachments(boothId ? getBoothAttachments(boothId) : []);
    showToast('파일을 삭제했어요', 'info');
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['xlsx', 'xls', 'csv'].includes(ext ?? '')) return '📊';
    if (['pptx', 'ppt'].includes(ext ?? '')) return '📋';
    return '📎';
  };

  if (!booth) {
    return (
      <AdminLayout>
        <div className="px-4 py-5 sm:p-6 lg:p-8 text-center">
          <p className="text-gray-500">부스를 찾을 수 없어요</p>
          <Link to="/admin/booths" className="text-brand-600 text-sm mt-2 inline-block">
            ← 목록으로
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const displayStats = selectedEventId && boothId
    ? getBoothAnalyticsByEvent(boothId, selectedEventId)
    : stats;

  const statCards = [
    {
      label: '총 스캔',
      value: displayStats.scans,
      icon: <Eye className="w-5 h-5" />,
      desc: 'QR 스캔 횟수',
    },
    {
      label: '관심 저장',
      value: displayStats.favorites,
      icon: <Heart className="w-5 h-5" />,
      desc: '하트 누른 관람객',
    },
    {
      label: '문의 건수',
      value: displayStats.inquiries,
      icon: <MessageSquare className="w-5 h-5" />,
      desc: '접수된 문의',
    },
  ];

  const isPolicyExpired = new Date(policy.endAt) < new Date();
  const isPolicyActive = new Date(policy.startAt) <= new Date() && !isPolicyExpired;

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:p-6 lg:p-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 lg:mb-8">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link to="/admin/booths" className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-150 shrink-0">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">{booth.name}</h1>
                <span className="h-6 px-2 rounded-md text-xs font-medium inline-flex items-center bg-gray-100 text-gray-600">
                  {booth.category}
                </span>
                {isPolicyExpired && (
                  <span className="h-6 px-2 rounded-md text-xs font-medium inline-flex items-center bg-gray-100 text-gray-600">
                    운영 종료
                  </span>
                )}
                {isPolicyActive && (
                  <span className="h-6 px-2 rounded-md text-xs font-medium inline-flex items-center bg-emerald-50 text-emerald-700">
                    운영중
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5 truncate">{booth.tagline}</p>
            </div>
          </div>
          <Link
            to={`/scan/${boothId}`}
            target="_blank"
            className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-9 px-4 text-[13px] font-medium rounded-lg transition-all duration-150 w-full sm:w-auto shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            관람객 보기
          </Link>
        </div>

        {/* Two column: QR + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-4 sm:mb-6">
          {/* QR Code Card */}
          <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">QR 코드</h2>
              <button
                onClick={handleDownloadQR}
                className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-8 px-3 text-xs font-medium rounded-lg transition-all duration-150"
              >
                <Download className="w-3.5 h-3.5" />
                PNG 다운로드
              </button>
            </div>

            <div ref={qrRef} className="flex justify-center mb-4">
              <div className="p-3 sm:p-4 bg-white border border-gray-200/60 rounded-xl inline-block">
                <QRCodeCanvas
                  id="booth-qr-canvas"
                  value={boothUrl}
                  size={160}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">스캔 URL</p>
              <p className="text-xs font-mono text-gray-600 bg-gray-50 rounded-lg px-3 py-2 break-all">
                {boothUrl}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">통계</h2>
              <button
                onClick={() => { refreshStats(); showToast('통계를 새로고침했어요', 'info'); }}
                className="text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 px-2 py-1 rounded-md transition-all duration-150"
              >
                새로고침
              </button>
            </div>
            {boothParticipations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4 pb-3 border-b border-gray-100">
                <button
                  onClick={() => setSelectedEventId(null)}
                  className={`text-xs px-3 h-7 rounded-full font-medium transition-all ${
                    !selectedEventId ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
                {boothParticipations.map((p) => {
                  const ev = allEvents.find((e) => e.id === p.eventId);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedEventId(p.eventId)}
                      className={`text-xs px-3 h-7 rounded-full font-medium transition-all truncate max-w-[180px] ${
                        selectedEventId === p.eventId ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={ev?.name}
                    >
                      {ev?.name ?? p.eventId}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="divide-y divide-gray-100">
              {statCards.map((s) => (
                <div key={s.label} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                    {s.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{s.desc}</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">{s.value.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── 운영 기간 설정 ─── */}
        <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">운영 기간 설정</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">운영 시작</label>
              <input
                type="datetime-local"
                value={policy.startAt}
                onChange={(e) => setPolicy((p) => ({ ...p, startAt: e.target.value }))}
                className="w-full h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">운영 종료</label>
              <input
                type="datetime-local"
                value={policy.endAt}
                onChange={(e) => setPolicy((p) => ({ ...p, endAt: e.target.value }))}
                className="w-full h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
              />
            </div>
          </div>

          <p className="text-xs font-medium text-gray-600 mb-3">종료 후 정책</p>
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 sm:p-3.5 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">부스 열람 유지</p>
                <p className="text-xs text-gray-400">종료 후에도 부스 페이지에 접근 가능</p>
              </div>
              <button
                onClick={() => setPolicy((p) => ({ ...p, allowViewAfterEnd: !p.allowViewAfterEnd }))}
                className={`transition-all duration-150 shrink-0 ml-3 ${policy.allowViewAfterEnd ? 'text-brand-600' : 'text-gray-300'}`}
              >
                {policy.allowViewAfterEnd
                  ? <ToggleRight className="w-8 h-8" />
                  : <ToggleLeft className="w-8 h-8" />
                }
              </button>
            </div>
            <div className="flex items-center justify-between p-3 sm:p-3.5 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">문의 허용</p>
                <p className="text-xs text-gray-400">종료 후에도 관람객 문의 가능</p>
              </div>
              <button
                onClick={() => setPolicy((p) => ({ ...p, allowInquiryAfterEnd: !p.allowInquiryAfterEnd }))}
                className={`transition-all duration-150 shrink-0 ml-3 ${policy.allowInquiryAfterEnd ? 'text-brand-600' : 'text-gray-300'}`}
              >
                {policy.allowInquiryAfterEnd
                  ? <ToggleRight className="w-8 h-8" />
                  : <ToggleLeft className="w-8 h-8" />
                }
              </button>
            </div>
          </div>

          <button
            onClick={handleSavePolicy}
            className={`w-full sm:w-auto sm:px-6 h-10 text-sm font-medium rounded-lg flex items-center justify-center transition-all duration-150 ${
              policySaved
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-500'
            }`}
          >
            {policySaved ? '저장됐어요 ✓' : '정책 저장'}
          </button>
        </div>

        {/* ─── 링크 관리 (A-5) ─── */}
        <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">외부 링크 관리</h2>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                <Instagram className="w-4 h-4 text-gray-500" />
              </div>
              <input
                type="url"
                value={links.instagram}
                onChange={(e) => setLinks((l) => ({ ...l, instagram: e.target.value }))}
                placeholder="https://instagram.com/..."
                className="flex-1 h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-gray-500" />
              </div>
              <input
                type="url"
                value={links.store}
                onChange={(e) => setLinks((l) => ({ ...l, store: e.target.value }))}
                placeholder="https://스토어 URL..."
                className="flex-1 h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-gray-500" />
              </div>
              <input
                type="url"
                value={links.site}
                onChange={(e) => setLinks((l) => ({ ...l, site: e.target.value }))}
                placeholder="https://홈페이지 URL..."
                className="flex-1 h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Custom links */}
          <p className="text-xs font-medium text-gray-600 mb-2">추가 링크</p>
          <div className="space-y-2 mb-3">
            {customLinks.map((cl, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{cl.label}</p>
                  <p className="text-xs text-gray-400 truncate">{cl.url}</p>
                </div>
                <button
                  onClick={() => handleRemoveCustomLink(i)}
                  className="p-1 text-gray-300 hover:text-red-400 rounded-md hover:bg-red-50 transition-all duration-150 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={newCustomLabel}
                onChange={(e) => setNewCustomLabel(e.target.value)}
                placeholder="링크 이름 (예: 카탈로그)"
                className="flex-1 h-9 text-xs bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
              />
              <input
                type="url"
                value={newCustomUrl}
                onChange={(e) => setNewCustomUrl(e.target.value)}
                placeholder="https://..."
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomLink(); }}
                className="flex-1 h-9 text-xs bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
              />
              <button
                onClick={handleAddCustomLink}
                disabled={!newCustomLabel.trim() || !newCustomUrl.trim()}
                className="p-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-all duration-150 disabled:opacity-40 self-end sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveLinks}
            className={`w-full sm:w-auto sm:px-6 h-10 text-sm font-medium rounded-lg flex items-center justify-center transition-all duration-150 ${
              linksSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-500'
            }`}
          >
            {linksSaved ? '저장됐어요 ✓' : '링크 저장'}
          </button>
        </div>

        {/* ─── 파일 첨부 (브로셔) ─── */}
        <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">브로셔 & 첨부 파일</h2>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-8 px-3 text-xs font-medium rounded-lg transition-all duration-150"
            >
              <Upload className="w-3.5 h-3.5" />
              파일 추가
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.pptx,.xlsx,.xls,.doc,.docx,.png,.jpg"
            onChange={handleFileUpload}
            className="hidden"
          />

          {attachments.length === 0 ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border border-dashed border-gray-300 rounded-xl p-6 sm:p-8 flex flex-col items-center gap-2 hover:border-gray-400 hover:bg-gray-50 transition-all duration-150 group"
            >
              <Upload className="w-6 h-6 text-gray-300 group-hover:text-gray-500 transition-colors" />
              <p className="text-sm text-gray-400 group-hover:text-gray-600 transition-colors">
                클릭하여 파일 업로드
              </p>
              <p className="text-xs text-gray-300">PDF, PPTX, XLSX, 이미지 지원</p>
            </button>
          ) : (
            <div className="space-y-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3"
                >
                  <span className="text-base">{getFileIcon(att.filename)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{att.filename}</p>
                    <p className="text-xs text-gray-400">
                      {att.size} · {new Date(att.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="p-1.5 text-gray-300 hover:text-red-400 rounded-md hover:bg-red-50 transition-all duration-150"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full text-center text-xs text-gray-500 py-2 hover:text-gray-700 transition-all duration-150"
              >
                + 파일 추가
              </button>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3">
            데모: 파일 메타데이터만 저장됩니다. 관람객 페이지에서 다운로드 버튼이 표시됩니다.
          </p>
        </div>

        {/* ─── 정보 수집 폼 관리 (B-12) ─── */}
        <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">설문 폼 관리</h2>
            </div>
            <span className="text-xs text-gray-400">{surveyFields.length}개 항목</span>
          </div>

          <p className="text-xs text-gray-500 mb-4">관람객이 부스 페이지에서 작성하는 설문 항목을 편집하세요.</p>

          <div className="space-y-3 mb-4">
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
                      next[i] = { ...next[i], type: e.target.value as 'text' | 'select' | 'checkbox' };
                      setSurveyFields(next);
                    }}
                    className="h-8 text-xs bg-white border border-gray-200 rounded-lg px-2 outline-none focus:ring-2 focus:ring-brand-200 text-gray-600"
                  >
                    <option value="text">텍스트</option>
                    <option value="select">선택</option>
                    <option value="checkbox">체크박스</option>
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
                {(field.type === 'select' || field.type === 'checkbox') && field.options && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1.5">옵션 (쉼표로 구분)</p>
                    <input
                      type="text"
                      value={field.options.join(', ')}
                      onChange={(e) => {
                        const next = [...surveyFields];
                        next[i] = { ...next[i], options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) };
                        setSurveyFields(next);
                      }}
                      className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                      placeholder="옵션1, 옵션2, 옵션3"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setSurveyFields((prev) => [...prev, { id: `field-${Date.now()}`, label: '새 항목', type: 'text', required: false }])}
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium transition-all duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              항목 추가
            </button>
            <button
              onClick={() => {
                localStorage.setItem(`bep_survey_fields_${boothId}`, JSON.stringify(surveyFields));
                setSurveyFieldsSaved(true);
                setTimeout(() => setSurveyFieldsSaved(false), 2000);
                showToast('설문 항목이 저장됐어요!', 'success');
              }}
              className={`sm:ml-auto h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150 ${
                surveyFieldsSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-600 text-white hover:bg-brand-500'
              }`}
            >
              {surveyFieldsSaved ? '저장됐어요 ✓' : '설문 저장'}
            </button>
          </div>
        </div>

        {/* ─── 설문 집계 결과 ─── */}
        <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">설문 집계 결과</h2>
              <span className="h-6 px-2 rounded-md text-xs font-medium inline-flex items-center bg-gray-100 text-gray-600">
                총 {surveyAgg.total}건
              </span>
            </div>
            <Link
              to={`/admin/booths/${boothId}/team`}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-8 px-3 text-xs font-medium rounded-lg transition-all duration-150"
            >
              <Users className="w-3.5 h-3.5" />
              팀 관리
            </Link>
          </div>

          {surveyAgg.total === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">아직 설문 응답이 없어요</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Interests bar chart */}
              {topInterests.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-3">관심 분야</p>
                  <div className="space-y-2">
                    {topInterests.map(([tag, count]) => (
                      <div key={tag}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-700">{tag}</span>
                          <span className="text-xs font-medium text-gray-500">{count}명</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-brand-400 rounded-lg transition-all"
                            style={{ width: `${(count / maxInterest) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Purpose + wantsContact */}
              <div>
                {topPurposes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-3">방문 목적</p>
                    <div className="space-y-1.5">
                      {topPurposes.map(([purpose, count]) => (
                        <div key={purpose} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">{purpose}</span>
                          <span className="font-medium text-gray-600 bg-gray-100 rounded-md px-2 py-0.5">
                            {count}건
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 sm:p-4">
                  <p className="text-xs text-gray-500 mb-0.5">연락 희망 응답</p>
                  <p className="text-xl sm:text-2xl font-semibold text-emerald-700">
                    {surveyAgg.wantsContact}명
                    <span className="text-sm font-normal text-emerald-600 ml-1">
                      ({surveyAgg.total > 0 ? Math.round((surveyAgg.wantsContact / surveyAgg.total) * 100) : 0}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export */}
        <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">데이터 내보내기</h2>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-9 px-4 text-[13px] font-medium rounded-lg transition-all duration-150 w-full sm:w-auto"
            >
              <FileDown className="w-4 h-4 text-gray-500" />
              통계 CSV Export
            </button>
            <button
              onClick={handleExportThreadsCSV}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-9 px-4 text-[13px] font-medium rounded-lg transition-all duration-150 w-full sm:w-auto"
            >
              <FileDown className="w-4 h-4 text-gray-500" />
              문의 CSV Export
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            UTF-8 BOM 형식으로 내보내져 Excel에서 바로 열 수 있어요.
          </p>
        </div>

        {/* ─── 부스 정보 편집 (B-2) ─── */}
        <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Edit3 className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">부스 정보 편집</h2>
          </div>

          {/* Basic info */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">부스명</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">카테고리</label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">태그라인</label>
              <input
                type="text"
                value={editTagline}
                onChange={(e) => setEditTagline(e.target.value)}
                placeholder="한 줄 소개"
                className="w-full h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">소개 문구</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                placeholder="부스 상세 설명"
                className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all resize-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Images */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <ImagePlus className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-xs font-medium text-gray-600">이미지 URL</p>
            </div>
            <div className="space-y-2 mb-2">
              {editImages.map((img, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={img}
                    onChange={(e) => setEditImages((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                    placeholder="https://..."
                    className="flex-1 h-9 text-xs bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                  />
                  {img && (
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                  <button
                    onClick={() => setEditImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-1.5 text-gray-300 hover:text-red-400 rounded-md hover:bg-red-50 transition-all duration-150 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditImages((prev) => [...prev, ''])}
              className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-all duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              이미지 추가
            </button>
          </div>

          {/* FAQ */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-xs font-medium text-gray-600">FAQ</p>
            </div>
            <div className="space-y-3 mb-2">
              {editFaq.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-2.5 sm:p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => setEditFaq((prev) => prev.map((f, idx) => idx === i ? { ...f, question: e.target.value } : f))}
                      placeholder="질문"
                      className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all font-medium"
                    />
                    <button
                      onClick={() => setEditFaq((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1.5 text-gray-300 hover:text-red-400 rounded-md hover:bg-red-50 transition-all duration-150 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={item.answer}
                    onChange={(e) => setEditFaq((prev) => prev.map((f, idx) => idx === i ? { ...f, answer: e.target.value } : f))}
                    placeholder="답변"
                    rows={2}
                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all resize-none"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditFaq((prev) => [...prev, { question: '', answer: '' }])}
              className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-all duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              항목 추가
            </button>
          </div>

          <button
            onClick={handleSaveContent}
            className={`w-full sm:w-auto sm:px-6 h-10 text-sm font-medium rounded-lg flex items-center justify-center transition-all duration-150 ${
              contentSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-500'
            }`}
          >
            {contentSaved ? '저장됐어요 ✓' : '부스 정보 저장'}
          </button>
        </div>

        {/* ─── 행사 참여 관리 ─── */}
        <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">행사 참여 관리</h2>
            </div>
            {editParticipations.length < 5 && (
              <button
                onClick={() => setEditParticipations((prev) => [...prev, {
                  id: `ep-new-${Date.now()}`,
                  mode: 'existing',
                  eventId: '',
                  newEventName: '',
                  newEventStartDate: '',
                  newEventEndDate: '',
                  newEventLocation: '',
                  startAt: '',
                  endAt: '',
                  boothLocation: '',
                }])}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-500 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> 행사 추가
              </button>
            )}
          </div>
          <div className="space-y-3">
            {editParticipations.map((p, idx) => {
              return (
                <div key={p.id} className="bg-gray-50 border border-gray-200/60 rounded-lg p-3 sm:p-4 relative">
                  {editParticipations.length > 0 && (
                    <button
                      onClick={() => setEditParticipations((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <p className="text-xs font-medium text-gray-500 mb-3">행사 {idx + 1}</p>

                  <div className="mb-3">
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => { const next = [...editParticipations]; next[idx] = { ...next[idx], mode: 'existing' }; setEditParticipations(next); }}
                        className={`text-xs px-3 h-7 rounded-md font-medium transition-all ${p.mode === 'existing' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        기존 행사
                      </button>
                      <button
                        onClick={() => { const next = [...editParticipations]; next[idx] = { ...next[idx], mode: 'new', eventId: '' }; setEditParticipations(next); }}
                        className={`text-xs px-3 h-7 rounded-md font-medium transition-all ${p.mode === 'new' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        새 행사
                      </button>
                    </div>
                    {p.mode === 'existing' ? (
                      <select
                        value={p.eventId}
                        onChange={(e) => {
                          const next = [...editParticipations];
                          const selEv = allEvents.find((ev) => ev.id === e.target.value);
                          next[idx] = {
                            ...next[idx],
                            eventId: e.target.value,
                            startAt: next[idx].startAt || selEv?.startDate || '',
                            endAt: next[idx].endAt || selEv?.endDate || '',
                          };
                          setEditParticipations(next);
                        }}
                        className="w-full h-9 text-xs bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                      >
                        <option value="">행사 선택</option>
                        {allEvents.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.name} ({ev.startDate} ~ {ev.endDate})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={p.newEventName}
                          onChange={(e) => { const next = [...editParticipations]; next[idx] = { ...next[idx], newEventName: e.target.value }; setEditParticipations(next); }}
                          placeholder="행사명"
                          className="w-full h-9 text-xs bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input type="date" value={p.newEventStartDate} onChange={(e) => { const next = [...editParticipations]; next[idx] = { ...next[idx], newEventStartDate: e.target.value, startAt: next[idx].startAt || e.target.value }; setEditParticipations(next); }} className="h-9 text-xs bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all" />
                          <input type="date" value={p.newEventEndDate} onChange={(e) => { const next = [...editParticipations]; next[idx] = { ...next[idx], newEventEndDate: e.target.value, endAt: next[idx].endAt || e.target.value }; setEditParticipations(next); }} className="h-9 text-xs bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all" />
                        </div>
                        <input
                          type="text"
                          value={p.newEventLocation}
                          onChange={(e) => { const next = [...editParticipations]; next[idx] = { ...next[idx], newEventLocation: e.target.value }; setEditParticipations(next); }}
                          placeholder="행사 장소"
                          className="w-full h-9 text-xs bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200/60">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">참여 시작</label>
                      <input type="date" value={p.startAt} onChange={(e) => { const next = [...editParticipations]; next[idx] = { ...next[idx], startAt: e.target.value }; setEditParticipations(next); }} className="w-full h-9 text-xs bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">참여 종료</label>
                      <input type="date" value={p.endAt} onChange={(e) => { const next = [...editParticipations]; next[idx] = { ...next[idx], endAt: e.target.value }; setEditParticipations(next); }} className="w-full h-9 text-xs bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">부스 위치</label>
                      <input type="text" value={p.boothLocation} onChange={(e) => { const next = [...editParticipations]; next[idx] = { ...next[idx], boothLocation: e.target.value }; setEditParticipations(next); }} placeholder="예: A-12" className="w-full h-9 text-xs bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all" />
                    </div>
                  </div>
                </div>
              );
            })}
            {editParticipations.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">참여 중인 행사가 없어요.</p>
            )}
          </div>
          <button
            onClick={() => {
              if (!booth || !boothId) return;
              const oldPartIds = boothParticipations.map((p) => p.id);
              const newPartIds = editParticipations.map((p) => p.id);
              for (const oldId of oldPartIds) {
                if (!newPartIds.includes(oldId)) {
                  deleteParticipation(oldId);
                }
              }
              const nextEventsArr: Array<{ title: string; date: string; location: string }> = [];
              for (const p of editParticipations) {
                if (p.mode === 'new' && p.newEventName.trim()) {
                  const newEv: BoothEvent = {
                    id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    name: p.newEventName.trim(),
                    startDate: p.newEventStartDate,
                    endDate: p.newEventEndDate,
                    location: p.newEventLocation.trim(),
                    createdAt: new Date().toISOString(),
                  };
                  saveEvent(newEv);
                  saveParticipation({
                    id: p.id.startsWith('ep-new-') ? `bp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : p.id,
                    boothId,
                    eventId: newEv.id,
                    boothLocation: p.boothLocation || undefined,
                    startAt: p.startAt,
                    endAt: p.endAt,
                  });
                  nextEventsArr.push({
                    title: newEv.name,
                    date: newEv.startDate === newEv.endDate ? newEv.startDate : `${newEv.startDate} ~ ${newEv.endDate}`,
                    location: p.boothLocation || newEv.location,
                  });
                } else if (p.mode === 'existing' && p.eventId) {
                  saveParticipation({
                    id: p.id.startsWith('ep-new-') ? `bp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : p.id,
                    boothId,
                    eventId: p.eventId,
                    boothLocation: p.boothLocation || undefined,
                    startAt: p.startAt,
                    endAt: p.endAt,
                  });
                  const ev = allEvents.find((e) => e.id === p.eventId);
                  if (ev) {
                    nextEventsArr.push({
                      title: ev.name,
                      date: ev.startDate === ev.endDate ? ev.startDate : `${ev.startDate} ~ ${ev.endDate}`,
                      location: p.boothLocation || ev.location,
                    });
                  }
                }
              }
              saveBooth({ ...booth, nextEvents: nextEventsArr });
              const updatedParts = getBoothParticipations(boothId);
              setBoothParticipations(updatedParts);
              setAllEvents(getEvents());
              setParticipationsSaved(true);
              setTimeout(() => setParticipationsSaved(false), 2000);
              showToast('행사 참여 정보가 저장됐어요!', 'success');
            }}
            className={`mt-4 w-full sm:w-auto sm:px-6 h-10 text-sm font-medium rounded-lg flex items-center justify-center transition-all duration-150 ${
              participationsSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-500'
            }`}
          >
            {participationsSaved ? '저장됐어요 ✓' : '행사 참여 저장'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
