import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export function Modal({ open, onClose, title, headerRight, children, size = 'sm' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 animate-fade-in" />

      <div
        className={`relative bg-white shadow-modal w-full max-h-[85vh] flex flex-col rounded-t-2xl rounded-b-none animate-slide-up sm:rounded-xl sm:max-h-none sm:mx-auto sm:overflow-hidden sm:animate-scale-in ${
          size === 'md' ? 'sm:max-w-md' : 'sm:max-w-sm'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-[15px] font-semibold text-gray-900 shrink-0">{title}</h3>
            <div className="flex items-center gap-2">
              {headerRight}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-1 rounded-lg hover:bg-gray-100 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
