import { getKonteks, punya } from '@/lib/auth/permissions';

export default async function BerandaPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const staf = !punya(ctx, 'biaya.lihat_ringkasan') && !punya(ctx, 'biaya.lihat_rinci');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Beranda</h1>
        <p className="text-sm text-[color:var(--text-2)]">
          Selamat datang, {ctx.namaLengkap}. Organisasi: {ctx.organisasiNama}
        </p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kartu label="KANABA tersedia" nilai="0 pcs" />
        <Kartu label="Liquid Oxygen" nilai="0 kg" />
        <Kartu label="KANABA keluar hari ini" nilai="0 pcs" />
        <Kartu label="Kegiatan aktif" nilai="0" />
      </section>

      {!staf && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kartu label="Total biaya bulan berjalan" nilai="Rp 0" />
          <Kartu label="Biaya per BCM" nilai="Rp 0" />
          <Kartu label="BCM bulan berjalan" nilai="0" />
          <Kartu label="Jumlah kegiatan bulan berjalan" nilai="0" />
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-[color:var(--text-2)] mb-2">Catatan</h2>
        <p className="text-sm text-[color:var(--text-2)]">
          Modul Kegiatan, Persediaan, Produksi, LOX, dan Biaya akan aktif pada phase berikutnya.
        </p>
      </section>
    </div>
  );
}

function Kartu({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="rounded border border-[color:var(--border)] p-4">
      <div className="text-xs text-[color:var(--text-2)]">{label}</div>
      <div className="text-lg font-semibold mt-1">{nilai}</div>
    </div>
  );
}