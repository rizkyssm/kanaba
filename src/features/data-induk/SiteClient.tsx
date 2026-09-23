'use client';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatSiteAction } from './actions';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Plus } from 'lucide-react';

type Site = { id: string; kode: string; nama: string; alamat: string | null; aktif: boolean };

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Menyimpan…' : 'Tambah Site'}
    </Button>
  );
}

export default function SiteClient({ data, bisaKelola }: { data: Site[]; bisaKelola: boolean }) {
  const [state, action] = useActionState(buatSiteAction, null as any);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Site</h1>
          <p className="text-sm text-[color:var(--text-2)] mt-1">Daftar lokasi operasional organisasi.</p>
        </div>
        {bisaKelola && (
          <Button variant={showForm ? 'secondary' : 'primary'} onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Tutup' : <><Plus size={14} /> Site Baru</>}
          </Button>
        )}
      </div>

      {showForm && bisaKelola && (
        <Card>
          <CardBody>
            <form action={action} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <Field label="Kode" required>
                <Input name="kode" required placeholder="SITE-01" />
              </Field>
              <Field label="Nama" required>
                <Input name="nama" required placeholder="Gunung Batujajar" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Alamat">
                  <Input name="alamat" />
                </Field>
              </div>
              <div className="md:col-span-3 flex items-center gap-3">
                <Tombol />
                {state?.error && <span className="text-sm text-red">{state.error}</span>}
                {state?.sukses && <span className="text-sm text-green">Site tersimpan.</span>}
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MapPin size={20} />}
            title="Belum ada site"
            description="Tambahkan lokasi operasional untuk memulai kegiatan."
          />
        </Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            <TH>Kode</TH>
            <TH>Nama</TH>
            <TH>Alamat</TH>
            <TH>Status</TH>
          </THead>
          <TBody>
            {data.map((s) => (
              <TR key={s.id}>
                <TD className="font-mono text-[12px]">{s.kode}</TD>
                <TD className="font-medium">{s.nama}</TD>
                <TD className="text-[color:var(--text-2)]">{s.alamat ?? '—'}</TD>
                <TD>
                  {s.aktif
                    ? <Badge tone="green">Aktif</Badge>
                    : <Badge tone="gray">Nonaktif</Badge>}
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}