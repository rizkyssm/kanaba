import Link from 'next/link';

export type RankedKolom = {
  key: string;
  label: string;
  align?: 'left' | 'right';
  render?: (row: any) => React.ReactNode;
  primary?: boolean;
};

export function RankedTable({
  judul,
  link,
  kolom,
  rows,
}: {
  judul: string;
  link?: string;
  kolom: RankedKolom[];
  rows: any[];
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border bg-[color:var(--bg-elev)] flex flex-col">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div className="text-[14px] font-semibold">{judul}</div>
        {link && (
          <Link href={link} className="text-[12px] text-blue hover:underline">
            Lihat semua →
          </Link>
        )}
      </div>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr>
              {kolom.map((k) => (
                <th
                  key={k.key}
                  className={
                    'px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--text-3)] border-b border-[color:var(--border)] whitespace-nowrap ' +
                    (k.align === 'right' ? 'text-right' : 'text-left')
                  }
                >
                  {k.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={kolom.length} className="px-4 py-8 text-center text-[12px] text-[color:var(--text-3)]">
                  Belum ada data
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="hover:bg-[color:var(--bg-hover)]/50">
                  {kolom.map((k) => (
                    <td
                      key={k.key}
                      className={
                        'px-4 py-2.5 text-[12px] border-b border-[color:var(--border-soft)] align-middle ' +
                        (k.align === 'right' ? 'text-right tnum' : 'text-left') +
                        (k.primary ? ' font-medium' : ' text-[color:var(--text-2)]')
                      }
                    >
                      {k.render ? k.render(r) : r[k.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}