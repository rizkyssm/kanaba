import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import StatusBadge, { labelStatus } from '@/features/kegiatan/StatusBadge';
import TombolStatus from '@/features/kegiatan/TombolStatus';
import { tanggal } from '@/lib/utils';

type Params = Promise<{ id: string }>;
type Search = Promise<{ tab?: string }>;

const TABS = [
  ['ringkasan', 'Ringkasan'],
  ['material', 'Material'],
  ['lox', 'Liquid Oxygen'],
  ['personel', 'Personel'],
  ['peralatan', 'Peralatan'],
  ['hse', 'HSE'],
  ['riwayat', 'Riwayat'],
] as const;

export default async function KegiatanDetail({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { id } = await params;
  const { tab = 'ringkasan' } = await searchParams;

  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: k } = await supabase
    .from('kegiatan')
    .select('*, site:site_id(kode,nama), penanggung_jawab:penanggung_jawab_id(nama_lengkap,email)')
    .eq('id', id)
    .eq('organisasi_id', ctx.organisasiId)
    .single();

  if (!k) notFound();

  const bolehKelola = punya(ctx, 'kegiatan.kelola');

  return (
    <div className="space-y-5">
      <div>
        <Link href="/kegiatan" className="text-sm text-[color:var(--text-2)] hover:underline">← Kegiatan</Link>
        <div className="flex items-start justify-between gap-4 mt-2 flex-wrap">
          <div>
            <div className="font-mono text-xs text-[color:var(--text-2)]">{k.nomor}</div>
            <h1 className="text-xl font-semibold">{k.nama}</h1>
            <div className="text-sm text-[color:var(--text-2)] mt-1 flex items-center gap-2">
              <StatusBadge status={k.status} />
              <span>{k.site?.kode} · {k.site?.nama}</span>
              <span>·</span>
              <span>{tanggal(k.tanggal)}</span>
            </div>
          </div>
          {bolehKelola && <TombolStatus kegiatanId={k.id} status={k.status} />}
        </div>
      </div>

      <nav className="border-b border-[color:var(--border)] overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(([key, label]) => {
            const aktif = tab === key;
            return (
              <Link
                key={key}
                href={`/kegiatan/${k.id}?tab=${key}`}
                className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 ${
                  aktif ? 'border-blue text-blue font-medium' : 'border-transparent text-[color:var(--text-2)] hover:text-[color:var(--text)]'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <section>
        {tab === 'ringkasan' && <TabRingkasan k={k} />}
        {tab === 'material' && <TabMaterial k={k} />}
        {tab === 'lox' && <TabLox k={k} />}
        {tab === 'personel' && <TabPersonel k={k} bolehKelola={bolehKelola} />}
        {tab === 'peralatan' && <TabPeralatan k={k} bolehKelola={bolehKelola} />}
        {tab === 'hse' && <TabHse k={k} />}
        {tab === 'riwayat' && <TabRiwayat k={k} />}
      </section>
    </div>
  );
}

function Baris({ label, rencana, aktual, satuan }: { label: string; rencana: number; aktual: number; satuan?: string }) {
  const selisih = aktual - rencana;
  return (
    <tr>
      <td>{label}</td>
      <td className="text-right tabular-nums">{rencana.toLocaleString('id-ID')} {satuan}</td>
      <td className="text-right tabular-nums">{aktual.toLocaleString('id-ID')} {satuan}</td>
      <td className={`text-right tabular-nums ${selisih < 0 ? 'text-red' : selisih > 0 ? 'text-orange' : 'text-[color:var(--text-2)]'}`}>
        {selisih > 0 ? '+' : ''}{selisih.toLocaleString('id-ID')} {satuan}
      </td>
    </tr>
  );
}

async function TabRingkasan({ k }: { k: any }) {
  return (
    <div className="overflow-x-auto rounded border border-[color:var(--border)]">
      <table className="tabel">
        <thead>
          <tr><th>Parameter</th><th className="text-right">Rencana</th><th className="text-right">Aktual</th><th className="text-right">Selisih</th></tr>
        </thead>
        <tbody>
          <Baris label="BCM" rencana={Number(k.target_bcm)} aktual={Number(k.aktual_bcm)} />
          <Baris label="KANABA" rencana={k.rencana_kanaba} aktual={k.aktual_kanaba} satuan="pcs" />
          <Baris label="Liquid Oxygen" rencana={Number(k.rencana_lox_kg)} aktual={Number(k.aktual_lox_kg)} satuan="kg" />
        </tbody>
      </table>
      {k.catatan && (
        <div className="p-3 text-sm border-t border-[color:var(--border)]">
          <div className="text-xs text-[color:var(--text-2)] mb-1">Catatan</div>
          <div className="whitespace-pre-wrap">{k.catatan}</div>
        </div>
      )}
    </div>
  );
}

async function TabMaterial({ k }: { k: any }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('pengeluaran_material')
    .select('id, nomor, tanggal, status, item:pengeluaran_material_item(jumlah, material:material_id(kode,nama))')
    .eq('kegiatan_id', k.id)
    .order('tanggal', { ascending: false });

  const kembali = await supabase
    .from('pengembalian_material')
    .select('id, nomor, tanggal, item:pengembalian_material_item(jumlah, material:material_id(kode,nama))')
    .eq('kegiatan_id', k.id);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Pengeluaran Material</h3>
        <div className="overflow-x-auto rounded border border-[color:var(--border)]">
          <table className="tabel">
            <thead><tr><th>Nomor</th><th>Tanggal</th><th>Material</th><th className="text-right">Jumlah</th></tr></thead>
            <tbody>
              {(!data || data.length === 0) && <tr><td colSpan={4} className="text-center text-[color:var(--text-2)] py-4">Belum ada pengeluaran.</td></tr>}
              {(data ?? []).flatMap((p: any) =>
                (p.item ?? []).map((i: any, idx: number) => (
                  <tr key={`${p.id}-${idx}`}>
                    {idx === 0 && <td rowSpan={p.item.length} className="font-mono text-xs align-top">{p.nomor}<div className="text-[color:var(--text-2)]">{tanggal(p.tanggal)}</div></td>}
                    <td className="hidden md:table-cell"></td>
                    <td>{i.material?.kode} · {i.material?.nama}</td>
                    <td className="text-right tabular-nums">{Number(i.jumlah).toLocaleString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Pengembalian Material</h3>
        <div className="overflow-x-auto rounded border border-[color:var(--border)]">
          <table className="tabel">
            <thead><tr><th>Nomor</th><th>Tanggal</th><th>Material</th><th className="text-right">Jumlah</th></tr></thead>
            <tbody>
              {(!kembali.data || kembali.data.length === 0) && <tr><td colSpan={4} className="text-center text-[color:var(--text-2)] py-4">Belum ada pengembalian.</td></tr>}
              {(kembali.data ?? []).flatMap((p: any) =>
                (p.item ?? []).map((i: any, idx: number) => (
                  <tr key={`${p.id}-${idx}`}>
                    {idx === 0 && <td rowSpan={p.item.length} className="font-mono text-xs align-top">{p.nomor}<div className="text-[color:var(--text-2)]">{tanggal(p.tanggal)}</div></td>}
                    <td className="hidden md:table-cell"></td>
                    <td>{i.material?.kode} · {i.material?.nama}</td>
                    <td className="text-right tabular-nums">{Number(i.jumlah).toLocaleString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

async function TabLox({ k }: { k: any }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('transaksi_lox')
    .select('id, jenis, arah, jumlah_kg, catatan, created_at')
    .eq('kegiatan_id', k.id)
    .order('created_at', { ascending: false });

  const keluar = (data ?? []).filter((r: any) => r.jenis === 'pengeluaran_site').reduce((s, r: any) => s + Number(r.jumlah_kg), 0);
  const kembali = (data ?? []).filter((r: any) => r.jenis === 'pengembalian_site').reduce((s, r: any) => s + Number(r.jumlah_kg), 0);
  const terpakai = keluar - kembali;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Kotak label="LOX Keluar" nilai={`${keluar.toLocaleString('id-ID')} kg`} />
        <Kotak label="LOX Kembali" nilai={`${kembali.toLocaleString('id-ID')} kg`} />
        <Kotak label="LOX Terpakai" nilai={`${terpakai.toLocaleString('id-ID')} kg`} />
      </div>
      <div className="overflow-x-auto rounded border border-[color:var(--border)]">
        <table className="tabel">
          <thead><tr><th>Waktu</th><th>Jenis</th><th>Arah</th><th className="text-right">Jumlah (kg)</th><th>Catatan</th></tr></thead>
          <tbody>
            {(!data || data.length === 0) && <tr><td colSpan={5} className="text-center text-[color:var(--text-2)] py-4">Belum ada transaksi LOX.</td></tr>}
            {(data ?? []).map((r: any) => (
              <tr key={r.id}>
                <td className="text-xs text-[color:var(--text-2)]">{new Date(r.created_at).toLocaleString('id-ID')}</td>
                <td>{r.jenis}</td>
                <td>{r.arah}</td>
                <td className="text-right tabular-nums">{Number(r.jumlah_kg).toLocaleString('id-ID')}</td>
                <td className="text-[color:var(--text-2)]">{r.catatan ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kotak({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="rounded border border-[color:var(--border)] p-3">
      <div className="text-xs text-[color:var(--text-2)]">{label}</div>
      <div className="text-base font-semibold mt-1 tabular-nums">{nilai}</div>
    </div>
  );
}

async function TabPersonel({ k, bolehKelola }: { k: any; bolehKelola: boolean }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('personel_kegiatan')
    .select('id, peran, personel:personel_id(id, nama, tipe, keahlian)')
    .eq('kegiatan_id', k.id);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded border border-[color:var(--border)]">
        <table className="tabel">
          <thead><tr><th>Nama</th><th>Tipe</th><th>Keahlian</th><th>Peran</th></tr></thead>
          <tbody>
            {(!data || data.length === 0) && <tr><td colSpan={4} className="text-center text-[color:var(--text-2)] py-4">Belum ada personel.</td></tr>}
            {(data ?? []).map((r: any) => (
              <tr key={r.id}>
                <td>{r.personel?.nama}</td>
                <td className="text-[color:var(--text-2)]">{r.personel?.tipe}</td>
                <td className="text-[color:var(--text-2)]">{r.personel?.keahlian ?? '—'}</td>
                <td>{r.peran ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bolehKelola && (
        <p className="text-xs text-[color:var(--text-2)]">
          Kelola penugasan personel di <a href="/data-induk/personel" className="underline">Data Induk → Personel</a>.
        </p>
      )}
    </div>
  );
}

async function TabPeralatan({ k, bolehKelola }: { k: any; bolehKelola: boolean }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('pemakaian_aset')
    .select('id, catatan, created_at, aset:aset_id(kode, nama, kategori, status)')
    .eq('kegiatan_id', k.id);

  return (
    <div className="overflow-x-auto rounded border border-[color:var(--border)]">
      <table className="tabel">
        <thead><tr><th>Kode</th><th>Nama</th><th>Kategori</th><th>Status</th><th>Catatan</th></tr></thead>
        <tbody>
          {(!data || data.length === 0) && <tr><td colSpan={5} className="text-center text-[color:var(--text-2)] py-4">Belum ada aset dipakai.</td></tr>}
          {(data ?? []).map((r: any) => (
            <tr key={r.id}>
              <td className="font-mono text-xs">{r.aset?.kode}</td>
              <td>{r.aset?.nama}</td>
              <td className="text-[color:var(--text-2)]">{r.aset?.kategori ?? '—'}</td>
              <td>{r.aset?.status}</td>
              <td className="text-[color:var(--text-2)]">{r.catatan ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function TabHse({ k }: { k: any }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('catatan_hse')
    .select('id, jenis, judul, tingkat, status, created_at')
    .eq('kegiatan_id', k.id)
    .order('created_at', { ascending: false });

  return (
    <div className="overflow-x-auto rounded border border-[color:var(--border)]">
      <table className="tabel">
        <thead><tr><th>Waktu</th><th>Jenis</th><th>Judul</th><th>Tingkat</th><th>Status</th></tr></thead>
        <tbody>
          {(!data || data.length === 0) && <tr><td colSpan={5} className="text-center text-[color:var(--text-2)] py-4">Belum ada catatan HSE.</td></tr>}
          {(data ?? []).map((r: any) => (
            <tr key={r.id}>
              <td className="text-xs text-[color:var(--text-2)]">{new Date(r.created_at).toLocaleString('id-ID')}</td>
              <td>{r.jenis}</td>
              <td>{r.judul}</td>
              <td>{r.tingkat}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function TabRiwayat({ k }: { k: any }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('riwayat_status_kegiatan')
    .select('id, status_lama, status_baru, catatan, created_at, oleh:oleh_id(nama_lengkap)')
    .eq('kegiatan_id', k.id)
    .order('created_at', { ascending: false });

  return (
    <div className="overflow-x-auto rounded border border-[color:var(--border)]">
      <table className="tabel">
        <thead><tr><th>Waktu</th><th>Dari</th><th>Ke</th><th>Oleh</th><th>Catatan</th></tr></thead>
        <tbody>
          {(!data || data.length === 0) && <tr><td colSpan={5} className="text-center text-[color:var(--text-2)] py-4">Belum ada riwayat.</td></tr>}
          {(data ?? []).map((r: any) => (
            <tr key={r.id}>
              <td className="text-xs text-[color:var(--text-2)]">{new Date(r.created_at).toLocaleString('id-ID')}</td>
              <td>{r.status_lama ? labelStatus(r.status_lama) : '—'}</td>
              <td>{labelStatus(r.status_baru)}</td>
              <td>{r.oleh?.nama_lengkap ?? '—'}</td>
              <td className="text-[color:var(--text-2)]">{r.catatan ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}