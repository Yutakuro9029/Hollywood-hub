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
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Filter,
  PieChart as PieIcon,
  Star,
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

type Fmt = "money" | "int";

const COLORS = ["#fbbf24", "#0ea5e9", "#8b5cf6", "#10b981", "#f43f5e", "#f97316"];
const OTHER = "#a1a1aa";
const AMBER = "#fbbf24";
const SKY = "#0ea5e9";

const money = (m: number) =>
  m >= 1000 ? `$${(m / 1000).toFixed(2)}B` : `$${m.toFixed(m < 100 ? 1 : 0)}M`;
const fmt = (kind: Fmt, n: number) => (kind === "money" ? money(n) : n.toLocaleString("en-US"));
const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

const card = "rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-slate-900";

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
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            <Icon size={18} className={tone} />
            <span className="truncate">{title}</span>
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
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

/* ---------- Tooltip ---------- */

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
    <div className="flex flex-col items-center gap-5">
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
          <span className="max-w-[5.5rem] truncate text-[10px]">{hovered ? hovered.name : centerLabel}</span>
        </div>
      </div>

      <ul className="w-full space-y-1 text-sm">
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

/* ---------- Bars ---------- */

type BarDatum = { key: string; name: string; value: number; color: string; active?: boolean; extra?: string[] };

function HBar({
  data, kind, seriesName, onPick,
}: {
  data: BarDatum[];
  kind: Fmt;
  seriesName: string;
  onPick?: (key: string) => void;
}) {
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 4 }}>
        <CartesianGrid {...grid} horizontal={false} />
        <XAxis type="number" tickFormatter={(v: number) => fmt(kind, v)} {...axisProps} />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          interval={0}
          tickFormatter={(v: string) => truncate(v, 16)}
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

function Column({ data, seriesName }: { data: BarDatum[]; seriesName: string }) {
  if (data.every((d) => d.value === 0)) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 22, right: 8, bottom: 4, left: -8 }}>
        <CartesianGrid {...grid} vertical={false} />
        <XAxis dataKey="name" interval={0} {...axisProps} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip cursor={{ fill: "currentColor", fillOpacity: 0.06 }} content={<Tip kind="int" />} />
        <Bar dataKey="value" name={seriesName} radius={[6, 6, 0, 0]} maxBarSize={56}>
          {data.map((d) => (
            <Cell key={d.key} fill={d.color} />
          ))}
          <LabelList dataKey="value" position="top" fill="currentColor" fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ======================================================================
 * Main component — เหลือกราฟที่สำคัญ 4 แบบ
 *   1) แนวโน้มรายปี  2) สัดส่วน Genre  3) Top 10 ดารา  4) การกระจายเรตติ้ง
 * ==================================================================== */

const TOP_N = 10;

const BUCKETS = [
  { name: "< 5", test: (r: number) => r < 5 },
  { name: "5–5.9", test: (r: number) => r >= 5 && r < 6 },
  { name: "6–6.9", test: (r: number) => r >= 6 && r < 7 },
  { name: "7–7.9", test: (r: number) => r >= 7 && r < 8 },
  { name: "8–8.9", test: (r: number) => r >= 8 && r < 9 },
  { name: "9–10", test: (r: number) => r >= 9 },
];

const ACTOR_METRICS = {
  box: { label: "Box Office", kind: "money" as Fmt },
  awards: { label: "รางวัล", kind: "int" as Fmt },
  movies: { label: "จำนวนหนัง", kind: "int" as Fmt },
};

export default function DashboardCharts({
  movies,
  actors,
}: {
  movies: ChartMovie[];
  actors: ChartActor[];
}) {
  const [genre, setGenre] = useState<string | null>(null);
  const [actorKey, setActorKey] = useState<string | null>(null); // ใช้ชื่อดาราเป็นคีย์ (รวมแถวที่ชื่อซ้ำ)
  const [metric, setMetric] = useState<"box" | "count">("box");
  const [mode, setMode] = useState<"area" | "bar">("area");
  const [actorMetric, setActorMetric] = useState<keyof typeof ACTOR_METRICS>("box");

  const nameOf = useMemo(() => new Map(actors.map((a) => [a.id, a.name])), [actors]);

  const [actorText, setActorText] = useState(""); // ข้อความในช่องค้นหาดารา
  const [yearFrom, setYearFrom] = useState<number | null>(null);
  const [yearTo, setYearTo] = useState<number | null>(null);

  /* ---- ตัวเลือกของตัวกรอง ---- */
  const actorNames = useMemo(() => [...new Set(actors.map((a) => a.name))].sort((a, b) => a.localeCompare(b)), [actors]);
  const actorNameSet = useMemo(() => new Set(actorNames), [actorNames]);
  const allGenres = useMemo(
    () => [...new Set(movies.flatMap((m) => m.genres))].sort((a, b) => a.localeCompare(b)),
    [movies],
  );
  const years = useMemo(
    () => [...new Set(movies.flatMap((m) => (m.year === null ? [] : [m.year])))].sort((a, b) => a - b),
    [movies],
  );

  const selectActor = (name: string | null) => {
    setActorKey(name);
    setActorText(name ?? "");
  };
  const toggleGenre = (g: string) => setGenre((cur) => (cur === g ? null : g));
  const toggleActor = (name: string) => selectActor(actorKey === name ? null : name);
  const onActorText = (v: string) => {
    setActorText(v);
    setActorKey(actorNameSet.has(v) ? v : null);
  };
  const changeFrom = (v: string) => {
    const n = v ? Number(v) : null;
    setYearFrom(n);
    if (n !== null && yearTo !== null && n > yearTo) setYearTo(n);
  };
  const changeTo = (v: string) => {
    const n = v ? Number(v) : null;
    setYearTo(n);
    if (n !== null && yearFrom !== null && n < yearFrom) setYearFrom(n);
  };
  const reset = () => {
    setGenre(null);
    selectActor(null);
    setYearFrom(null);
    setYearTo(null);
  };

  /* ---- ชุดข้อมูลหลังกรอง ---- */
  // base: กรองช่วงปีก่อน (มีผลกับทุกกราฟ)
  const base = useMemo(
    () =>
      movies.filter(
        (m) =>
          (yearFrom === null || (m.year !== null && m.year >= yearFrom)) &&
          (yearTo === null || (m.year !== null && m.year <= yearTo)),
      ),
    [movies, yearFrom, yearTo],
  );
  // byGenre: กรองเฉพาะ genre (ใช้กับกราฟดารา เพื่อให้คลิกเปลี่ยนดาราได้)
  const byGenre = useMemo(
    () => (genre ? base.filter((m) => m.genres.includes(genre)) : base),
    [base, genre],
  );
  // byActor: กรองเฉพาะดารา (ใช้กับ donut genre เพื่อให้เปลี่ยน genre ได้)
  const byActor = useMemo(
    () => (actorKey !== null ? base.filter((m) => nameOf.get(m.actorId) === actorKey) : base),
    [base, actorKey, nameOf],
  );
  // filtered: กรองทั้งหมด
  const filtered = useMemo(
    () => (genre ? byActor.filter((m) => m.genres.includes(genre)) : byActor),
    [byActor, genre],
  );

  const summary = useMemo(() => {
    const rated = filtered.flatMap((m) => (m.rating === null ? [] : [m.rating]));
    return { count: filtered.length, box: filtered.reduce((s, m) => s + m.box, 0), rating: avg(rated) };
  }, [filtered]);

  /* ---- 1) รายปี ---- */
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

  /* ---- 2) Genre (top 6 + อื่นๆ) ---- */
  const genreData = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of byActor) for (const g of m.genres) map.set(g, (map.get(g) ?? 0) + 1);
    const all = [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
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

  /* ---- 3) Top 10 ดารา (สลับตัวชี้วัดได้) ---- */
  const actorBars: BarDatum[] = useMemo(() => {
    // รวมดาราที่ชื่อซ้ำกัน (ข้อมูลอาจมีแถวซ้ำ) ให้เป็นแท่งเดียว
    const agg = new Map<string, { box: number; movies: number; awards: number }>();
    for (const a of actors) {
      const cur = agg.get(a.name) ?? { box: 0, movies: 0, awards: 0 };
      cur.awards = Math.max(cur.awards, a.awards);
      agg.set(a.name, cur);
    }
    for (const m of byGenre) {
      const name = nameOf.get(m.actorId);
      const cur = name !== undefined ? agg.get(name) : undefined;
      if (!cur) continue;
      cur.box += m.box;
      cur.movies += 1;
    }
    const rows = [...agg.entries()]
      .map(([name, v]) => ({ name, value: v[actorMetric] }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

    const top = rows.slice(0, TOP_N);
    // ดาราที่เลือกอยู่แต่ไม่อยู่ใน Top 10 ให้ยังแสดงต่อท้าย
    const sel = actorKey !== null ? rows.find((r) => r.name === actorKey) : undefined;
    if (sel && !top.some((r) => r.name === sel.name)) top.push(sel);

    return top.map((r) => ({
      key: r.name,
      name: r.name,
      value: r.value,
      color: AMBER,
      active: actorKey === null || actorKey === r.name,
    }));
  }, [actors, byGenre, nameOf, actorMetric, actorKey]);

  /* ---- 4) Histogram เรตติ้ง ---- */
  const histogram: BarDatum[] = useMemo(() => {
    const rated = filtered.flatMap((m) => (m.rating === null ? [] : [{ ...m, rating: m.rating }]));
    return BUCKETS.map((b) => {
      const inBucket = rated.filter((m) => b.test(m.rating));
      return {
        key: b.name,
        name: b.name,
        value: inBucket.length,
        color: SKY,
        extra: inBucket.map((m) => `${m.title} (${m.rating.toFixed(1)})`),
      };
    });
  }, [filtered]);

  const hasFilter = genre !== null || actorKey !== null || yearFrom !== null || yearTo !== null;
  const fieldCls =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-slate-950 dark:text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30 dark:focus:border-amber-400";
  const labelCls = "mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300";
  const strong = "font-semibold text-zinc-800 dark:text-zinc-100";

  return (
    <div className="space-y-6">
      {/* ---------------- Filter / summary bar ---------------- */}
      <section className={`${card} p-4`} aria-label="ตัวกรองกราฟ">
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium">
            <Filter size={16} className="text-amber-400" /> ตัวกรอง
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            เลือกจากช่องด้านล่าง หรือคลิกชิ้น Genre / แท่งดาราในกราฟก็ได้
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_8rem_8rem_auto] lg:items-end">
          <div>
            <label htmlFor="f-genre" className={labelCls}>ประเภท (Genre)</label>
            <select id="f-genre" value={genre ?? ""} onChange={(e) => setGenre(e.target.value || null)} className={fieldCls}>
              <option value="">ทั้งหมด</option>
              {allGenres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="f-actor" className={labelCls}>ดารา</label>
            <input
              id="f-actor"
              list="f-actor-list"
              value={actorText}
              onChange={(e) => onActorText(e.target.value)}
              placeholder="พิมพ์ชื่อแล้วเลือกจากรายการ"
              autoComplete="off"
              className={`${fieldCls} placeholder:text-zinc-400 dark:placeholder:text-zinc-500`}
            />
            <datalist id="f-actor-list">
              {actorNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="f-from" className={labelCls}>ตั้งแต่ปี</label>
            <select id="f-from" value={yearFrom ?? ""} onChange={(e) => changeFrom(e.target.value)} className={fieldCls}>
              <option value="">ทั้งหมด</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="f-to" className={labelCls}>ถึงปี</label>
            <select id="f-to" value={yearTo ?? ""} onChange={(e) => changeTo(e.target.value)} className={fieldCls}>
              <option value="">ทั้งหมด</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={reset}
            disabled={!hasFilter}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-300 disabled:hover:bg-transparent disabled:hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-amber-400 dark:hover:bg-amber-400/10 dark:hover:text-amber-300 dark:disabled:hover:border-zinc-700 dark:disabled:hover:bg-transparent dark:disabled:hover:text-zinc-300"
          >
            <X size={14} /> ล้าง
          </button>
        </div>

        {actorText !== "" && actorKey === null && (
          <p className="mt-2 text-xs text-rose-500">ไม่พบดาราชื่อนี้ — กรุณาเลือกจากรายการที่แนะนำ</p>
        )}

        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          แสดง <span className={strong}>{summary.count}</span> / {movies.length} เรื่อง · Box Office{" "}
          <span className={strong}>{money(summary.box)}</span> · เรตติ้งเฉลี่ย{" "}
          <span className={strong}>{summary.rating !== null ? summary.rating.toFixed(2) : "-"}</span>
        </p>
      </section>

      {/* ---------------- Row 1: แนวโน้ม + Genre ---------------- */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="แนวโน้มรายปีที่ฉาย"
          subtitle="ลากแถบด้านล่างเพื่อซูมช่วงปี"
          icon={TrendingUp}
          tone="text-amber-400"
          className="xl:col-span-2"
          action={
            <div className="flex flex-wrap gap-2">
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
            <ResponsiveContainer width="100%" height={340}>
              {mode === "area" ? (
                <AreaChart data={yearData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="yearFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={AMBER} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={AMBER} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...grid} vertical={false} />
                  <XAxis dataKey="year" minTickGap={24} {...axisProps} />
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
                    dot={yearData.length > 30 ? false : { r: 3, fill: AMBER, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  {yearData.length > 6 && (
                    <Brush dataKey="year" height={22} stroke={AMBER} fill="transparent" travellerWidth={8} />
                  )}
                </AreaChart>
              ) : (
                <BarChart data={yearData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid {...grid} vertical={false} />
                  <XAxis dataKey="year" minTickGap={24} {...axisProps} />
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
          title="สัดส่วนตามประเภท"
          subtitle="6 อันดับแรก · คลิกเพื่อกรอง"
          icon={PieIcon}
          tone="text-violet-500"
        >
          <Donut data={genreData} centerLabel="รายการ" selected={genre} onSelect={toggleGenre} />
        </Panel>
      </div>

      {/* ---------------- Row 2: Top ดารา + เรตติ้ง ---------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title={`Top ${TOP_N} ดารา`}
          subtitle="คลิกแท่งเพื่อกรองเฉพาะดาราคนนั้น"
          icon={BarChart3}
          tone="text-emerald-500"
          action={
            <Segmented
              value={actorMetric}
              onChange={setActorMetric}
              options={(Object.keys(ACTOR_METRICS) as (keyof typeof ACTOR_METRICS)[]).map((k) => ({
                value: k,
                label: ACTOR_METRICS[k].label,
              }))}
            />
          }
        >
          <HBar
            data={actorBars}
            kind={ACTOR_METRICS[actorMetric].kind}
            seriesName={ACTOR_METRICS[actorMetric].label}
            onPick={(k) => toggleActor(k)}
          />
        </Panel>

        <Panel
          title="การกระจายคะแนนเรตติ้ง"
          subtitle="ชี้แท่งเพื่อดูรายชื่อหนังในช่วงคะแนนนั้น"
          icon={Star}
          tone="text-sky-500"
        >
          <Column data={histogram} seriesName="จำนวนหนัง" />
        </Panel>
      </div>
    </div>
  );
}
