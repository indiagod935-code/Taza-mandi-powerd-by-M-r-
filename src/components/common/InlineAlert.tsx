import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type AlertVariant = 'error' | 'success' | 'info' | 'warning';

interface InlineAlertProps {
  variant: AlertVariant;
  message: string;
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  error:
    'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200',
  success:
    'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
  warning:
    'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200',
  info:
    'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200',
};

export const InlineAlert: React.FC<InlineAlertProps> = ({
  variant,
  message,
  onDismiss,
  actionLabel,
  onAction,
  className = '',
}) => {
  if (!message) return null;

  const Icon =
    variant === 'success' ? CheckCircle2 : variant === 'info' ? Info : AlertCircle;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-start justify-between gap-2 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      <div className="flex items-start gap-2 min-w-0">
        <Icon className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="min-w-0 break-words leading-snug">
          <span>{message}</span>
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="ml-2 underline font-bold cursor-pointer hover:opacity-80"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default InlineAlert;
