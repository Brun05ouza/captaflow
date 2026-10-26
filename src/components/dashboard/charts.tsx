'use client';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { temperatureLabels, sourceLabel } from '@/lib/utils';
import { stages } from '@/features/leads/validation';
const colors = [
  'var(--primary)',
  'var(--accent)',
  'var(--chart-muted)',
  'var(--chart-light)',
  'var(--deep)',
];
export function CaptureChart({ data }: { data: { day: string; value: number }[] }) {
  return (
    <div
      className="chart"
      role="img"
      aria-label={`Evolução diária: ${data.reduce((s, d) => s + d.value, 0)} leads captados no período.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -28 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            minTickGap={30}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
            formatter={(v) => [v, 'Leads']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export function SourceChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div
      className="chart source-chart"
      role="img"
      aria-label={
        data.map((d) => `${sourceLabel(d.name)}: ${d.value}`).join('; ') ||
        'Nenhuma origem registrada'
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 0 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            interval={0}
            tickFormatter={(value: string) =>
              value === 'Live Experience' ? 'QR Code (demo)' : value
            }
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
          <Tooltip
            cursor={{ fill: 'var(--background)' }}
            labelFormatter={(value)=>sourceLabel(String(value))}
            formatter={(v) => [v, 'Leads']}
            contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
          />
          <Bar
            dataKey="value"
            radius={[0, 3, 3, 0]}
            barSize={14}
            isAnimationActive={false}
            label={{ position: 'right', fill: 'var(--muted-foreground)', fontSize: 11 }}
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Distribution({
  data,
  type,
  total,
}: {
  data: { name: string; value: number }[];
  type: 'temperature' | 'stage';
  total: number;
}) {
  const labels = type === 'temperature' ? temperatureLabels : stages;
  const keys =
    type === 'temperature' ? ['hot', 'warm', 'cold', 'insufficient'] : Object.keys(stages);
  return (
    <div className="distribution">
      {keys.map((key, i) => {
        const value = data.find((d) => d.name === key)?.value || 0;
        return (
          <div className="distribution-row" key={key}>
            <span>{labels[key as keyof typeof labels] || key}</span>
            <div className="distribution-track">
              <div
                style={{
                  width: `${total ? (value / total) * 100 : 0}%`,
                  background:
                    type === 'temperature'
                      ? key === 'insufficient'
                        ? 'var(--chart-muted)'
                        : `var(--temperature-${key})`
                      : colors[i],
                }}
              />
            </div>
            <strong>{value}</strong>
            <small>{total ? Math.round((value / total) * 100) : 0}%</small>
          </div>
        );
      })}
    </div>
  );
}
