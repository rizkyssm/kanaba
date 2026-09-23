const MAP: Record<string, { label: string; cls: string }> = {
  draf: { label: 'Draf', cls: 'bg-[color:var(--bg-2)] text-[color:var(--text-2)]' },
  direncanakan: { label: 'Direncanakan', cls: 'bg-blue/10 text-blue' },
  menunggu_persetujuan: { label: 'Menunggu Persetujuan', cls: 'bg-yellow/20 text-[#8a6a00]' },
  disetujui: { label: 'Disetujui', cls: 'bg-green/15 text-green' },
  persiapan: { label: 'Persiapan', cls: 'bg-blue/10 text-blue' },
  dikirim_ke_site: { label: 'Dikirim ke Site', cls: 'bg-blue/10 text-blue' },
  di_site: { label: 'Di Site', cls: 'bg-blue/10 text-blue' },
  sedang_berjalan: { label: 'Sedang Berjalan', cls: 'bg-orange/15 text-orange' },
  selesai: { label: 'Selesai', cls: 'bg-green/15 text-green' },
  rekonsiliasi: { label: 'Rekonsiliasi', cls: 'bg-yellow/20 text-[#8a6a00]' },
  ditutup: { label: 'Ditutup', cls: 'bg-[color:var(--bg-2)] text-[color:var(--text-2)]' },
  dibatalkan: { label: 'Dibatalkan', cls: 'bg-red/10 text-red' },
};

export const DAFTAR_STATUS = Object.keys(MAP);

export default function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, cls: 'bg-[color:var(--bg-2)]' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

export function labelStatus(s: string) {
  return MAP[s]?.label ?? s;
}