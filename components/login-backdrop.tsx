// พื้นหลังแผ่นเดียวทั้งหน้า สไตล์ Hollywood ยามค่ำคืน
// ถ้าใส่ภาพไว้ที่ public/images/hollywood-night.jpg จะถูกใช้เป็นภาพพื้นหลังอัตโนมัติ
// ถ้ายังไม่มีภาพ จะเห็นพื้นหลังไล่เฉดสี + แสงไฟ (bokeh) + ไฟสปอตไลต์แทน

const bokeh = [
  { l: "6%", t: "70%", s: 14, c: "bg-amber-300/70" },
  { l: "11%", t: "78%", s: 8, c: "bg-white/70" },
  { l: "17%", t: "74%", s: 20, c: "bg-amber-400/50" },
  { l: "24%", t: "82%", s: 10, c: "bg-orange-300/60" },
  { l: "33%", t: "76%", s: 16, c: "bg-amber-200/50" },
  { l: "41%", t: "84%", s: 9, c: "bg-white/60" },
  { l: "52%", t: "80%", s: 22, c: "bg-amber-400/40" },
  { l: "61%", t: "86%", s: 10, c: "bg-orange-200/60" },
  { l: "70%", t: "78%", s: 14, c: "bg-amber-300/60" },
  { l: "78%", t: "84%", s: 8, c: "bg-white/70" },
  { l: "86%", t: "72%", s: 18, c: "bg-amber-400/50" },
  { l: "93%", t: "80%", s: 12, c: "bg-orange-300/60" },
];

export function LoginBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* ฐานสีเข้ม (fallback เมื่อไม่มีภาพ) */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0b0d14_0%,#05060a_50%,#130c04_100%)]" />

      {/* ภาพถ่าย Hollywood ยามค่ำคืน (ไม่บังคับ) */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: "url('/images/hollywood-night.jpg')" }}
      />

      {/* แสงอุ่นขนาดใหญ่ให้เกิดมิติ */}
      <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-amber-500/15 blur-3xl" />
      <div className="absolute -right-40 bottom-10 h-[30rem] w-[30rem] rounded-full bg-orange-500/10 blur-3xl" />

      {/* ไฟสปอตไลต์ส่องฟ้า */}
      <div className="absolute bottom-0 left-[14%] h-[90%] w-40 origin-bottom -rotate-[16deg] bg-gradient-to-t from-white/15 via-white/5 to-transparent blur-xl [clip-path:polygon(42%_0,58%_0,100%_100%,0_100%)]" />
      <div className="absolute right-[18%] bottom-0 h-[80%] w-36 origin-bottom rotate-[20deg] bg-gradient-to-t from-amber-100/15 via-white/5 to-transparent blur-xl [clip-path:polygon(42%_0,58%_0,100%_100%,0_100%)]" />

      {/* เงาเนินเขา Hollywood Hills */}
      <svg
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-44 w-full"
      >
        <defs>
          <linearGradient id="hills" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a0b10" stopOpacity="0.85" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
        </defs>
        <path
          d="M0 140 C 160 90 280 120 420 100 C 560 80 640 130 780 110 C 920 90 1040 60 1180 95 C 1290 120 1370 100 1440 85 L1440 220 L0 220 Z"
          fill="url(#hills)"
        />
      </svg>

      {/* แสงไฟเมือง (bokeh) */}
      {bokeh.map((b, i) => (
        <span
          key={i}
          className={`absolute rounded-full blur-[2px] ${b.c}`}
          style={{ left: b.l, top: b.t, width: b.s, height: b.s }}
        />
      ))}

      {/* Vignette + ปรับโทนให้มืดหรู */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/25 to-black/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />
    </div>
  );
}
