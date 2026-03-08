import { Link, useLocation } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const { pathname } = useLocation();
  const isAdminPath = pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Search className="w-7 h-7 text-gray-400" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">
          {isAdminPath ? '페이지를 찾을 수 없어요' : '부스를 찾을 수 없어요'}
        </h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          {isAdminPath
            ? '요청하신 관리 페이지가 존재하지 않거나 이동되었어요.'
            : '요청하신 페이지가 존재하지 않거나 주소가 잘못되었어요.'}
        </p>
        <Link
          to={isAdminPath ? '/admin/booths' : '/explore'}
          className="inline-flex items-center gap-2 h-10 px-5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-500 transition-all duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          {isAdminPath ? '내 부스로 이동' : '부스 둘러보기'}
        </Link>
      </div>
    </div>
  );
}
