import { useRef, useState, useEffect } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import {
  ArrowLeft, Download, ExternalLink,
  Upload, Trash2, Calendar, ToggleLeft, ToggleRight, Paperclip,
  Link2, Plus, Instagram, ShoppingBag, Globe,
  Edit3, ImagePlus, HelpCircle, Settings2, Gift,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { AdminLayout } from '../../components/AdminLayout';
import { AdminBoothStatsTab } from '../../components/admin/AdminBoothStatsTab';
import { AdminBoothTeamTab } from '../../components/admin/AdminBoothTeamTab';
import { AdminBoothSurveyDetail } from '../../components/admin/AdminBoothSurveyDetail';
import { useBooth } from '../../hooks/useBooths';
import { useToast } from '../../contexts/ToastContext';
import {
  getBoothPolicy,
  saveBoothPolicy,
  getBoothAttachments,
  saveAttachment,
  deleteAttachment,
  saveBooth,
  getBoothParticipations,
  getEvents,
  saveEvent,
  saveParticipation,
  deleteParticipation,
  deleteBooth,
} from '../../utils/localStorage';
import type { BoothPolicy, Attachment, BoothEvent, BoothEventParticipation } from '../../types';

export default function AdminBoothDetailPage() {
  const { boothId, '*': boothSection } = useParams<{ boothId: string; '*': string }>();
  const navigate = useNavigate();
  const { booth } = useBooth(boothId ?? '');
  const { showToast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const activeTab = boothSection === 'setting' || boothSection === 'stats' || boothSection === 'team' || boothSection === 'surveys'
    ? boothSection
    : null;

  if (!boothSection) {
    return <Navigate to={`/admin/booths/${boothId}/stats`} replace />;
  }

  if (!activeTab) {
    return <Navigate to={`/admin/booths/${boothId}/stats`} replace />;
  }

  const handleDeleteBooth = () => {
    if (!booth) return;
    if (!window.confirm(`'${booth.name}' 부스를 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다.`)) return;
    deleteBooth(booth.id);
    showToast('부스가 삭제됐어요.', 'success');
    navigate('/admin/booths');
  };

  const boothUrl = `${window.location.origin}/scan/${boothId}?ref=qr`;

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
  const [editDescImages, setEditDescImages] = useState<string[]>([]);
  const [editFaq, setEditFaq] = useState<Array<{ question: string; answer: string }>>([]);
  // editNextEvents removed — managed via participation editing
  const [basicInfoSaved, setBasicInfoSaved] = useState(false);
  const [imagesSaved, setImagesSaved] = useState(false);
  const [faqSaved, setFaqSaved] = useState(false);

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [surveyFields, setSurveyFields] = useState<Array<{ id: string; label: string; type: 'text' | 'select' | 'checkbox'; options?: string[]; required: boolean }>>(() => {
    try {
      const raw = localStorage.getItem(`bep_survey_fields_${boothId}`);
      return raw ? JSON.parse(raw) : [
        { id: 'interests', label: '관심 분야', type: 'checkbox', options: ['구매검토', '파트너십', 'B2B 납품', '정보수집'], required: false },
        { id: 'purpose', label: '방문 목적', type: 'select', options: ['구매/계약 검토', '제품 정보 수집', '파트너십/협력', '견적 요청'], required: false },
      ];
    } catch { return []; }
  });
  const [surveyIntro, setSurveyIntro] = useState(() => localStorage.getItem(`bep_survey_intro_${boothId}`) ?? '설문에 참여해주시면 부스 운영자가 더 맞는 정보와 후속 안내를 드릴 수 있어요.');
  const [surveyFieldsSaved, setSurveyFieldsSaved] = useState(false);
  const [surveyReward, setSurveyReward] = useState<{ enabled: boolean; name: string; count: number; description: string }>(() => {
    try {
      const raw = localStorage.getItem(`bep_survey_reward_${boothId}`);
      return raw ? JSON.parse(raw) : { enabled: false, name: '', count: 1, description: '' };
    } catch { return { enabled: false, name: '', count: 1, description: '' }; }
  });

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
      setEditDescImages([...(booth.descriptionImages ?? [])]);
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

  const handleSaveBasicInfo = () => {
    if (!booth) return;
    const updated = {
      ...booth,
      name: editName.trim() || booth.name,
      tagline: editTagline.trim(),
      category: editCategory.trim() || booth.category,
      description: editDescription.trim(),
    };
    saveBooth(updated);
    setBasicInfoSaved(true);
    setTimeout(() => setBasicInfoSaved(false), 2000);
    showToast('기본 정보가 저장됐어요!', 'success');
  };

  const handleSaveImages = () => {
    if (!booth) return;
    const updated = {
      ...booth,
      images: editImages.filter((img) => img.trim()),
      descriptionImages: editDescImages.filter((img) => img.trim()),
    };
    saveBooth(updated);
    setImagesSaved(true);
    setTimeout(() => setImagesSaved(false), 2000);
    showToast('이미지가 저장됐어요!', 'success');
  };

  const handleSaveFaq = () => {
    if (!booth) return;
    const updated = {
      ...booth,
      faq: editFaq.filter((f) => f.question.trim()),
    };
    saveBooth(updated);
    setFaqSaved(true);
    setTimeout(() => setFaqSaved(false), 2000);
    showToast('FAQ가 저장됐어요!', 'success');
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

  const handleSavePolicy = () => {
    const now = new Date();
    const activeParticipation = boothParticipations.find((participation) => {
      const start = new Date(`${participation.startAt}T00:00:00`);
      const end = new Date(`${participation.endAt}T23:59:59`);
      return start <= now && now <= end;
    });
    const fallbackParticipation = activeParticipation ?? [...boothParticipations]
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
    const updated = {
      ...policy,
      boothId: boothId ?? '',
      startAt: fallbackParticipation ? `${fallbackParticipation.startAt}T09:00` : policy.startAt,
      endAt: fallbackParticipation ? `${fallbackParticipation.endAt}T18:00` : policy.endAt,
    };
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

  const now = new Date();
  const activeParticipation = boothParticipations.find((participation) => {
    const start = new Date(`${participation.startAt}T00:00:00`);
    const end = new Date(`${participation.endAt}T23:59:59`);
    return start <= now && now <= end;
  });
  const upcomingParticipation = [...boothParticipations]
    .filter((participation) => new Date(`${participation.startAt}T00:00:00`) > now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  const latestEndedParticipation = [...boothParticipations]
    .filter((participation) => new Date(`${participation.endAt}T23:59:59`) < now)
    .sort((a, b) => new Date(b.endAt).getTime() - new Date(a.endAt).getTime())[0];
  const hasEndedParticipation = Boolean(latestEndedParticipation) && !activeParticipation && !upcomingParticipation;

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 lg:mb-8">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link to="/admin/booths" className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-150 shrink-0">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">{booth.name}</h1>
                <span className="h-6 px-2 rounded-md text-xs font-medium inline-flex items-center bg-gray-100 text-gray-600">
                  {booth.category}
                </span>
                {hasEndedParticipation && (
                  <span className="h-6 px-2 rounded-md text-xs font-medium inline-flex items-center bg-gray-100 text-gray-600">
                    운영 종료
                  </span>
                )}
                {activeParticipation && (
                  <span className="h-6 px-2 rounded-md text-xs font-medium inline-flex items-center bg-emerald-50 text-emerald-700">
                    운영 중
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 font-medium truncate">{booth.tagline}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <Link
              to={`/scan/${boothId}`}
              target="_blank"
              className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-9 px-4 text-[13px] font-medium rounded-lg transition-all duration-150 flex-1 sm:flex-initial"
            >
              <ExternalLink className="w-4 h-4" />
              관람객 보기
            </Link>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">QR 코드 관리</h2>
            <button
              onClick={handleDownloadQR}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-9 px-3 text-xs font-medium rounded-lg transition-all duration-150"
            >
              <Download className="w-3.5 h-3.5" />
              PNG 다운로드
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div ref={qrRef} className="shrink-0">
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
            <div className="flex-1 min-w-0 w-full">
              <p className="text-xs text-gray-400 mb-1.5">스캔 URL</p>
              <p className="text-xs font-mono text-gray-600 bg-gray-50 rounded-lg px-3 py-2 break-all">
                {boothUrl}
              </p>
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex border-b border-gray-200 mb-6 gap-1">
          {[
            { label: '통계', to: `/admin/booths/${boothId}/stats` },
            { label: '설정', to: `/admin/booths/${boothId}/setting` },
            { label: '팀', to: `/admin/booths/${boothId}/team` },
          ].map((tab) => {
            const isActive =
              (tab.label === '통계' && (activeTab === 'stats' || activeTab === 'surveys')) ||
              (tab.label === '설정' && activeTab === 'setting') ||
              (tab.label === '팀' && activeTab === 'team');
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {activeTab === 'setting' && (
          <>
        <div className="flex flex-col">
        {/* ─── 행사 종료 후 정책 ─── */}
        <div className="order-3 bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-4 h-4 text-gray-500" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">행사 종료 후 정책 관리</h2>
              <p className="text-xs text-gray-400 mt-0.5">운영 날짜는 행사 참여에서 관리하고, 여기서는 종료 후 동작만 설정합니다</p>
            </div>
          </div>
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
        <div className="order-4 bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">외부 링크 관리</h2>
          </div>

          <div className="space-y-4 mb-4">
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
          <div className="space-y-3 mb-4">
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
                  <Trash2 className="w-3.5 h-3.5" />
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
        <div className="order-5 bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">브로셔 & 첨부 파일 관리</h2>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 h-9 px-3 text-xs font-medium rounded-lg transition-all duration-150"
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
        <div className="order-6 bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">설문 폼 관리</h2>
            </div>
            <span className="text-xs text-gray-400">{surveyFields.length}개 항목</span>
          </div>

          <p className="text-xs text-gray-500 mb-4">관람객이 부스 페이지에서 작성하는 설문 항목을 편집하세요.</p>

          <div className="mb-4">
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">설문 안내 문구</label>
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
                localStorage.setItem(`bep_survey_intro_${boothId}`, surveyIntro.trim() || '설문에 참여해주시면 부스 운영자가 더 맞는 정보와 후속 안내를 드릴 수 있어요.');
                localStorage.setItem(`bep_survey_reward_${boothId}`, JSON.stringify(surveyReward));
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

          {/* 선물 추첨 설정 */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-semibold text-gray-900">선물 추첨</p>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">선택사항</span>
              </div>
              <button
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
        </div>

        {/* ─── 기본 정보 (B-2) ─── */}
        <div className="order-1 bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Edit3 className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">기본 정보 관리</h2>
          </div>

          {/* Basic info */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">부스 이름</label>
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
              <label className="block text-xs font-medium text-gray-600 mb-1.5">한 줄 소개</label>
              <input
                type="text"
                value={editTagline}
                onChange={(e) => setEditTagline(e.target.value)}
                placeholder="한 줄 소개"
                className="w-full h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">상세 소개</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                placeholder="부스를 찾아온 관람객에게 소개할 내용을 작성해주세요."
                className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all resize-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <button
            onClick={handleSaveBasicInfo}
            className={`w-full sm:w-auto sm:px-6 h-10 text-sm font-medium rounded-lg flex items-center justify-center transition-all duration-150 ${
              basicInfoSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-500'
            }`}
          >
            {basicInfoSaved ? '저장됐어요 ✓' : '기본 정보 저장'}
          </button>
        </div>

        <div className="order-1 bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ImagePlus className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">이미지 관리</h2>
          </div>

          {/* Images */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <ImagePlus className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-xs font-medium text-gray-600">대표 이미지 URL</p>
              <span className="text-xs text-gray-400">· 목록 카드 및 상단 슬라이드에 표시됩니다</span>
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
                    <Trash2 className="w-3.5 h-3.5" />
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

          {/* Description Images */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <ImagePlus className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-xs font-medium text-gray-600">소개 이미지 URL</p>
              <span className="text-xs text-gray-400">· 부스 상세 소개란에 표시됩니다</span>
            </div>
            <div className="space-y-2 mb-2">
              {editDescImages.map((img, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={img}
                    onChange={(e) => setEditDescImages((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                    placeholder="https://..."
                    className="flex-1 h-9 text-xs bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                  />
                  {img && (
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                  <button
                    onClick={() => setEditDescImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-1.5 text-gray-300 hover:text-red-400 rounded-md hover:bg-red-50 transition-all duration-150 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditDescImages((prev) => [...prev, ''])}
              className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-all duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              소개 이미지 추가
            </button>
          </div>

          <button
            onClick={handleSaveImages}
            className={`w-full sm:w-auto sm:px-6 h-10 text-sm font-medium rounded-lg flex items-center justify-center transition-all duration-150 ${
              imagesSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-500'
            }`}
          >
            {imagesSaved ? '저장됐어요 ✓' : '이미지 저장'}
          </button>
        </div>

        <div className="order-1 bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">FAQ 관리</h2>
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
                      <Trash2 className="w-3.5 h-3.5" />
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
            onClick={handleSaveFaq}
            className={`w-full sm:w-auto sm:px-6 h-10 text-sm font-medium rounded-lg flex items-center justify-center transition-all duration-150 ${
              faqSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-500'
            }`}
          >
            {faqSaved ? '저장됐어요 ✓' : 'FAQ 저장'}
          </button>
        </div>

        {/* ─── 행사 참여 ─── */}
        <div className="order-2 bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <h2 className="text-sm font-semibold text-gray-900">행사 참여 관리</h2>
                <p className="text-xs text-gray-400 mt-0.5">참여할 행사를 선택하거나 새로 등록하세요</p>
              </div>
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
          <div className="space-y-4">
            {editParticipations.map((p, idx) => {
              return (
                <div key={p.id} className="bg-gray-50 border border-gray-200/60 rounded-lg p-3 sm:p-4 relative">
                  {editParticipations.length > 1 && (
                    <button
                      onClick={() => setEditParticipations((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <p className="text-xs font-medium text-gray-500 mb-4">행사 {idx + 1}</p>

                  <div className="mb-4">
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => { const next = [...editParticipations]; next[idx] = { ...next[idx], mode: 'existing' }; setEditParticipations(next); }}
                        className={`text-xs px-3 h-9 rounded-md font-medium transition-all ${p.mode === 'existing' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        기존 행사 선택
                      </button>
                      <button
                        onClick={() => { const next = [...editParticipations]; next[idx] = { ...next[idx], mode: 'new', eventId: '' }; setEditParticipations(next); }}
                        className={`text-xs px-3 h-9 rounded-md font-medium transition-all ${p.mode === 'new' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        새 행사 등록
                      </button>
                    </div>
                    {p.mode === 'existing' ? (
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">행사 선택</label>
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
                          className="w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                        >
                          <option value="">행사를 선택하세요</option>
                          {allEvents.map((ev) => (
                            <option key={ev.id} value={ev.id}>
                              {ev.name} ({ev.startDate} ~ {ev.endDate}, {ev.location})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={p.newEventName}
                          onChange={(e) => { const next = [...editParticipations]; next[idx] = { ...next[idx], newEventName: e.target.value }; setEditParticipations(next); }}
                          placeholder="예: 2026 부산 IT 박람회"
                          className="w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">행사 시작일</label>
                            <input type="date" value={p.newEventStartDate} onChange={(e) => { const next = [...editParticipations]; next[idx] = { ...next[idx], newEventStartDate: e.target.value, startAt: next[idx].startAt || e.target.value }; setEditParticipations(next); }} className="w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all" />
                          </div>
                          <div>
                            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">행사 종료일</label>
                            <input type="date" value={p.newEventEndDate} onChange={(e) => { const next = [...editParticipations]; next[idx] = { ...next[idx], newEventEndDate: e.target.value, endAt: next[idx].endAt || e.target.value }; setEditParticipations(next); }} className="w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">행사 장소</label>
                          <input
                            type="text"
                            value={p.newEventLocation}
                            onChange={(e) => { const next = [...editParticipations]; next[idx] = { ...next[idx], newEventLocation: e.target.value }; setEditParticipations(next); }}
                            placeholder="예: 벡스코 제1전시장"
                            className="w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200/60">
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">참여 시작일</label>
                      <input type="date" value={p.startAt} onChange={(e) => { const next = [...editParticipations]; next[idx] = { ...next[idx], startAt: e.target.value }; setEditParticipations(next); }} className="w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">참여 종료일</label>
                      <input type="date" value={p.endAt} onChange={(e) => { const next = [...editParticipations]; next[idx] = { ...next[idx], endAt: e.target.value }; setEditParticipations(next); }} className="w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">부스 위치</label>
                      <input type="text" value={p.boothLocation} onChange={(e) => { const next = [...editParticipations]; next[idx] = { ...next[idx], boothLocation: e.target.value }; setEditParticipations(next); }} placeholder="예: Hall A, B-12" className="w-full h-9 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all" />
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

        <div className="order-7 bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-gray-900">부스 삭제 관리</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">부스를 삭제하면 되돌릴 수 없습니다.</p>
          <button
            onClick={handleDeleteBooth}
            className="flex items-center justify-center gap-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 h-9 px-4 text-[13px] font-medium rounded-lg transition-all duration-150 w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4" />
            삭제
          </button>
        </div>
        </div>
          </>
        )}
        {activeTab === 'stats' && boothId && <AdminBoothStatsTab boothId={boothId} />}
        {activeTab === 'team' && boothId && <AdminBoothTeamTab boothId={boothId} />}
        {activeTab === 'surveys' && boothId && <AdminBoothSurveyDetail boothId={boothId} />}
      </div>
    </AdminLayout>
  );
}
