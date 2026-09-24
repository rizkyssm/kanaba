'use server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { catatLog } from '@/lib/audit';
import { kirimNotifikasiRpc } from '@/lib/notifikasi/helper';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const Skema = z.object({
  tanggal: z.string().min(10),
  site_id: z.string().uuid().optional().or(z.literal('')),
  kegiatan_id: z.string().uuid().optional().or(z.literal('')),
  kategori_biaya_id: z.string().uuid('Kategori wajib'),
  pusat_biaya_id: z.string().uuid().optional().or(z.literal('')),
  vendor_id: z.string().uuid().optional().or(z.literal('')),
  jenis: z.enum(['langsung', 'tidak_langsung']),
  klasifikasi: z.enum(['opex', 'capex']),
  nilai: z.coerce.number().min(0),
  cara_pembayaran: z.enum(['tunai', 'transfer', 'hutang', 'lainnya']),
  catatan: z.string().max(500).optional().or(z.literal('')),
});

// =========================================================================
// Buat pengeluaran baru
// =========================================================================
export async function buatPengeluaranAction(_prev: any, formData: FormData) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'biaya.kelola')) return { error: 'Tidak berhak.' };

  const parsed = Skema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data: nomor, error: nomorErr } = await supabase.rpc('gen_nomor_dokumen', {
    p_org: ctx.organisasiId,
    p_prefix: 'PGL',
    p_tabel: 'pengeluaran',
  });
  if (nomorErr || !nomor) return { error: 'Gagal membuat nomor.' };

  const { data, error } = await supabase
    .from('pengeluaran')
    .insert({
      organisasi_id: ctx.organisasiId,
      nomor,
      tanggal: parsed.data.tanggal,
      site_id: parsed.data.site_id || null,
      kegiatan_id: parsed.data.kegiatan_id || null,
      kategori_biaya_id: parsed.data.kategori_biaya_id,
      pusat_biaya_id: parsed.data.pusat_biaya_id || null,
      vendor_id: parsed.data.vendor_id || null,
      jenis: parsed.data.jenis,
      klasifikasi: parsed.data.klasifikasi,
      nilai: parsed.data.nilai,
      cara_pembayaran: parsed.data.cara_pembayaran,
      status: 'draf',
      catatan: parsed.data.catatan || null,
      dibuat_oleh: ctx.userId,
    })
    .select('id')
    .single();
  if (error) return { error: error.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: 'pengeluaran.buat',
    entitas: 'pengeluaran',
    entitasId: data.id,
    sesudah: { nomor, nilai: parsed.data.nilai },
  });

  revalidatePath('/biaya');
  revalidatePath('/biaya/pengeluaran');
  redirect(`/biaya/pengeluaran/${data.id}`);
}

// =========================================================================
// Transisi status (approval flow) — kirim notifikasi sesuai tahap
// =========================================================================
export async function transisiPengeluaranAction(
  id: string,
  statusBaru: string,
  catatan?: string
) {
  const ctx = await getKonteks();
  if (!ctx || !punya(ctx, 'biaya.kelola')) return { error: 'Tidak berhak.' };

  const supabase = await createClient();

  // Ambil data pengeluaran sebelumnya untuk konteks notifikasi
  const { data: sebelum } = await supabase
    .from('pengeluaran')
    .select('nomor, nilai, status')
    .eq('id', id)
    .eq('organisasi_id', ctx.organisasiId)
    .single();

  if (!sebelum) return { error: 'Pengeluaran tidak ditemukan.' };

  const { data, error } = await supabase.rpc('transisi_status_pengeluaran', {
    p_id: id,
    p_status_baru: statusBaru,
    p_catatan: catatan || null,
  });
  if (error) return { error: error.message };

  await catatLog({
    organisasiId: ctx.organisasiId,
    aksi: `pengeluaran.${statusBaru}`,
    entitas: 'pengeluaran',
    entitasId: id,
    sebelum: { status: sebelum.status },
    sesudah: { status: statusBaru, catatan: catatan ?? null },
  });

  // ---- Notifikasi sesuai transisi ----
  try {
    if (statusBaru === 'diajukan') {
      await kirimNotifikasiRpc({
        organisasiId: ctx.organisasiId,
        hak: 'biaya.lihat_rinci',
        tipe: 'persetujuan',
        judul: `Pengeluaran ${sebelum.nomor} menunggu verifikasi`,
        pesan: `Dokumen menunggu verifikasi operasional.`,
        tautan: `/biaya/pengeluaran/${id}`,
        entitas: 'pengeluaran',
        entitasId: id,
      });
    } else if (statusBaru === 'diverifikasi_keuangan') {
      await kirimNotifikasiRpc({
        organisasiId: ctx.organisasiId,
        hak: 'biaya.kelola',
        tipe: 'persetujuan',
        judul: `Pengeluaran ${sebelum.nomor} siap disetujui`,
        pesan: 'Verifikasi keuangan selesai, menunggu persetujuan.',
        tautan: `/biaya/pengeluaran/${id}`,
        entitas: 'pengeluaran',
        entitasId: id,
      });
    } else if (statusBaru === 'disetujui') {
      await kirimNotifikasiRpc({
        organisasiId: ctx.organisasiId,
        hak: 'biaya.kelola',
        tipe: 'info',
        judul: `Pengeluaran ${sebelum.nomor} disetujui`,
        pesan: 'Dokumen disetujui, siap untuk dibayar.',
        tautan: `/biaya/pengeluaran/${id}`,
        entitas: 'pengeluaran',
        entitasId: id,
      });
    } else if (statusBaru === 'ditolak') {
      await kirimNotifikasiRpc({
        organisasiId: ctx.organisasiId,
        hak: 'biaya.kelola',
        tipe: 'peringatan',
        judul: `Pengeluaran ${sebelum.nomor} ditolak`,
        pesan: catatan || 'Dokumen ditolak.',
        tautan: `/biaya/pengeluaran/${id}`,
        entitas: 'pengeluaran',
        entitasId: id,
      });
    } else if (statusBaru === 'dibayar') {
      await kirimNotifikasiRpc({
        organisasiId: ctx.organisasiId,
        hak: 'biaya.kelola',
        tipe: 'info',
        judul: `Pengeluaran ${sebelum.nomor} dibayar`,
        pesan: 'Pembayaran tercatat, menunggu pembukuan.',
        tautan: `/biaya/pengeluaran/${id}`,
        entitas: 'pengeluaran',
        entitasId: id,
      });
    } else if (statusBaru === 'dibukukan') {
      await kirimNotifikasiRpc({
        organisasiId: ctx.organisasiId,
        hak: 'biaya.kelola',
        tipe: 'info',
        judul: `Pengeluaran ${sebelum.nomor} selesai`,
        pesan: 'Dokumen telah dibukukan. Proses selesai.',
        tautan: `/biaya/pengeluaran/${id}`,
        entitas: 'pengeluaran',
        entitasId: id,
      });
    }
  } catch {
    // notifikasi tidak boleh memblokir flow utama
  }

  revalidatePath('/biaya');
  revalidatePath('/biaya/pengeluaran');
  revalidatePath(`/biaya/pengeluaran/${id}`);
  return { sukses: true, status: data };
}