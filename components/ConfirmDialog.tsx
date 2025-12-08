
import React from 'react';
import { AlertTriangle, Trash2, Info, CheckCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  isAlert?: boolean; // If true, only show one button (OK/Close)
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isAlert = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <Trash2 size={24} />;
      case 'warning': return <AlertTriangle size={24} />;
      case 'info': return <Info size={24} />;
      case 'success': return <CheckCircle size={24} />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'danger': return { bg: 'bg-red-100', text: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700' };
      case 'warning': return { bg: 'bg-amber-100', text: 'text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700' };
      case 'info': return { bg: 'bg-blue-100', text: 'text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700' };
      case 'success': return { bg: 'bg-green-100', text: 'text-green-600', btn: 'bg-green-600 hover:bg-green-700' };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200 border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <div className={`w-14 h-14 ${colors.bg} rounded-full flex items-center justify-center mb-4 ${colors.text} shadow-sm`}>
            {getIcon()}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {message}
          </p>
          
          <div className="flex gap-3 w-full">
            {!isAlert && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-3 text-white font-semibold rounded-xl shadow-md shadow-gray-200 transition-all transform active:scale-95 ${colors.btn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
