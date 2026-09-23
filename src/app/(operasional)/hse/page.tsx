import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import FormHse from '@/features/hse/FormHse';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Card, CardBody } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck } from 'lucide-react';

const TINGKAT_TONE: Record<string, 'gray' | 'blue' | 'orange' | 'red'> = {
  rendah: 'gray', sedang: 'blue', tinggi: 'orange', kritis: 'red',
};

const STATUS_TONE: Record<string, 'orange' | 'blue' | 'green' | 'gray'> = {
  terbuka: 'orange', ditindaklanjuti: 'blue', selesai: 'green', ditutup: 'gray',
};

const JENIS_LABEL: Record<string, string> = {
  pemeriksaan: 'Pemeriksaan',
  temuan: 'Temuan',
  insiden: 'Insiden',
  kondisi_tidak_aman: 'Kondisi Tidak Aman',
  tindakan_perbaikan: 'Tindakan Perbaikan',
};

export default async function HsePage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const [{ data: list }, { data: kegiatans }, { data: sites }] = await Promise.all([
    supabase.from('catatan_hse')
      .select('id, jenis, judul, tingkat, status, created_at, kegiatan:kegiatan_id(id,nomor)')
      .eq('organisasi_id', ctx.organisasiId)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('kegiatan').select('id, nomor, nama')
      .eq('organisasi_id', ctx.organisasiId).limit(200),
    supabase.from('site').select('id, kode, nama')
      .eq('organisasi_id', ctx.organisasiId).eq('aktif', true),
  ]);

  const total = list?.length ?? 0;
  const terbuka = (list ?? []).filter((r: any) => r.status === 'terbuka').length;
  const tinggi = (list ?? []).filter((r: any) => r.tingkat === 'tinggi' || r.tingkat === 'kritis').length;
  const selesai = (list ?? []).filter((r: any) => r.status === 'selesai' || r.status === 'ditutup').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="HSE"
        subtitle="Pemeriksaan, temuan, insiden, dan tindakan perbaikan."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Catatan"   value={total} />
        <KPICard label="Terbuka"         value={terbuka} tone={terbuka > 0 ? 'orange' : 'neutral'} />
        <KPICard label="Risiko Tinggi"   value={tinggi} tone={tinggi > 0 ? 'red' : 'neutral'} />
        <KPICard label="Selesai"         value={selesai} tone="green" />
      </div>

      {punya(ctx, 'kegiatan.kelola') && (
        <Section title="Catatan Baru">
          <Card>
            <CardBody>
              <FormHse kegiatans={(kegiatans ?? []) as any} sites={(sites ?? []) as any} />
            </CardBody>
          </Card>
        </Section>
      )}

      <Section title="Daftar Catatan" subtitle={`${total} catatan`}>
        {(!list || list.length === 0) ? (
          <Card>
            <EmptyState
              icon={<ShieldCheck size={20} />}
              title="Belum ada catatan HSE"
              description="Catat pemeriksaan, temuan, atau insiden di sini."
            />
          </Card>
        ) : (
          <TableWrap className="bg-[color:var(--bg-elev)]">
            <THead>
              <TH>Waktu</TH>
              <TH>Jenis</TH>
              <TH>Judul</TH>
              <TH>Tingkat</TH>
              <TH>Status</TH>
              <TH>Kegiatan</TH>
            </THead>
            <TBody>
              {(list ?? []).map((r: any) => (
                <TR key={r.id}>
                  <TD className="text-[12px] text-[color:var(--text-2)]">
                    {new Date(r.created_at).toLocaleString('id-ID')}
                  </TD>
                  <TD className="text-[color:var(--text-2)]">{JENIS_LABEL[r.jenis] ?? r.jenis}</TD>
                  <TD className="font-medium">{r.judul}</TD>
                  <TD><Badge tone={TINGKAT_TONE[r.tingkat] ?? 'gray'}>{r.tingkat}</Badge></TD>
                  <TD><Badge tone={STATUS_TONE[r.status] ?? 'gray'}>{r.status}</Badge></TD>
                  <TD className="font-mono text-[12px]">
                    {r.kegiatan?.id
                      ? <Link href={`/kegiatan/${r.kegiatan.id}?tab=hse`} className="text-blue hover:underline">{r.kegiatan.nomor}</Link>
                      : '—'}
                  </TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
        )}
      </Section>
    </div>
  );
}