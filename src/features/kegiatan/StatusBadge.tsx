import { Badge } from '@/components/ui/Badge';

type Tone = 'gray' | 'blue' | 'green' | 'red' | 'orange' | 'yellow' | 'purple';
const MAP: Record<string, { label: string; tone: Tone }> = {
  draf:                 { label: 'Draf',                tone: 'gray' },
  direncanakan:         { label: 'Direncanakan',        tone: 'blue' },
  menunggu_persetujuan: { label: 'Menunggu Persetujuan', tone: 'yellow' },
  disetujui:            { label: 'Disetujui',           tone: 'green' },
  persiapan:            { label: 'Persiapan',           tone: 'blue' },
  dikirim_ke_site:      { label: 'Dikirim ke Site',     tone: 'blue' },
  di_site:              { label: 'Di Site',             tone: 'blue' },
  sedang_berjalan:      { label: 'Sedang Berjalan',     tone: 'orange' },
  selesai:              { label: 'Selesai',             tone: 'green' },
  rekonsiliasi:         { label: 'Rekonsiliasi',        tone: 'yellow' },
  ditutup:              { label: 'Ditutup',             tone: 'gray' },
  dibatalkan:           { label: 'Dibatalkan',          tone: 'red' },
};

export const DAFTAR_STATUS = Object.keys(MAP);
export function labelStatus(s: string) { return MAP[s]?.label ?? s; }

export default function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, tone: 'gray' as Tone };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}