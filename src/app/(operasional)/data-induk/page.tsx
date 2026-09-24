import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import {
  MapPin, Package, Boxes, ClipboardList, Users, Ruler, Tag, Truck,
} from 'lucide-react';

export default async function DataIndukPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const org = ctx.organisasiId;

  const [
    { count: siteCount },
    { count: materialCount },
    { count: produkCount },
    { count: bomCount },
    { count: personelCount },
    { count: satuanCount },
    { count: kategoriCount },
    { count: asetCount },
  ] = await Promise.all([
    supabase.from('site').select('*', { count: 'exact', head: true }).eq('organisasi_id', org).eq('aktif', true),
    supabase.from('material').select('*', { count: 'exact', head: true }).eq('organisasi_id', org).eq('aktif', true),
    supabase.from('produk').select('*', { count: 'exact', head: true }).eq('organisasi_id', org).eq('aktif', true),
    supabase.from('bom').select('*', { count: 'exact', head: true }).eq('organisasi_id', org).eq('aktif', true),
    supabase.from('personel').select('*', { count: 'exact', head: true }).eq('organisasi_id', org).eq('aktif', true),
    supabase.from('satuan').select('*', { count: 'exact', head: true }).eq('organisasi_id', org),
    supabase.from('kategori_material').select('*', { count: 'exact', head: true }).eq('organisasi_id', org),
    supabase.from('aset').select('*', { count: 'exact', head: true }).eq('organisasi_id', org),
  ]);

  const MODUL = [
    { href: '/data-induk/site',              label: 'Site',              count: siteCount ?? 0,     icon: MapPin },
    { href: '/data-induk/material',          label: 'Material',          count: materialCount ?? 0, icon: Package },
    { href: '/data-induk/produk',            label: 'Produk',            count: produkCount ?? 0,   icon: Boxes },
    { href: '/data-induk/bom',               label: 'BOM',               count: bomCount ?? 0,      icon: ClipboardList },
    { href: '/data-induk/personel',          label: 'Personel',          count: personelCount ?? 0, icon: Users },
    { href: '/data-induk/satuan',            label: 'Satuan',            count: satuanCount ?? 0,   icon: Ruler },
    { href: '/data-induk/kategori-material', label: 'Kategori Material', count: kategoriCount ?? 0, icon: Tag },
    { href: '/aset',                         label: 'Aset',              count: asetCount ?? 0,     icon: Truck },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Induk"
        subtitle="Data referensi yang digunakan di seluruh platform KANABA."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {MODUL.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.href} href={m.href} className="group">
              <Card className="h-full transition group-hover:border-blue group-hover:shadow-[var(--shadow-xs)]">
                <CardBody className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="text-[13px] font-medium text-[color:var(--text-2)]">
                      {m.label}
                    </div>
                    <div className="w-7 h-7 rounded-[var(--radius-md)] bg-[color:var(--bg-subtle)] text-[color:var(--text-2)] flex items-center justify-center">
                      <Icon size={14} />
                    </div>
                  </div>
                  <div className="mt-3 text-[26px] font-semibold leading-none tnum tracking-tight">
                    {m.count}
                  </div>
                  <div className="mt-1.5 text-[11px] text-[color:var(--text-3)]">
                    {m.count === 0 ? 'Belum ada data' : 'Aktif'}
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}