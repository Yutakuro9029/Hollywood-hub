"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Award,
  BarChart3,
  Calendar,
  Filter,
  Globe2,
  PieChart as PieIcon,
  Star,
  Tags,
  TrendingUp,
  X,
} from "lucide-react";

/* ======================================================================
 * Types (ข้อมูลที่ Server Component ส่งมา — ต้อง serialize ได้)
 * ==================================================================== */

export type ChartMovie = {
  id: number;
  title: string;
  actorId: number;
  genres: string[];
  year: number | null;
  box: number; // ล้านดอลลาร์
  rating: number | null;
};

export type ChartActor = {
  id: number;
  name: string;
  nationality: string | null;
  awards: number;
};

/* ======================================================================
 * Helpers
 * ==================================================================== */

type Fmt = "money" | "int" | "rating";

const COLORS = [
  "#fbbf24", "#0ea5e9", "#8b5cf6", "#10b981",
  "#f43f5e", "#f97316", "#14b8a6", "#d946ef",
];
const OTHER = "#a1a1aa";
const AMBER = "#fbbf24";

const money = (m: number) =>
  m >= 1000 ? `$${(m / 1000).toFixed(2)}B` : `$${m.toFixed(m < 100 ? 1 : 0)}M`;

const fmt = (kind: Fmt, n: number) =>
  kind === "money" ? money(n) : kind === "rating" ? n.toFixed(1) : n.toLocaleString("en-US");

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

function tally(items: string[]) {
  const map = new Map<string, number>();
  for (const i of items) map.set(i, (map.get(i) ?? 0) + 1);
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

const card = "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-slate-900";

// สีแกน/กริดอิง currentColor เพื่อให้เปลี่ยนตาม Light/Dark อัตโนมัติ
const axisProps = {
  tick: { fontSize: 11, fill: "currentColor" },
  axisLine: false,
  tickLine: false,
} as const;
const grid = { stroke: "currentColor", strokeOpacity: 0.12 } as const;

/* ======================================================================
 * Shared UI
 * ==================================================================== */

function Panel({
  title, subtitle, icon: Icon, tone, action, className = "", children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${card} flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            <Icon size={18} className={tone} />
            <span className="truncate">{title}</span>
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="flex-1 p-5 text-zinc-500 dark:text-zinc-400">{children}</div>
    </section>
  );
}

function Empty() {
  return (
    <p className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
      ไม่มีข้อมูลตรงกับตัวกรองที่เลือก
    </p>
  );
}

function Segmented<T extends string>({
  value, options, onChange,
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex shrink-0 rounded-lg border border-zinc-300 p-0.5 text-xs dark:border-zinc-700">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1 font-medium transition ${
            value === o.value
              ? "bg-amber-400 text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Tooltips ---------- */

const tipBox =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 shadow-lg dark:border-zinc-700 dark:bg-slate-800 dark:text-zinc-100";

type TipEntry = {
  name?: string | number;
  value?: number | string;
  payload?: { extra?: string[]; [k: string]: unknown };
};

function Tip({
  active, payload, label, kind = "int",
}: {
  active?: boolean;
  payload?: readonly TipEntry[];
  label?: string | number;
  kind?: Fmt;
}) {
  if (!active || !payload?.length) return null;
  const extra = payload[0]?.payload?.extra;
  return (
    <div className={tipBox}>
      {label !== undefined && label !== "" && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p, i) => (
        <p key={i}>
          {p.name}: <span className="font-semibold">{fmt(kind, Number(p.value))}</span>
        </p>
      ))}
      {extra && extra.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 border-t border-zinc-200 pt-1.5 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {extra.slice(0, 6).map((t) => (
            <li key={t}>• {t}</li>
          ))}
          {extra.length > 6 && <li>… และอีก {extra.length - 6} เรื่อง</li>}
        </ul>
      )}
    </div>
  );
}

type ScatterDatum = { title: string; rating: number; box: number; actor: string; year: number | null };

function ScatterTip({ active, payload }: { active?: boolean; payload?: readonly { payload?: ScatterDatum }[] }) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <div className={tipBox}>
      <p className="font-semibold">{d.title}</p>
      <p className="text-zinc-500 dark:text-zinc-400">
        {d.actor}
        {d.year ? ` · ${d.year}` : ""}
      </p>
      <p className="mt-1">
        เรตติ้ง <span className="font-semibold">{d.rating.toFixed(1)}</span> · Box Office{" "}
        <span className="font-semibold">{money(d.box)}</span>
      </p>
    </div>
  );
}

/* ---------- Donut ---------- */

function Donut({
  data, centerLabel, selected, onSelect,
}: {
  data: { name: string; value: number; other?: boolean }[];
  centerLabel: string;
  selected?: string | null;
  onSelect?: (name: string) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <Empty />;

  const hovered = hover !== null ? data[hover] : null;
  const colorAt = (i: number) => (data[i].other ? OTHER : COLORS[i % COLORS.length]);
  const dimmed = (i: number) =>
    hover !== null ? hover !== i : selected ? data[i].name !== selected : false;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
              onMouseEnter={(_, i) => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={(_, i) => {
                if (onSelect && !data[i].other) onSelect(data[i].name);
              }}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.name}
                  fill={colorAt(i)}
                  fillOpacity={dimmed(i) ? 0.3 : 1}
                  cursor={onSelect && !d.other ? "pointer" : "default"}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {hovered ? hovered.value : total}
          </span>
          <span className="max-w-[5.5rem] truncate text-[10px]">
            {hovered ? hovered.name : centerLabel}
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-1 text-sm">
        {data.map((d, i) => {
          const active = selected === d.name;
          const clickable = !!onSelect && !d.other;
          return (
            <li key={d.name}>
              <button
                type="button"
                disabled={!clickable}
                aria-pressed={clickable ? active : undefined}
                onClick={() => onSelect?.(d.name)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition ${
                  active ? "bg-amber-400/10" : clickable ? "hover:bg-zinc-100 dark:hover:bg-zinc-800" : ""
                } ${dimmed(i) ? "opacity-50" : ""}`}
              >
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: colorAt(i) }} />
                <span className="min-w-0 flex-1 truncate text-zinc-800 dark:text-zinc-100">{d.name}</span>
                <span className="shrink-0 tabular-nums">
                  {d.value} · {Math.round((d.value / total) * 100)}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Horizontal bar ---------- */

type BarDatum = { key: string; name: string; value: number; color: string; active?: boolean; extra?: string[] };

function HBar({
  data, kind, seriesName, domain, onPick,
}: {
  data: BarDatum[];
  kind: Fmt;
  seriesName: string;
  domain?: [number, number];
  onPick?: (key: string) => void;
}) {
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 46)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 4 }}>
        <CartesianGrid {...grid} horizontal={false} />
        <XAxis type="number" domain={domain} tickFormatter={(v: number) => fmt(kind, v)} {...axisProps} />
        <YAxis
          type="category"
          dataKey="name"
          width={112}
          tickFormatter={(v: string) => truncate(v, 15)}
          {...axisProps}
        />
        <Tooltip cursor={{ fill: "currentColor", fillOpacity: 0.06 }} content={<Tip kind={kind} />} />
        <Bar
          dataKey="value"
          name={seriesName}
          radius={[0, 6, 6, 0]}
          cursor={onPick ? "pointer" : "default"}
          onClick={(_, i) => onPick?.(data[i].key)}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={d.color} fillOpacity={d.active === false ? 0.25 : 1} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            fill="currentColor"
            fontSize={11}
            formatter={(v: unknown) => fmt(kind, Number(v))}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------- Column ---------- */

function Column({
  data, kind, seriesName, onPick,
}: {
  data: BarDatum[];
  kind: Fmt;
  seriesName: string;
  onPick?: (key: string) => void;
}) {
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 22, right: 8, bottom: 4, left: -8 }}>
        <CartesianGrid {...grid} vertical={false} />
        <XAxis dataKey="name" interval={0} tickFormatter={(v: string) => truncate(v, 9)} {...axisProps} />
        <YAxis allowDecimals={false} tickFormatter={(v: number) => fmt(kind, v)} {...axisProps} />
        <Tooltip cursor={{ fill: "currentColor", fillOpacity: 0.06 }} content={<Tip kind={kind} />} />
        <Bar
          dataKey="value"
          name={seriesName}
          radius={[6, 6, 0, 0]}
          maxBarSize={56}
          cursor={onPick ? "pointer" : "default"}
          onClick={(_, i) => onPick?.(data[i].key)}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={d.color} fillOpacity={d.active === false ? 0.25 : 1} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            fill="currentColor"
            fontSize={11}
            formatter={(v: unknown) => fmt(kind, Number(v))}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ======================================================================
 * Main component
 * ==================================================================== */

const BUCKETS = [
  { name: "< 5", test: (r: number) => r < 5 },
  { name: "5–5.9", test: (r: number) => r >= 5 && r < 6 },
  { name: "6–6.9", test: (r: number) => r >= 6 && r < 7 },
  { name: "7–7.9", test: (r: number) => r >= 7 && r < 8 },
  { name: "8–8.9", test: (r: number) => r >= 8 && r < 9 },
  { name: "9–10", test: (r: number) => r >= 9 },
];

export default function DashboardCharts({
  movies,
  actors,
}: {
  movies: ChartMovie[];
  actors: ChartActor[];
}) {
  const [selected, setSelected] = useState<number[]>([]); // ดาราที่เลือก (ว่าง = ทั้งหมด)
  const [genre, setGenre] = useState<string | null>(null);
  const [metric, setMetric] = useState<"box" | "count">("box");
  const [mode, setMode] = useState<"area" | "bar">("area");

  const colorMap = useMemo(
    () => new Map(actors.map((a, i) => [a.id, COLORS[i % COLORS.length]])),
    [actors],
  );
  const colorOf = (id: number) => colorMap.get(id) ?? OTHER;
  const isActive = (id: number) => selected.length === 0 || selected.includes(id);

  const toggleActor = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleGenre = (g: string) => setGenre((cur) => (cur === g ? null : g));
  const reset = () => {
    setSelected([]);
    setGenre(null);
  };

  /* ---- ชุดข้อมูลหลังกรอง ---- */
  // byGenre: กรองเฉพาะ genre (ใช้กับกราฟรายดารา เพื่อให้คลิกเลือกดาราอื่นได้)
  const byGenre = useMemo(
    () => (genre ? movies.filter((m) => m.genres.includes(genre)) : movies),
    [movies, genre],
  );
  // byActor: กรองเฉพาะดารา (ใช้กับ donut genre เพื่อให้เปลี่ยน genre ได้)
  const byActor = useMemo(
    () => (selected.length ? movies.filter((m) => selected.includes(m.actorId)) : movies),
    [movies, selected],
  );
  // filtered: กรองทั้งสองอย่าง
  const filtered = useMemo(
    () => (genre ? byActor.filter((m) => m.genres.includes(genre)) : byActor),
    [byActor, genre],
  );

  /* ---- Summary ---- */
  const summary = useMemo(() => {
    const rated = filtered.flatMap((m) => (m.rating === null ? [] : [m.rating]));
    return {
      count: filtered.length,
      box: filtered.reduce((s, m) => s + m.box, 0),
      rating: avg(rated),
    };
  }, [filtered]);

  /* ---- รายปี ---- */
  const yearData = useMemo(() => {
    const map = new Map<number, { box: number; count: number }>();
    for (const m of filtered) {
      if (m.year === null) continue;
      const cur = map.get(m.year) ?? { box: 0, count: 0 };
      cur.box += m.box;
      cur.count += 1;
      map.set(m.year, cur);
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, v]) => ({ year: String(year), ...v }));
  }, [filtered]);

  /* ---- Genre donut (top 6 + อื่นๆ) ---- */
  const genreData = useMemo(() => {
    const all = tally(byActor.flatMap((m) => m.genres));
    const top: { name: string; value: number; other?: boolean }[] = all.slice(0, 6);
    // ถ้ากำลังกรอง genre ที่อยู่นอก top 6 ให้ยังแสดงเป็นชิ้นของตัวเอง
    if (genre && !top.some((t) => t.name === genre)) {
      const found = all.find((a) => a.name === genre);
      if (found) top.push(found);
    }
    const shown = new Set(top.map((t) => t.name));
    const rest = all.filter((a) => !shown.has(a.name)).reduce((s, a) => s + a.value, 0);
    if (rest > 0) top.push({ name: "อื่นๆ", value: rest, other: true });
    return top;
  }, [byActor, genre]);

  /* ---- Box office / จำนวนหนัง / เรตติ้งเฉลี่ย ต่อดารา ---- */
  const perActor = useMemo(
    () =>
      actors.map((a) => {
        const ms = byGenre.filter((m) => m.actorId === a.id);
        const rated = ms.flatMap((m) => (m.rating === null ? [] : [m.rating]));
        return {
          id: a.id,
          name: a.name,
          awards: a.awards,
          nationality: a.nationality,
          box: ms.reduce((s, m) => s + m.box, 0),
          avgRating: avg(rated),
        };
      }),
    [actors, byGenre],
  );

  const boxBars: BarDatum[] = useMemo(
    () =>
      [...perActor]
        .sort((a, b) => b.box - a.box)
        .map((a) => ({
          key: String(a.id), name: a.name, value: a.box,
          color: colorOf(a.id), active: isActive(a.id),
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [perActor, selected, colorMap],
  );

  const awardBars: BarDatum[] = useMemo(
    () =>
      [...actors]
        .sort((a, b) => b.awards - a.awards)
        .slice(0, 8)
        .map((a) => ({
          key: String(a.id), name: a.name.split(" ")[0], value: a.awards,
          color: colorOf(a.id), active: isActive(a.id),
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actors, selected, colorMap],
  );

  const ratingBars: BarDatum[] = useMemo(
    () =>
      perActor
        .flatMap((a) => (a.avgRating === null ? [] : [{ ...a, avgRating: a.avgRating }]))
        .sort((a, b) => b.avgRating - a.avgRating)
        .map((a) => ({
          key: String(a.id), name: a.name, value: a.avgRating,
          color: colorOf(a.id), active: isActive(a.id),
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [perActor, selected, colorMap],
  );

  /* ---- Scatter: แยกซีรีส์ตามดารา ---- */
  const scatter = useMemo(() => {
    const series = actors
      .map((a) => ({
        id: a.id,
        name: a.name,
        color: colorOf(a.id),
        data: filtered.flatMap((m): ScatterDatum[] =>
          m.actorId === a.id && m.rating !== null
            ? [{ title: m.title, rating: m.rating, box: m.box, actor: a.name, year: m.year }]
            : [],
        ),
      }))
      .filter((s) => s.data.length > 0);
    const xs = series.flatMap((s) => s.data.map((d) => d.rating));
    const domain: [number, number] = xs.length
      ? [Math.max(0, Math.floor(Math.min(...xs) - 0.5)), Math.min(10, Math.ceil(Math.max(...xs) + 0.5))]
      : [0, 10];
    return { series, domain };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actors, filtered, colorMap]);

  /* ---- Histogram เรตติ้ง (tooltip แสดงรายชื่อหนังในช่วง) ---- */
  const histogram: BarDatum[] = useMemo(() => {
    const rated = filtered.flatMap((m) => (m.rating === null ? [] : [{ ...m, rating: m.rating }]));
    return BUCKETS.map((b) => {
      const inBucket = rated.filter((m) => b.test(m.rating));
      return {
        key: b.name, name: b.name, value: inBucket.length, color: "#0ea5e9",
        extra: inBucket.map((m) => `${m.title} (${m.rating.toFixed(1)})`),
      };
    });
  }, [filtered]);

  /* ---- รายทศวรรษ ---- */
  const decades: BarDatum[] = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const m of filtered) {
      if (m.year === null) continue;
      const d = Math.floor(m.year / 10) * 10;
      map.set(d, [...(map.get(d) ?? []), m.title]);
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([d, titles]) => ({
        key: String(d), name: `${d}s`, value: titles.length, color: "#8b5cf6", extra: titles,
      }));
  }, [filtered]);

  /* ---- สัญชาติ ---- */
  const nationalityData = useMemo(
    () => tally(actors.filter((a) => isActive(a.id)).map((a) => a.nationality ?? "ไม่ระบุ")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actors, selected],
  );

  const hasFilter = selected.length > 0 || genre !== null;

  const chip = (on: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
      on
        ? "border-amber-400 bg-amber-400/10 text-amber-700 dark:text-amber-300"
        : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    }`;

  return (
    <div className="space-y-6">
      {/* ---------------- Filter bar ---------------- */}
      <section className={`${card} p-4`} aria-label="ตัวกรองกราฟ">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-medium">
            <Filter size={16} className="text-amber-400" /> ตัวกรอง
          </span>

          {actors.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={selected.includes(a.id)}
              onClick={() => toggleActor(a.id)}
              className={chip(selected.includes(a.id))}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: colorOf(a.id) }} />
              {a.name}
            </button>
          ))}

          {genre && (
            <button type="button" onClick={() => setGenre(null)} className={chip(true)}>
              <Tags size={12} /> {genre} <X size={12} />
            </button>
          )}

          {hasFilter && (
            <button
              type="button"
              onClick={reset}
              className="ml-auto text-xs font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>

        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          กำลังแสดง <span className="font-semibold text-zinc-800 dark:text-zinc-100">{summary.count}</span> /{" "}
          {movies.length} เรื่อง · Box Office{" "}
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">{money(summary.box)}</span> · เรตติ้งเฉลี่ย{" "}
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">
            {summary.rating !== null ? summary.rating.toFixed(2) : "-"}
          </span>
          <span className="ml-2 hidden sm:inline">
            · คลิกชื่อดารา, แท่งกราฟ หรือชิ้น Genre เพื่อกรองทุกกราฟ
          </span>
        </p>
      </section>

      {/* ---------------- Row 1 ---------------- */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="แนวโน้มรายปีที่ฉาย"
          subtitle="ลากแถบด้านล่างเพื่อซูมช่วงปี"
          icon={TrendingUp}
          tone="text-amber-400"
          className="xl:col-span-2"
          action={
            <div className="flex flex-wrap justify-end gap-2">
              <Segmented
                value={metric}
                onChange={setMetric}
                options={[
                  { value: "box", label: "Box Office" },
                  { value: "count", label: "จำนวนหนัง" },
                ]}
              />
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: "area", label: "เส้น" },
                  { value: "bar", label: "แท่ง" },
                ]}
              />
            </div>
          }
        >
          {yearData.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              {mode === "area" ? (
                <AreaChart data={yearData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="yearFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={AMBER} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={AMBER} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...grid} vertical={false} />
                  <XAxis dataKey="year" {...axisProps} />
                  <YAxis
                    allowDecimals={false}
                    tickFormatter={(v: number) => fmt(metric === "box" ? "money" : "int", v)}
                    {...axisProps}
                  />
                  <Tooltip content={<Tip kind={metric === "box" ? "money" : "int"} />} />
                  <Area
                    type="monotone"
                    dataKey={metric}
                    name={metric === "box" ? "Box Office" : "จำนวนหนัง"}
                    stroke={AMBER}
                    strokeWidth={2.5}
                    fill="url(#yearFill)"
                    dot={{ r: 3, fill: AMBER, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  {yearData.length > 6 && (
                    <Brush dataKey="year" height={22} stroke={AMBER} fill="transparent" travellerWidth={8} />
                  )}
                </AreaChart>
              ) : (
                <BarChart data={yearData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid {...grid} vertical={false} />
                  <XAxis dataKey="year" {...axisProps} />
                  <YAxis
                    allowDecimals={false}
                    tickFormatter={(v: number) => fmt(metric === "box" ? "money" : "int", v)}
                    {...axisProps}
                  />
                  <Tooltip
                    cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
                    content={<Tip kind={metric === "box" ? "money" : "int"} />}
                  />
                  <Bar
                    dataKey={metric}
                    name={metric === "box" ? "Box Office" : "จำนวนหนัง"}
                    fill={AMBER}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                  {yearData.length > 6 && (
                    <Brush dataKey="year" height={22} stroke={AMBER} fill="transparent" travellerWidth={8} />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel
          title="สัดส่วนตามประเภท (Genre)"
          subtitle="คลิกเพื่อกรองทุกกราฟ · หนัง 1 เรื่องนับได้หลายประเภท"
          icon={PieIcon}
          tone="text-violet-500"
        >
          <Donut data={genreData} centerLabel="รายการ" selected={genre} onSelect={toggleGenre} />
        </Panel>
      </div>

      {/* ---------------- Row 2 ---------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Box Office รวมแยกตามดารา"
          subtitle="คลิกแท่งเพื่อเลือก/ยกเลิกดารา"
          icon={BarChart3}
          tone="text-emerald-500"
        >
          <HBar
            data={boxBars}
            kind="money"
            seriesName="Box Office"
            onPick={(k) => toggleActor(Number(k))}
          />
        </Panel>

        <Panel
          title="จำนวนรางวัลแยกตามดารา"
          subtitle="สูงสุด 8 อันดับ · คลิกแท่งเพื่อเลือกดารา"
          icon={Award}
          tone="text-amber-400"
        >
          <Column
            data={awardBars}
            kind="int"
            seriesName="รางวัล"
            onPick={(k) => toggleActor(Number(k))}
          />
        </Panel>
      </div>

      {/* ---------------- Row 3 ---------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="เรตติ้ง vs Box Office"
          subtitle="1 จุด = หนัง 1 เรื่อง · สีตามดารา · ชี้เมาส์ดูรายละเอียด"
          icon={Star}
          tone="text-rose-500"
        >
          {scatter.series.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 12, right: 20, bottom: 8, left: 0 }}>
                <CartesianGrid {...grid} />
                <XAxis
                  type="number"
                  dataKey="rating"
                  name="เรตติ้ง"
                  domain={scatter.domain}
                  tickCount={scatter.domain[1] - scatter.domain[0] + 1}
                  {...axisProps}
                />
                <YAxis
                  type="number"
                  dataKey="box"
                  name="Box Office"
                  tickFormatter={(v: number) => money(v)}
                  {...axisProps}
                />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<ScatterTip />} />
                {scatter.series.map((s) => (
                  <Scatter key={s.id} name={s.name} data={s.data} fill={s.color} fillOpacity={0.85} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel
          title="การกระจายคะแนนเรตติ้ง"
          subtitle="ชี้แท่งเพื่อดูรายชื่อหนังในช่วงคะแนนนั้น"
          icon={BarChart3}
          tone="text-sky-500"
        >
          <Column data={histogram} kind="int" seriesName="จำนวนหนัง" />
        </Panel>
      </div>

      {/* ---------------- Row 4 ---------------- */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="ดาราตามสัญชาติ" icon={Globe2} tone="text-sky-500">
          <Donut data={nationalityData} centerLabel="คน" />
        </Panel>

        <Panel title="จำนวนหนังรายทศวรรษ" subtitle="ชี้แท่งเพื่อดูรายชื่อหนัง" icon={Calendar} tone="text-violet-500">
          <Column data={decades} kind="int" seriesName="จำนวนหนัง" />
        </Panel>

        <Panel
          title="เรตติ้งเฉลี่ยของดารา"
          subtitle="เฉลี่ยจากหนังที่มีคะแนน (เต็ม 10) · คลิกเพื่อเลือกดารา"
          icon={Star}
          tone="text-amber-400"
          className="lg:col-span-2 xl:col-span-1"
        >
          <HBar
            data={ratingBars}
            kind="rating"
            seriesName="เรตติ้งเฉลี่ย"
            domain={[0, 10]}
            onPick={(k) => toggleActor(Number(k))}
          />
        </Panel>
      </div>
    </div>
  );
}
