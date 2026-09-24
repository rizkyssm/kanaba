'use client';
import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatPemeriksaanAction } from './actions';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Trash2, Plus, ClipboardCheck } from 'lucide-react';

type Material = { id: string; kode: string; nama: string };
type Site = { id: string; kode: string; nama: string };
type Alasan = { kode: string; nama: string };
type SaldoMap = Record<string, number>; // material_id → saldo

type Row = {
  material_id: string;
  jumlah_fisik: number;
  alasan_kode: string;
  catatan: string;
};

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Mengajukan…' : 'Ajukan Pemeriksaan'}
    </Button>
  );
}

export default function FormPemeriksaan({
  sites, materials, saldoBySite, alasans,
}: {
  sites: Site[];
  materials: Material[];
  saldoBySite: Record<string, SaldoMap>; // site_id → material_id → saldo
  alasans: Alasan[];
}) {
  const [state, action] = useActionState(buatPemeriksaanAction, null as any);
  const today = new Date().toISOString().slice(0, 10);

  const [siteId, setSiteId] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  const saldo = siteId ? (saldoBySite[siteId] ?? {}) : {};

  // Daftar material yang punya saldo > 0 di site terpilih
  const materialsDenganSaldo = useMemo(
    () => materials.filter((m) => (saldo[m.id] ?? 0) !== 0 || rows.some((r) => r.material_id === m.id)),
    [materials, saldo, rows]
  );

  function pilihSite(id: string) {
    setSiteId(id);
    setRows([]);
  }

  function tambahRow() {
    setRows((r) => [...r, { material_id: '', jumlah_fisik: 0, alasan_kode: '', catatan: '' }]);
  }

  function pilihMaterial(idx: number, materialId: string) {
    const stok = saldo[materialId] ?? 0;
    setRows((r) => r.map((row, i) => i === idx ? {
      ...row, material_id: materialId, jumlah_fisik: stok,
    } : row));
  }

  function updateRow(idx: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, i) => i === idx ? { ...row, ...patch } : row));
  }

  function hapusRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
  }

  const itemsJson = useMemo(() => {
    return rows
      .filter((r) => r.material_id)
      .map((r) => ({
        material_id: r.material_id,
        stok_sistem: saldo[r.material_id] ?? 0,
        jumlah_fisik: r.jumlah_fisik,
        alasan_kode: r.alasan_kode,
        catatan: r.catatan,
      }));
  }, [rows, saldo]);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="items" value={JSON.stringify(itemsJson)} />

      <Card>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Site" required>
              <Select
                name="site_id" required
                value={siteId}
                onChange={(e) => pilihSite(e.target.value)}
              >
                <option value="" disabled>— Pilih Site —</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>
                ))}
              </Select>
            </Field>

            <Field label="Tanggal" required>
              <Input type="date" name="tanggal" defaultValue={today} required />
            </Field>

            <div className="md:col-span-3">
              <Field label="Catatan">
                <Textarea name="catatan" rows={2} placeholder="Ringkasan hasil pemeriksaan fisik" />
              </Field>
            </div>
          </div>
        </CardBody>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold">Material</h2>
            <p className="text-[12px] text-[color:var(--text-2)] mt-0.5">
              {siteId
                ? `Stok sistem dimuat dari site terpilih. Isi jumlah fisik dan alasan bila ada selisih.`
                : 'Pilih site untuk memulai.'}
            </p>
          </div>
          {siteId && (
            <Button type="button" variant="secondary" size="sm" onClick={tambahRow}>
              <Plus size={13} /> Tambah Material
            </Button>
          )}
        </div>

        {rows.length === 0 ? (
          <Card>
            <div className="py-10 text-center">
              <ClipboardCheck size={20} className="text-[color:var(--text-3)] mx-auto" />
              <p className="text-sm mt-3">{siteId ? 'Belum ada material' : 'Pilih site dahulu'}</p>
              <p className="text-[12px] text-[color:var(--text-2)] mt-1">
                {siteId ? 'Klik Tambah Material untuk mulai.' : 'Site menentukan stok sistem.'}
              </p>
            </div>
          </Card>
        ) : (
          <TableWrap className="bg-[color:var(--bg-elev)]">
            <THead>
              <TH>Material</TH>
              <TH align="right">Stok Sistem</TH>
              <TH align="right">Jumlah Fisik</TH>
              <TH align="right">Selisih</TH>
              <TH>Alasan</TH>
              <TH>Catatan</TH>
              <TH align="right">Aksi</TH>
            </THead>
            <TBody>
              {rows.map((r, idx) => {
                const stok = saldo[r.material_id] ?? 0;
                const selisih = +(r.jumlah_fisik - stok).toFixed(4);
                const perluAlasan = selisih !== 0 && r.material_id;
                return (
                  <TR key={idx}>
                    <TD>
                      <Select
                        value={r.material_id}
                        onChange={(e) => pilihMaterial(idx, e.target.value)}
                      >
                        <option value="">— Pilih Material —</option>
                        {materialsDenganSaldo.map((m) => (
                          <option key={m.id} value={m.id}>{m.kode} · {m.nama}</option>
                        ))}
                      </Select>
                    </TD>
                    <TD align="right" className="text-[color:var(--text-2)]">
                      {r.material_id ? stok.toLocaleString('id-ID') : '—'}
                    </TD>
                    <TD align="right">
                      <input
                        type="number" step="0.0001" min={0}
                        value={r.jumlah_fisik}
                        onChange={(e) => updateRow(idx, { jumlah_fisik: Number(e.target.value) })}
                        disabled={!r.material_id}
                        className="w-28 text-right rounded border border-[color:var(--border)] px-2 py-1 text-[13px] bg-transparent tnum focus-ring disabled:opacity-40"
                      />
                    </TD>
                    <TD align="right">
                      {r.material_id ? (
                        <Badge tone={selisih === 0 ? 'gray' : selisih > 0 ? 'green' : 'red'}>
                          {selisih > 0 ? '+' : ''}{selisih.toLocaleString('id-ID')}
                        </Badge>
                      ) : '—'}
                    </TD>
                    <TD>
                      <Select
                        value={r.alasan_kode}
                        onChange={(e) => updateRow(idx, { alasan_kode: e.target.value })}
                        disabled={!perluAlasan}
                        className={!perluAlasan ? 'opacity-50' : ''}
                      >
                        <option value="">—</option>
                        {alasans.map((a) => (
                          <option key={a.kode} value={a.kode}>{a.nama}</option>
                        ))}
                      </Select>
                    </TD>
                    <TD>
                      <input
                        value={r.catatan}
                        onChange={(e) => updateRow(idx, { catatan: e.target.value })}
                        placeholder="Catatan"
                        className="w-full rounded border border-[color:var(--border)] px-2 py-1 text-[13px] bg-transparent focus-ring"
                      />
                    </TD>
                    <TD align="right">
                      <Button
                        type="button" variant="ghost" size="sm"
                        onClick={() => hapusRow(idx)}
                        aria-label="Hapus"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </TableWrap>
        )}
      </section>

      {state?.error && <p className="text-sm text-red">{state.error}</p>}

      {itemsJson.length > 0 && (
        <div className="flex items-center gap-2">
          <Tombol />
          <span className="text-[12px] text-[color:var(--text-2)]">
            {itemsJson.length} material akan diperiksa
          </span>
        </div>
      )}
    </form>
  );
}