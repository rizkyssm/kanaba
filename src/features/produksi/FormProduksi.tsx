'use client';
import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { buatProduksiAction } from './actions';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Package } from 'lucide-react';

type Produk = { id: string; kode: string; nama: string };
type Site = { id: string; kode: string; nama: string };
type BomItem = { material_id: string; kode: string; nama: string; jumlah_per_unit: number };
type BomMap = Record<string, { bom_id: string; nama: string; items: BomItem[] }>;

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Menyimpan…' : 'Simpan Produksi'}
    </Button>
  );
}

export default function FormProduksi({
  produks, bomsByProduk, sites,
}: { produks: Produk[]; bomsByProduk: BomMap; sites: Site[] }) {
  const [state, action] = useActionState(buatProduksiAction, null as any);
  const today = new Date().toISOString().slice(0, 10);

  const [produkId, setProdukId] = useState('');
  const [jumlah, setJumlah] = useState(1);
  const [hasilBaik, setHasilBaik] = useState(1);
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  const bom = produkId ? bomsByProduk[produkId] : null;

  const items = useMemo(() => {
    if (!bom) return [];
    return bom.items.map((it) => ({
      material_id: it.material_id,
      kode: it.kode,
      nama: it.nama,
      jumlah: overrides[it.material_id] ?? +(it.jumlah_per_unit * jumlah).toFixed(4),
    }));
  }, [bom, jumlah, overrides]);

  function pilihProduk(id: string) {
    setProdukId(id);
    setOverrides({});
  }

  function updateJumlahMaterial(materialId: string, val: number) {
    setOverrides((o) => ({ ...o, [materialId]: val }));
  }

  function resetOverride(materialId: string) {
    setOverrides((o) => {
      const next = { ...o };
      delete next[materialId];
      return next;
    });
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="items" value={JSON.stringify(items.map(({ material_id, jumlah }) => ({ material_id, jumlah })))} />

      <Card>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Produk" required>
              <Select
                name="produk_id"
                required
                value={produkId}
                onChange={(e) => pilihProduk(e.target.value)}
              >
                <option value="" disabled>— Pilih Produk —</option>
                {produks.map((p) => (
                  <option key={p.id} value={p.id}>{p.kode} · {p.nama}</option>
                ))}
              </Select>
            </Field>

            <Field label="Site (opsional)">
              <Select name="site_id" defaultValue="">
                <option value="">— Tidak ditentukan —</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.kode} · {s.nama}</option>
                ))}
              </Select>
            </Field>

            <Field label="Tanggal" required>
              <Input type="date" name="tanggal" defaultValue={today} required />
            </Field>

            <Field label="Jumlah Produksi" required>
              <Input
                type="number" step="0.0001" min={0.0001}
                name="jumlah_produksi"
                value={jumlah}
                onChange={(e) => setJumlah(Number(e.target.value))}
                required
              />
            </Field>

            <Field label="Hasil Baik" required>
              <Input
                type="number" step="0.0001" min={0}
                name="hasil_baik"
                value={hasilBaik}
                onChange={(e) => setHasilBaik(Number(e.target.value))}
                required
              />
            </Field>

            <Field label="BOM (opsional)">
              <Input name="bom_id" value={bom?.bom_id ?? ''} readOnly placeholder="— Tanpa BOM —" />
            </Field>

            <div className="md:col-span-3">
              <Field label="Catatan">
                <Textarea name="catatan" rows={2} />
              </Field>
            </div>
          </div>
        </CardBody>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="text-[15px] font-semibold">Material Terpakai</h2>
          <p className="text-[12px] text-[color:var(--text-2)] mt-0.5">
            {bom ? `Dihitung dari BOM: ${bom.nama} × ${jumlah}` : 'Pilih produk untuk memuat BOM.'}
          </p>
        </div>

        {items.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Package size={20} />}
              title={bom ? 'BOM tidak punya material' : 'BOM belum dipilih'}
              description={bom ? 'Lengkapi BOM di Data Induk → BOM.' : 'Pilih produk yang punya BOM aktif.'}
            />
          </Card>
        ) : (
          <TableWrap className="bg-[color:var(--bg-elev)]">
            <THead>
              <TH>Material</TH>
              <TH align="right">Jumlah</TH>
              <TH align="right">Aksi</TH>
            </THead>
            <TBody>
              {items.map((it) => {
                const isOverride = it.material_id in overrides;
                return (
                  <TR key={it.material_id}>
                    <TD>
                      <span className="font-mono text-[12px] text-[color:var(--text-2)]">{it.kode}</span>
                      <span className="mx-1.5 text-[color:var(--text-3)]">·</span>
                      <span className="font-medium">{it.nama}</span>
                    </TD>
                    <TD align="right">
                      <input
                        type="number" step="0.0001" min={0.0001}
                        value={it.jumlah}
                        onChange={(e) => updateJumlahMaterial(it.material_id, Number(e.target.value))}
                        className="w-32 text-right rounded border border-[color:var(--border)] px-2 py-1 text-[13px] bg-transparent tnum focus-ring"
                      />
                    </TD>
                    <TD align="right">
                      {isOverride && (
                        <button
                          type="button"
                          onClick={() => resetOverride(it.material_id)}
                          className="text-[12px] text-blue hover:underline"
                        >
                          Reset
                        </button>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </TableWrap>
        )}
      </section>

      {state?.error && <p className="text-sm text-red">{state.error}</p>}

      <div className="flex items-center gap-2">
        <Tombol />
      </div>
    </form>
  );
}