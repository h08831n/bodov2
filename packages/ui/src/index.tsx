import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==========================================
// 1. Button Component
// ==========================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

    const variants = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 shadow-sm',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 focus:ring-slate-400',
      outline:
        'border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/60 focus:ring-slate-400',
      ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 focus:ring-slate-400',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500 shadow-sm',
      success:
        'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-500 shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

// ==========================================
// 2. Badge Component
// ==========================================
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default:
      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    neutral:
      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    primary:
      'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    success:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning:
      'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    danger:
      'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    info: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};

// ==========================================
// 3. Card Component
// ==========================================
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      'rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

// ==========================================
// 4. Input Component
// ==========================================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const generatedId = id || React.useId();
    return (
      <div className="w-full space-y-1.5 text-right">
        {label && (
          <label
            htmlFor={generatedId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          id={generatedId}
          ref={ref}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors',
            error
              ? 'border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

// ==========================================
// 5. Select Component
// ==========================================
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, id, ...props }, ref) => {
    const generatedId = id || React.useId();
    return (
      <div className="w-full space-y-1.5 text-right">
        {label && (
          <label
            htmlFor={generatedId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <select
          id={generatedId}
          ref={ref}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-colors cursor-pointer',
            error
              ? 'border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';

// ==========================================
// 6. Odoo Statusbar Component (Pipeline Stages)
// ==========================================
export interface StatusStage {
  id: string;
  label: string;
}

export interface StatusbarProps {
  stages: StatusStage[];
  currentStageId: string;
  onSelectStage?: (stageId: string) => void;
  className?: string;
}

export const Statusbar: React.FC<StatusbarProps> = ({
  stages,
  currentStageId,
  onSelectStage,
  className,
}) => {
  const currentIndex = stages.findIndex((s) => s.id === currentStageId);

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-1 overflow-x-auto text-xs font-medium',
        className,
      )}
    >
      {stages.map((stage, idx) => {
        const isCurrent = stage.id === currentStageId;
        const isPast = currentIndex > idx;
        return (
          <button
            key={stage.id}
            type="button"
            disabled={!onSelectStage}
            onClick={() => onSelectStage?.(stage.id)}
            className={cn(
              'px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer select-none',
              isCurrent && 'bg-blue-600 text-white font-semibold shadow-sm',
              isPast &&
                'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800',
              !isCurrent &&
                !isPast &&
                'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400',
            )}
          >
            {stage.label}
          </button>
        );
      })}
    </div>
  );
};

// ==========================================
// 7. Odoo SmartButton Component
// ==========================================
export interface SmartButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count?: number | string;
  label: string;
  icon?: React.ReactNode;
}

export const SmartButton: React.FC<SmartButtonProps> = ({
  count,
  label,
  icon,
  className,
  ...props
}) => (
  <button
    type="button"
    className={cn(
      'flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-right shadow-sm cursor-pointer',
      className,
    )}
    {...props}
  >
    {icon && <div className="text-blue-600 dark:text-blue-400">{icon}</div>}
    <div>
      {count !== undefined && (
        <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{count}</div>
      )}
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</div>
    </div>
  </button>
);

// ==========================================
// 8. Odoo Chatter Component (Timeline/Notes)
// ==========================================
export interface ChatterMessage {
  id: string;
  author: string;
  date: string;
  content: string;
  type?: 'note' | 'activity' | 'system';
}

export interface ChatterProps {
  messages: ChatterMessage[];
  onSendMessage?: (content: string, type: 'note' | 'activity') => void;
  className?: string;
}

export const Chatter: React.FC<ChatterProps> = ({ messages, onSendMessage, className }) => {
  const [content, setContent] = React.useState('');
  const [mode, setMode] = React.useState<'note' | 'activity'>('note');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSendMessage?.(content, mode);
    setContent('');
  };

  return (
    <div
      className={cn(
        'border-t lg:border-t-0 lg:border-r border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/30 w-full lg:w-96 flex flex-col',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
          گفتگو و رویدادها (Chatter)
        </h4>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode('note')}
            className={cn(
              'px-2 py-1 text-xs rounded font-medium transition-colors cursor-pointer',
              mode === 'note'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold'
                : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800',
            )}
          >
            یادداشت داخلی
          </button>
          <button
            type="button"
            onClick={() => setMode('activity')}
            className={cn(
              'px-2 py-1 text-xs rounded font-medium transition-colors cursor-pointer',
              mode === 'activity'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold'
                : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800',
            )}
          >
            ثبت فعالیت
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            mode === 'note'
              ? 'یک یادداشت خصوصی برای همکاران بنویسید...'
              : 'تماس تلفنی، جلسه یا پیگیری بعدی را ثبت کنید...'
          }
          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
        <div className="flex justify-end">
          <Button size="sm" type="submit" disabled={!content.trim()}>
            ارسال
          </Button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">هنوز پیامی ثبت نشده است.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className="text-xs p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs"
            >
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{m.author}</span>
                <span>{m.date}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {m.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ==========================================
// 9. Legacy SamplePlaceholder
// ==========================================
export interface SamplePlaceholderProps {
  label: string;
  onClick?: () => void;
}

export const SamplePlaceholder: React.FC<SamplePlaceholderProps> = ({ label, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
    >
      {label}
    </button>
  );
};
