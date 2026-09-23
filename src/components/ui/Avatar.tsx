import { cn } from '@/lib/utils';

export function Avatar({
  nama, size = 32, className,
}: { nama: string; size?: number; className?: string }) {
  const initial = (nama || '?').trim().charAt(0).toUpperCase();
  return (
    <span
      className={cn('inline-flex items-center justify-center rounded-full bg-blue/10 text-blue font-semibold select-none', className)}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}