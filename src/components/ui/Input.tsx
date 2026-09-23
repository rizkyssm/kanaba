'use client';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const baseCls =
  'w-full bg-[color:var(--bg)] border rounded-[var(--radius-md)] px-3 h-9 text-sm ' +
  'placeholder:text-[color:var(--text-3)] focus-ring ' +
  'focus:border-blue focus:bg-[color:var(--bg)]';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseCls, className)} {...props} />
  )
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(baseCls, 'pr-8 appearance-none bg-no-repeat',
      'bg-[url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236e6e73\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'6 9 12 15 18 9\'/></svg>")]',
      'bg-[right_0.75rem_center]', className)} {...props}>{children}</select>
  )
);
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(baseCls, 'h-auto py-2 min-h-[80px] resize-y', className)} {...props} />
  )
);
Textarea.displayName = 'Textarea';

export function Field({
  label, error, hint, children, required,
}: { label?: string; error?: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[13px] font-medium text-[color:var(--text-2)]">
          {label}{required && <span className="text-red ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-[color:var(--text-3)]">{hint}</p>}
      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  );
}