import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={48} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={48} />;
      case 'warning':
        return <AlertTriangle className="text-amber-500" size={48} />;
      default:
        return <Info className="text-blue-500" size={48} />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-100',
          button: 'bg-green-600 hover:bg-green-700',
          text: 'text-green-900'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-100',
          button: 'bg-red-600 hover:bg-red-700',
          text: 'text-red-900'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-100',
          button: 'bg-amber-600 hover:bg-amber-700',
          text: 'text-amber-900'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-100',
          button: 'bg-blue-600 hover:bg-blue-700',
          text: 'text-blue-900'
        };
    }
  };

  const colors = getColors();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className={`${colors.bg} ${colors.border} border-b px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className={`text-lg font-bold ${colors.text}`}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white ${colors.button} rounded-lg font-medium transition-colors shadow-sm`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
