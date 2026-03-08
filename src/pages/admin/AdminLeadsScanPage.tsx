import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Sparkles,
  CheckCircle,
  User,
  Building2,
  Phone,
  Mail,
  FileText,
  ScanLine,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useBooths } from '../../hooks/useBooths';
import { useToast } from '../../contexts/ToastContext';
import { saveLead } from '../../utils/localStorage';
import type { Lead } from '../../types';

interface ExtractedData {
  name: string;
  company: string;
  phone: string;
  email: string;
}

// Mock OCR results per "upload"
const MOCK_EXTRACTIONS: ExtractedData[] = [
  { name: '홍길동', company: '(주)테크파트너스', phone: '010-1234-5678', email: 'gildong@techpartners.co.kr' },
  { name: '이수현', company: 'AI 솔루션즈', phone: '010-9876-5432', email: 'suhyun.lee@aisolutions.kr' },
  { name: '김민서', company: '스타트업랩', phone: '02-555-1234', email: 'minseo@startuplab.io' },
  { name: '박준혁', company: '(주)글로벌비즈', phone: '010-3344-5566', email: 'junhyuk.park@globalbiz.com' },
];

export default function AdminLeadsScanPage() {
  const { booths } = useBooths();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'extract' | 'confirm'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [form, setForm] = useState<ExtractedData>({ name: '', company: '', phone: '', email: '' });
  const [memo, setMemo] = useState('');
  const [selectedBooth, setSelectedBooth] = useState(booths[0]?.id ?? '');
  const [saved, setSaved] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
      setStep('extract');
      setExtracting(true);

      // Simulate OCR delay
      setTimeout(() => {
        const mock = MOCK_EXTRACTIONS[Math.floor(Math.random() * MOCK_EXTRACTIONS.length)];
        setForm(mock);
        setExtracting(false);
      }, 2000);
    };
    reader.readAsDataURL(file);
  };

  const handleFormChange = (key: keyof ExtractedData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!memo.trim()) {
      showToast('메모는 필수입니다', 'error');
      return;
    }
    if (!selectedBooth) {
      showToast('부스를 선택해주세요', 'error');
      return;
    }

    const lead: Lead = {
      id: `lead-${Date.now()}`,
      boothId: selectedBooth,
      source: 'bizcard',
      name: form.name || undefined,
      company: form.company || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      memo: memo.trim(),
      consent: true,
      createdAt: new Date().toISOString(),
    };

    saveLead(lead);
    setSaved(true);
    showToast('리드로 저장됐어요!', 'success');

    setTimeout(() => navigate('/admin/leads'), 1800);
  };

  if (saved) {
    return (
      <AdminLayout>
        <div className="px-4 py-5 sm:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">리드 저장 완료!</h2>
            <p className="text-sm text-gray-500">리드 목록으로 이동합니다…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 py-5 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 lg:mb-8">
          <Link
            to="/admin/leads"
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-150"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">명함 스캔</h1>
            <p className="text-sm text-gray-500 mt-0.5">이미지 업로드 → 정보 추출 → 리드 저장</p>
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
                <span className="text-xs font-medium text-white">1</span>
              </div>
              <h2 className="text-base font-semibold text-gray-900">명함 사진 업로드</h2>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border border-dashed border-gray-300 rounded-xl p-8 sm:p-10 flex flex-col items-center gap-3 sm:gap-4 hover:border-gray-400 hover:bg-gray-50 transition-all duration-150 group"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  클릭하여 명함 이미지 선택
                </p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC 지원</p>
              </div>
            </button>

            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-700">
                <span className="font-semibold">데모 안내:</span> 실제 OCR 대신 무작위 샘플
                데이터를 추출합니다. 업로드 후 내용을 직접 수정할 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Extracting / Edit */}
        {step === 'extract' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Image preview */}
            {imagePreview && (
              <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ScanLine className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-900">업로드된 명함</h2>
                </div>
                <img
                  src={imagePreview}
                  alt="명함"
                  className="max-h-48 rounded-xl object-contain bg-gray-50 w-full border border-gray-200/60"
                />
              </div>
            )}

            {/* Extraction status */}
            <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
                  <span className="text-xs font-medium text-white">2</span>
                </div>
                <h2 className="text-base font-semibold text-gray-900">
                  {extracting ? '정보 추출 중…' : '추출 결과 확인 및 수정'}
                </h2>
                {!extracting && (
                  <span className="h-6 px-2 rounded-md text-xs font-medium inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 ml-auto">
                    <Sparkles className="w-3 h-3" />
                    AI 추출 완료
                  </span>
                )}
              </div>

              {extracting ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { key: 'name' as const, label: '이름', icon: <User className="w-4 h-4" />, placeholder: '홍길동' },
                    { key: 'company' as const, label: '회사', icon: <Building2 className="w-4 h-4" />, placeholder: '(주)예시' },
                    { key: 'phone' as const, label: '연락처', icon: <Phone className="w-4 h-4" />, placeholder: '010-0000-0000' },
                    { key: 'email' as const, label: '이메일', icon: <Mail className="w-4 h-4" />, placeholder: 'name@company.com' },
                  ].map(({ key, label, icon, placeholder }) => (
                    <div key={key}>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                        <span className="text-gray-400">{icon}</span>
                        {label}
                      </label>
                      <input
                        type="text"
                        value={form[key]}
                        onChange={(e) => handleFormChange(key, e.target.value)}
                        placeholder={placeholder}
                        className="w-full h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Memo + Booth + Save */}
            {!extracting && (
              <div className="bg-white border border-gray-200/60 rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4 sm:mb-5">
                  <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
                    <span className="text-xs font-medium text-white">3</span>
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">메모 & 저장</h2>
                </div>

                {/* Booth selector */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">연결 부스</label>
                  <select
                    value={selectedBooth}
                    onChange={(e) => setSelectedBooth(e.target.value)}
                    className="w-full h-9 text-sm bg-white border border-gray-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all"
                  >
                    {booths.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Memo */}
                <div className="mb-5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                    <FileText className="w-4 h-4 text-gray-400" />
                    메모 <span className="text-red-400">*필수</span>
                  </label>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="상담 내용, 다음 액션, 관심 제품 등을 적어두세요"
                    rows={3}
                    className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-3 resize-none outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all placeholder:text-gray-400"
                  />
                </div>

                {/* Consent notice */}
                <div className="mb-5 flex items-start gap-2 p-3 bg-gray-50 border border-gray-200/60 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-600">
                    명함 스캔으로 수집된 정보는 운영자가 직접 입력·동의 확인한 것으로
                    간주하며, 개인정보 처리 내규에 따라 관리됩니다.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => { setStep('upload'); setImagePreview(null); setForm({ name: '', company: '', phone: '', email: '' }); }}
                    className="flex-1 h-10 bg-white border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all duration-150"
                  >
                    다시 스캔
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!memo.trim()}
                    className="flex-1 h-10 bg-brand-600 text-white text-[13px] font-medium rounded-lg flex items-center justify-center hover:bg-brand-500 transition-all duration-150 disabled:opacity-50"
                  >
                    리드로 저장
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
