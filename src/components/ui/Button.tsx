'use client';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-blue text-white hover:bg-[color:var(--blue-fg)] shadow-[var(--shadow-xs)]',
  secondary: 'bg-[color:var(--bg-subtle)] text-[color:var(--text)] hover:bg-[color:var(--bg-hover)] border',
  ghost: 'text-[color:var(--text-2)] hover:bg-[color:var(--bg-hover)] hover:text-[color:var(--text)]',
  danger: 'bg-red text-white hover:opacity-90',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] rounded-[var(--radius-sm)]',
  md: 'h-9 px-4 text-sm rounded-[var(--radius-md)]',
  lg: 'h-11 px-5 text-sm rounded-[var(--radius-md)]',
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant; size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn('inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap',
        'disabled:opacity-50 disabled:pointer-events-none focus-ring select-none',
        VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';