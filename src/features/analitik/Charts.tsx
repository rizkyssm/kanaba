'use client';
import {
  ComposedChart, Line, Bar, BarChart, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

const TONE = {
  blue:   '#0a84ff',
  orange: '#ff9500',
  green:  '#34c759',
  red:    '#ff3b30',
  purple: '#5e5ce6',
  pink:   '#ff2d55',
};

function rupiahShort(n: number) {
  if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1)} M`;
  if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(1)} jt`;
  if (n >= 1e3) return `Rp ${(n / 1e3).toFixed(0)} rb`;
  return `Rp ${n}`;
}

function shortNum(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}jt`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}rb`;
  return String(n);
}

const tooltipStyle = {
  background: 'var(--bg-elev)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontSize: 12,
  padding: '6px 10px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

// =============== Trend Combo Chart ===============
// Bars: BCM atau Lubang (kuantitas)
// Line: Biaya per satuan (efisiensi)
export function TrendComboChart({
  data,
  barLabel = 'BCM',
  lineLabel = 'Biaya / Satuan',
  showBiaya = true,
}: {
  data: { label: string; kuantitas: number; biayaPerSatuan?: number }[];
  barLabel?: string;
  lineLabel?: string;
  showBiaya?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--text-3)' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: 'var(--text-3)' }}
          axisLine={false} tickLine={false}
          tickFormatter={shortNum}
        />
        {showBiaya && (
          <YAxis
            yAxisId="right" orientation="right"
            tick={{ fontSize: 11, fill: 'var(--text-3)' }}
            axisLine={false} tickLine={false}
            tickFormatter={rupiahShort}
          />
        )}
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: any, name: any) => {
            if (name === lineLabel) return rupiahShort(Number(v));
            return shortNum(Number(v));
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
        <Bar
          yAxisId="left"
          dataKey="kuantitas"
          name={barLabel}
          fill={TONE.blue}
          fillOpacity={0.35}
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
        {showBiaya && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="biayaPerSatuan"
            name={lineLabel}
            stroke={TONE.blue}
            strokeWidth={2}
            dot={{ r: 3, fill: TONE.blue }}
            activeDot={{ r: 5 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// =============== Donut Chart ===============
export function DonutChart({
  data,
  colors = [TONE.blue, TONE.orange, TONE.purple, TONE.green, TONE.pink],
}: {
  data: { label: string; jumlah: number }[];
  colors?: string[];
}) {
  const total = data.reduce((s, d) => s + d.jumlah, 0);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="jumlah"
          nameKey="label"
          cx="50%"
          cy="45%"
          innerRadius={58}
          outerRadius={92}
          paddingAngle={2}
          stroke="var(--bg-elev)"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: any, n: any, p: any) => {
            const pct = total > 0 ? ((Number(v) / total) * 100).toFixed(0) : '0';
            return [`${Number(v)} (${pct}%)`, n];
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Legend di bawah donut, custom
export function DonutLegend({
  data,
  colors = [TONE.blue, TONE.orange, TONE.purple, TONE.green, TONE.pink],
}: {
  data: { label: string; jumlah: number }[];
  colors?: string[];
}) {
  const total = data.reduce((s, d) => s + d.jumlah, 0);
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 text-[12px]">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: colors[i % colors.length] }}
          />
          <span className="text-[color:var(--text-2)] flex-1 truncate">{d.label}</span>
          <span className="tnum font-medium">{d.jumlah}</span>
        </div>
      ))}
      {data.length === 0 && (
        <div className="text-[12px] text-[color:var(--text-3)] col-span-2">
          Belum ada data
        </div>
      )}
    </div>
  );
}

// =============== Ranked Bar List (seperti "Orders by Customer") ===============
export function RankedBarList({
  data,
  valueFormatter,
}: {
  data: { label: string; value: number }[];
  valueFormatter?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const fmt = valueFormatter ?? ((v: number) => v.toLocaleString('id-ID'));

  return (
    <div className="space-y-2.5">
      {data.length === 0 && (
        <div className="text-[12px] text-[color:var(--text-3)] py-6 text-center">
          Belum ada data
        </div>
      )}
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} className="grid grid-cols-[140px_1fr_auto] gap-3 items-center">
            <div className="text-[12px] text-[color:var(--text-2)] truncate" title={d.label}>
              {d.label}
            </div>
            <div className="h-2 rounded-full bg-[color:var(--bg-subtle)] overflow-hidden">
              <div
                className="h-full rounded-full bg-blue transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-[12px] tnum font-medium min-w-[40px] text-right">
              {fmt(d.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}