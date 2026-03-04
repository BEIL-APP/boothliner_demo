import { useRef, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Download, Eye, Heart, MessageSquare, ExternalLink, FileDown,
  Upload, Trash2, Calendar, ToggleLeft, ToggleRight, Paperclip,
  ClipboardList, Users, Link2, Plus, X, Instagram, ShoppingBag, Globe,
  Edit3, ImagePlus, HelpCircle,
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
} from '../../utils/localStorage';
import type { BoothPolicy, Attachment } from '../../types';

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
  const [editNextEvents, setEditNextEvents] = useState<Array<{ title: string; date: string; location: string }>>([]);
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

  useEffect(() => {
    if (boothId) {
      setAttachments(getBoothAttachments(boothId));
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
      setEditNextEvents(booth.nextEvents.map((e) => ({ ...e })));
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
      nextEvents: editNextEvents.filter((e) => e.title.trim()),
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
    exportAnalyticsCSV(all.filter((a) => a.boothId === boothId));
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
        <div className="p-8 text-center">
          <p className="text-gray-500">부스를 찾을 수 없어요</p>
          <Link to="/admin/booths" className="text-brand-600 text-sm mt-2 inline-block">
            ← 목록으로
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      label: '총 스캔',
      value: stats.scans,
      icon: <Eye className="w-5 h-5" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      desc: 'QR 스캔 횟수',
    },
    {
      label: '관심 저장',
      value: stats.favorites,
      icon: <Heart className="w-5 h-5" />,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      iconBg: 'bg-pink-100',
      desc: '하트 누른 관람객',
    },
    {
      label: '문의 건수',
      value: stats.inquiries,
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
      iconBg: 'bg-brand-100',
      desc: '접수된 문의',
    },
  ];

  const isPolicyExpired = new Date(policy.endAt) < new Date();
  const isPolicyActive = new Date(policy.startAt) <= new Date() && !isPolicyExpired;

  return (
    <AdminLayout>
      <div className="p-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/admin/booths" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{booth.name}</h1>
              <span className="text-xs font-medium text-brand-600 bg-brand-50 rounded-full px-2.5 py-1">
                {booth.category}
              </span>
              {isPolicyExpired && (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                  운영 종료
                </span>
              )}
              {isPolicyActive && (
                <span className="text-xs font-medium text-green-600 bg-green-50 rounded-full px-2.5 py-1">
                  운영중
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{booth.tagline}</p>
          </div>
          <Link
            to={`/scan/${boothId}`}
            target="_blank"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors border border-gray-200 rounded-xl px-3 py-2 hover:border-brand-300"
          >
            <ExternalLink className="w-4 h-4" />
            관람객 보기
          </Link>
        </div>

        {/* Two column: QR + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* QR Code Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-800">QR 코드</h2>
              <button
                onClick={handleDownloadQR}
                className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg px-3 py-1.5 transition-colors font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                PNG 다운로드
              </button>
            </div>

            <div ref={qrRef} className="flex justify-center mb-4">
              <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm inline-block">
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
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-800">통계</h2>
              <button
                onClick={() => { refreshStats(); showToast('통계를 새로고침했어요', 'info'); }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                새로고침
              </button>
            </div>
            <div className="space-y-3">
              {statCards.map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3.5 flex items-center gap-3`}>
                  <div className={`${s.iconBg} rounded-lg p-2 ${s.color}`}>
                    {s.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{s.desc}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
                  </div>
                  <p className="text-xs font-medium text-gray-600">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── 운영 기간 설정 ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-gray-800">운영 기간 설정</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">운영 시작</label>
              <input
                type="datetime-local"
                value={policy.startAt}
                onChange={(e) => setPolicy((p) => ({ ...p, startAt: e.target.value }))}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-300 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">운영 종료</label>
              <input
                type="datetime-local"
                value={policy.endAt}
                onChange={(e) => setPolicy((p) => ({ ...p, endAt: e.target.value }))}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-300 transition-all"
              />
            </div>
          </div>

          <p className="text-xs font-medium text-gray-600 mb-3">종료 후 정책</p>
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">부스 열람 유지</p>
                <p className="text-xs text-gray-400">종료 후에도 부스 페이지에 접근 가능</p>
              </div>
              <button
                onClick={() => setPolicy((p) => ({ ...p, allowViewAfterEnd: !p.allowViewAfterEnd }))}
                className={`transition-colors ${policy.allowViewAfterEnd ? 'text-brand-600' : 'text-gray-300'}`}
              >
                {policy.allowViewAfterEnd
                  ? <ToggleRight className="w-8 h-8" />
                  : <ToggleLeft className="w-8 h-8" />
                }
              </button>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">문의 허용</p>
                <p className="text-xs text-gray-400">종료 후에도 관람객 문의 가능</p>
              </div>
              <button
                onClick={() => setPolicy((p) => ({ ...p, allowInquiryAfterEnd: !p.allowInquiryAfterEnd }))}
                className={`transition-colors ${policy.allowInquiryAfterEnd ? 'text-brand-600' : 'text-gray-300'}`}
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
            className={`w-full text-sm font-medium rounded-xl py-3 transition-all ${
              policySaved
                ? 'bg-green-500 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            {policySaved ? '저장됐어요 ✓' : '정책 저장'}
          </button>
        </div>

        {/* ─── 링크 관리 (A-5) ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Link2 className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-gray-800">외부 링크 관리</h2>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-pink-50 rounded-xl flex items-center justify-center shrink-0">
                <Instagram className="w-4 h-4 text-pink-500" />
              </div>
              <input
                type="url"
                value={links.instagram}
                onChange={(e) => setLinks((l) => ({ ...l, instagram: e.target.value }))}
                placeholder="https://instagram.com/..."
                className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-300 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
              </div>
              <input
                type="url"
                value={links.store}
                onChange={(e) => setLinks((l) => ({ ...l, store: e.target.value }))}
                placeholder="https://스토어 URL..."
                className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-300 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-blue-500" />
              </div>
              <input
                type="url"
                value={links.site}
                onChange={(e) => setLinks((l) => ({ ...l, site: e.target.value }))}
                placeholder="https://홈페이지 URL..."
                className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-300 transition-all"
              />
            </div>
          </div>

          {/* Custom links */}
          <p className="text-xs font-medium text-gray-600 mb-2">추가 링크</p>
          <div className="space-y-2 mb-3">
            {customLinks.map((cl, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{cl.label}</p>
                  <p className="text-xs text-gray-400 truncate">{cl.url}</p>
                </div>
                <button
                  onClick={() => handleRemoveCustomLink(i)}
                  className="p-1 text-gray-300 hover:text-red-400 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCustomLabel}
                onChange={(e) => setNewCustomLabel(e.target.value)}
                placeholder="링크 이름 (예: 카탈로그)"
                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300 transition-all"
              />
              <input
                type="url"
                value={newCustomUrl}
                onChange={(e) => setNewCustomUrl(e.target.value)}
                placeholder="https://..."
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomLink(); }}
                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300 transition-all"
              />
              <button
                onClick={handleAddCustomLink}
                disabled={!newCustomLabel.trim() || !newCustomUrl.trim()}
                className="p-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveLinks}
            className={`w-full text-sm font-medium rounded-xl py-3 transition-all ${
              linksSaved
                ? 'bg-green-500 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            {linksSaved ? '저장됐어요 ✓' : '링크 저장'}
          </button>
        </div>

        {/* ─── 파일 첨부 (브로셔) ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-gray-800">브로셔 & 첨부 파일</h2>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg px-3 py-1.5 transition-colors font-medium"
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
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-brand-300 hover:bg-brand-50 transition-all group"
            >
              <Upload className="w-6 h-6 text-gray-300 group-hover:text-brand-400 transition-colors" />
              <p className="text-sm text-gray-400 group-hover:text-brand-600 transition-colors">
                클릭하여 파일 업로드
              </p>
              <p className="text-xs text-gray-300">PDF, PPTX, XLSX, 이미지 지원</p>
            </button>
          ) : (
            <div className="space-y-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
                >
                  <span className="text-lg">{getFileIcon(att.filename)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{att.filename}</p>
                    <p className="text-xs text-gray-400">
                      {att.size} · {new Date(att.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full text-center text-xs text-brand-600 py-2 hover:text-brand-700 transition-colors"
              >
                + 파일 추가
              </button>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3">
            데모: 파일 메타데이터만 저장됩니다. 관람객 페이지에서 다운로드 버튼이 표시됩니다.
          </p>
        </div>

        {/* ─── 설문 집계 결과 ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-gray-800">설문 집계 결과</h2>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                총 {surveyAgg.total}건
              </span>
            </div>
            <Link
              to={`/admin/booths/${boothId}/team`}
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg px-3 py-1.5 transition-colors font-medium"
            >
              <Users className="w-3.5 h-3.5" />
              팀 관리
            </Link>
          </div>

          {surveyAgg.total === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">아직 설문 응답이 없어요</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-400 rounded-full transition-all"
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
                          <span className="font-medium text-brand-600 bg-brand-50 rounded-full px-2 py-0.5">
                            {count}건
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-green-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-500 mb-0.5">연락 희망 응답</p>
                  <p className="text-xl font-bold text-green-600">
                    {surveyAgg.wantsContact}명
                    <span className="text-sm font-normal text-green-500 ml-1">
                      ({surveyAgg.total > 0 ? Math.round((surveyAgg.wantsContact / surveyAgg.total) * 100) : 0}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">데이터 내보내기</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <FileDown className="w-4 h-4 text-brand-500" />
              통계 CSV Export
            </button>
            <button
              onClick={handleExportThreadsCSV}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <FileDown className="w-4 h-4 text-emerald-500" />
              문의 CSV Export
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            UTF-8 BOM 형식으로 내보내져 Excel에서 바로 열 수 있어요.
          </p>
        </div>

        {/* ─── 부스 정보 편집 (B-2) ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Edit3 className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-gray-800">부스 정보 편집</h2>
          </div>

          {/* Basic info */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">부스명</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-300 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">카테고리</label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-300 transition-all"
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
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-300 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">소개 문구</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                placeholder="부스 상세 설명"
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-300 transition-all resize-none"
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
                    className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300 transition-all"
                  />
                  {img && (
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                  <button
                    onClick={() => setEditImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditImages((prev) => [...prev, ''])}
              className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
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
                <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => setEditFaq((prev) => prev.map((f, idx) => idx === i ? { ...f, question: e.target.value } : f))}
                      placeholder="질문"
                      className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300 transition-all font-medium"
                    />
                    <button
                      onClick={() => setEditFaq((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={item.answer}
                    onChange={(e) => setEditFaq((prev) => prev.map((f, idx) => idx === i ? { ...f, answer: e.target.value } : f))}
                    placeholder="답변"
                    rows={2}
                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300 transition-all resize-none"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditFaq((prev) => [...prev, { question: '', answer: '' }])}
              className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              항목 추가
            </button>
          </div>

          {/* Next Events */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-xs font-medium text-gray-600">다음 이벤트</p>
            </div>
            <div className="space-y-3 mb-2">
              {editNextEvents.map((ev, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={ev.title}
                      onChange={(e) => setEditNextEvents((prev) => prev.map((v, idx) => idx === i ? { ...v, title: e.target.value } : v))}
                      placeholder="이벤트 제목"
                      className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300 transition-all"
                    />
                    <button
                      onClick={() => setEditNextEvents((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={ev.date}
                      onChange={(e) => setEditNextEvents((prev) => prev.map((v, idx) => idx === i ? { ...v, date: e.target.value } : v))}
                      className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300 transition-all"
                    />
                    <input
                      type="text"
                      value={ev.location}
                      onChange={(e) => setEditNextEvents((prev) => prev.map((v, idx) => idx === i ? { ...v, location: e.target.value } : v))}
                      placeholder="장소"
                      className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditNextEvents((prev) => [...prev, { title: '', date: '', location: '' }])}
              className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              이벤트 추가
            </button>
          </div>

          <button
            onClick={handleSaveContent}
            className={`w-full text-sm font-medium rounded-xl py-3 transition-all ${
              contentSaved
                ? 'bg-green-500 text-white'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            {contentSaved ? '저장됐어요 ✓' : '부스 정보 저장'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
