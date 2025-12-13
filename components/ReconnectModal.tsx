
import React from 'react';
import { CloudOff, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReconnectModalProps {
  isOpen: boolean;
  onReconnect: () => void;
  onStartFresh?: () => void;
  errorMessage?: string;
  isReconnecting?: boolean;
}

export const ReconnectModal: React.FC<ReconnectModalProps> = ({
  isOpen,
  onReconnect,
  onStartFresh,
  errorMessage,
  isReconnecting = false
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <CloudOff size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">
            {t('sync.reconnectModal.title')}
          </h2>
          <p className="text-amber-50 text-center text-sm">
            {t('sync.reconnectModal.subtitle')}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-900 font-medium mb-1">
                  {t('sync.reconnectModal.errorTitle')}
                </p>
                <p className="text-xs text-amber-700">
                  {errorMessage || t('sync.reconnectModal.errorMessage')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">1</span>
              </div>
              <p>{t('sync.reconnectModal.step1')}</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">2</span>
              </div>
              <p>{t('sync.reconnectModal.step2')}</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">3</span>
              </div>
              <p>{t('sync.reconnectModal.step3')}</p>
            </div>
          </div>

          <button
            onClick={onReconnect}
            disabled={isReconnecting}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isReconnecting ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                {t('sync.reconnectModal.reconnecting')}
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                {t('sync.reconnectNow')}
              </>
            )}
          </button>

          {onStartFresh && (
            <>
              {/* Divider with OR */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500 font-medium">
                    {t('sync.reconnectModal.or')}
                  </span>
                </div>
              </div>

              {/* Start Fresh Button */}
              <button
                onClick={onStartFresh}
                disabled={isReconnecting}
                className="w-full bg-white hover:bg-red-50 text-red-600 font-semibold py-3 px-6 rounded-xl border-2 border-red-200 hover:border-red-300 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                {t('sync.reconnectModal.startFresh')}
              </button>

              <p className="text-xs text-red-600 text-center mt-2">
                {t('sync.reconnectModal.startFreshWarning')}
              </p>
            </>
          )}

          <p className="text-xs text-gray-500 text-center mt-4">
            {t('sync.reconnectModal.dataSafe')}
          </p>
        </div>
      </div>
    </div>
  );
};
