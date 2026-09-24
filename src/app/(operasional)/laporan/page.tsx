import Link from 'next/link';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DAFTAR_LAPORAN } from '@/features/laporan/daftar';
import { FileText, ChevronRight } from 'lucide-react';

export default async function LaporanPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const op = DAFTAR_LAPORAN.filter((l) => l.kategori === 'operasional' && punya(ctx, l.hak));
  const keu = DAFTAR_LAPORAN.filter((l) => l.kategori === 'keuangan' && punya(ctx, l.hak));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        subtitle="Generator laporan operasional dan keuangan dengan export CSV."
      />

      {op.length > 0 && (
        <Section title="Operasional" subtitle={`${op.length} laporan tersedia`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {op.map((l) => (
              <Link key={l.slug} href={`/laporan/${l.slug}`} className="group">
                <Card className="h-full transition group-hover:border-blue">
                  <CardBody className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[color:var(--bg-subtle)] flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-[color:var(--text-2)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-[14px] font-medium truncate">{l.nama}</div>
                        <Badge tone="blue">Operasional</Badge>
                      </div>
                      <div className="text-[12px] text-[color:var(--text-2)] mt-1">{l.deskripsi}</div>
                    </div>
                    <ChevronRight size={16} className="text-[color:var(--text-3)] shrink-0 mt-1" />
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {keu.length > 0 && (
        <Section title="Keuangan & Manajemen" subtitle={`${keu.length} laporan tersedia`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {keu.map((l) => (
              <Link key={l.slug} href={`/laporan/${l.slug}`} className="group">
                <Card className="h-full transition group-hover:border-blue">
                  <CardBody className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[color:var(--bg-subtle)] flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-[color:var(--text-2)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-[14px] font-medium truncate">{l.nama}</div>
                        <Badge tone="purple">Keuangan</Badge>
                      </div>
                      <div className="text-[12px] text-[color:var(--text-2)] mt-1">{l.deskripsi}</div>
                    </div>
                    <ChevronRight size={16} className="text-[color:var(--text-3)] shrink-0 mt-1" />
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {op.length === 0 && keu.length === 0 && (
        <Card>
          <CardBody className="text-center py-10 text-[color:var(--text-2)] text-[13px]">
            Anda tidak memiliki akses ke laporan mana pun.
          </CardBody>
        </Card>
      )}
    </div>
  );
}