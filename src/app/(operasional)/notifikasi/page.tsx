import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Bell, CheckCheck } from 'lucide-react';
import { tandaiSemuaDibacaAction } from '@/features/notifikasi/actions';

export default async function NotifikasiPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('notifikasi')
    .select('id, tipe, judul, pesan, tautan, dibaca, created_at')
    .eq('penerima_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(100);

  const jumlahBelumDibaca = (data ?? []).filter((n: any) => !n.dibaca).length;

  const TONE: Record<string, 'blue' | 'orange' | 'green' | 'red' | 'purple' | 'gray'> = {
    info: 'blue', peringatan: 'orange', persetujuan: 'purple',
    stok: 'gray', hse: 'red', biaya: 'green',
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Notifikasi"
        subtitle={jumlahBelumDibaca > 0
          ? `${jumlahBelumDibaca} belum dibaca`
          : 'Semua sudah dibaca'}
        actions={jumlahBelumDibaca > 0 && (
          <form action={tandaiSemuaDibacaAction}>
            <Button type="submit" variant="secondary">
              <CheckCheck size={14} /> Tandai Semua Dibaca
            </Button>
          </form>
        )}
      />

      {(!data || data.length === 0) ? (
        <Card>
          <EmptyState icon={<Bell size={20} />} title="Belum ada notifikasi"
            description="Notifikasi akan muncul di sini saat ada aktivitas yang perlu perhatian Anda." />
        </Card>
      ) : (
        <div className="space-y-2">
          {(data ?? []).map((n: any) => {
            const Wrapper: any = n.tautan ? Link : 'div';
            const props = n.tautan ? { href: n.tautan } : {};
            return (
              <Wrapper key={n.id} {...props}>
                <Card className={
                  'transition hover:border-blue ' +
                  (!n.dibaca ? 'border-blue/30 bg-[color:var(--blue-soft)]/40' : '')
                }>
                  <CardBody className="flex items-start gap-3 py-3">
                    <div className={
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0 ' +
                      (TONE[n.tipe] === 'red' ? 'bg-[color:var(--red-soft)] text-[color:var(--red-fg)]'
                       : TONE[n.tipe] === 'green' ? 'bg-[color:var(--green-soft)] text-[color:var(--green-fg)]'
                       : TONE[n.tipe] === 'orange' ? 'bg-[color:var(--orange-soft)] text-[color:var(--orange-fg)]'
                       : TONE[n.tipe] === 'purple' ? 'bg-[color:var(--purple-soft)] text-[color:var(--purple-fg)]'
                       : 'bg-[color:var(--blue-soft)] text-[color:var(--blue-fg)]')
                    }>
                      <Bell size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-[14px] font-medium truncate">{n.judul}</div>
                        {!n.dibaca && <Badge tone="blue">Baru</Badge>}
                      </div>
                      {n.pesan && (
                        <p className="text-[12px] text-[color:var(--text-2)] mt-0.5 line-clamp-2">
                          {n.pesan}
                        </p>
                      )}
                      <div className="text-[11px] text-[color:var(--text-3)] mt-1">
                        {new Date(n.created_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Wrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}