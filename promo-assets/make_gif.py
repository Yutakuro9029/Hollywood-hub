import math, random, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = sys.argv[1]
W, H = 640, 640
F = "C:/Windows/Fonts/"
def font(sz, bold=True):
    return ImageFont.truetype(F + ("leelawdb.ttf" if bold else "leelawad.ttf"), sz)

GOLD = (255, 205, 60)
GOLD2 = (255, 240, 150)
RED = (220, 20, 40)
DARK = (25, 5, 10)
WHITE = (255, 255, 255)
GREEN = (40, 230, 90)

random.seed(7)
frames, durations = [], []

def bg(t):
    im = Image.new("RGB", (W, H), DARK)
    d = ImageDraw.Draw(im)
    # radial-ish sunburst
    cx, cy = W // 2, H // 2
    for i in range(24):
        a0 = i * 15 + t * 4
        col = (70, 10, 20) if i % 2 else (45, 5, 12)
        d.pieslice([cx - 700, cy - 700, cx + 700, cy + 700], a0, a0 + 15, fill=col)
    return im

def bulbs(d, t):
    n = 0
    step = 32
    pts = []
    for x in range(16, W, step): pts.append((x, 12))
    for y in range(12 + step, H - 12, step): pts.append((W - 12, y))
    for x in range(W - 16, 0, -step): pts.append((x, H - 12))
    for y in range(H - 12 - step, 12, -step): pts.append((12, y))
    for i, (x, y) in enumerate(pts):
        on = (i + t) % 3 == 0
        c = GOLD2 if on else (120, 70, 0)
        r = 7 if on else 5
        d.ellipse([x - r, y - r, x + r, y + r], fill=c)


UPPER = set("ัิีึื็ํ")
TONE = set("่้๊๋์")
def tdraw(d, xy, s, f, **kw):
    # Pillow without raqm stacks tone marks onto upper vowels; lift them manually
    base, lifted = "", []
    for i, ch in enumerate(s):
        if ch in TONE and i > 0 and s[i - 1] in UPPER:
            lifted.append((len(base), ch))
        else:
            base += ch
    x, y = xy
    d.text((x, y), base, font=f, **kw)
    for idx, ch in lifted:
        d.text((x + d.textlength(base[:idx], font=f), y - f.size * 0.26), ch, font=f, **kw)

def ctext(d, y, s, sz, fill=WHITE, stroke=None, sw=0, bold=True, x=None):
    f = font(sz, bold)
    w = d.textlength(s, font=f)
    xx = (W - w) / 2 if x is None else x
    tdraw(d, (xx, y), s, f, fill=fill, stroke_width=sw, stroke_fill=stroke)
    return w

def glow_text(im, y, s, sz, fill, glow, t=0):
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ctext(ld, y, s, sz, fill=glow + (255,), stroke=glow + (255,), sw=6)
    layer = layer.filter(ImageFilter.GaussianBlur(8))
    im.paste(layer, (0, 0), layer)
    d = ImageDraw.Draw(im)
    ctext(d, y, s, sz, fill=fill, stroke=(90, 30, 0), sw=3)

def badge(d, box, text, sz, fill, tcol=WHITE):
    d.rounded_rectangle(box, radius=18, fill=fill, outline=GOLD2, width=4)
    f = font(sz)
    w = d.textlength(text, font=f)
    x0, y0, x1, y1 = box
    tdraw(d, ((x0 + x1 - w) / 2, (y0 + y1) / 2 - sz * 0.72), text, f, fill=tcol, stroke_width=2, stroke_fill=(60, 0, 0))

def coins(d, t, n=14):
    for i in range(n):
        rx = random.Random(i).randint(20, W - 20)
        sp = random.Random(i * 3).randint(6, 12)
        y = (t * sp + i * 57) % (H + 60) - 30
        wobble = abs(math.cos((t + i) * 0.4))
        rw = 14 * wobble + 3
        d.ellipse([rx - rw, y - 14, rx + rw, y + 14], fill=GOLD, outline=(160, 100, 0), width=2)
        if wobble > 0.5:
            d.text((rx - 5, y - 11), "<>" if i % 2 else "$", font=font(14), fill=(140, 80, 0))

def add(im, ms=80):
    frames.append(im.convert("RGB"))
    durations.append(ms)

def ticker(d, t, y=596):
    msg = "   » คุณ ต้น*** เพิ่งถอน Skill PHP+MySQL ออโต้ 3 วินาที   » คุณ เบส*** แตก Bug ได้ 2,999 ตัว   » คุณ แนน*** ได้งาน Dev แล้ว!   "
    d.rectangle([0, y - 6, W, y + 30], fill=(0, 0, 0))
    f = font(20)
    tw = d.textlength(msg, font=f)
    x = -(t * 14) % tw
    tdraw(d, (-x, y), msg + msg, f, fill=GOLD)

T = 0
# ---------- Scene 1: intro flash ----------
for i in range(18):
    im = bg(T); d = ImageDraw.Draw(im)
    coins(d, T)
    s = min(1, i / 5)
    glow_text(im, 120, "เว็บตรง!", int(40 + 20 * s), GOLD2, (255, 120, 0))
    glow_text(im, 210, "DEVBANBAN", 84, GOLD, (255, 60, 0))
    glow_text(im, 305, ".COM", 60, WHITE, (255, 0, 60))
    d = ImageDraw.Draw(im)
    if i % 4 < 2:
        badge(d, (110, 410, 530, 480), "ไม่ผ่าน Stack Overflow", 30, RED)
    ctext(d, 505, "สอนเขียนโปรแกรม มั่นคง ปลอดภัย 100%", 24, fill=WHITE)
    bulbs(d, T); ticker(d, T)
    add(im, 90); T += 1

# ---------- Scene 2: slot machine ----------
SYM = ["PHP", "SQL", "JS", "</>", "BUG", "API", "CSS", "{ }"]
SYMCOL = {"PHP": (120, 130, 255), "SQL": (0, 200, 255), "JS": (255, 220, 0), "</>": (255, 120, 60),
          "BUG": (255, 60, 60), "API": (60, 255, 140), "CSS": (80, 160, 255), "{ }": (230, 120, 255)}
final = ["PHP", "PHP", "PHP"]
stops = [16, 22, 28]
for i in range(40):
    im = bg(T); d = ImageDraw.Draw(im)
    ctext(d, 40, "$$ สล็อตโค้ดดิ้ง แตกง่าย $$", 38, fill=GOLD, stroke=(90, 0, 0), sw=3)
    # machine
    d.rounded_rectangle([60, 120, 580, 400], radius=30, fill=(150, 0, 20), outline=GOLD, width=8)
    for r in range(3):
        x0 = 90 + r * 160
        d.rounded_rectangle([x0, 160, x0 + 140, 360], radius=14, fill=(250, 245, 230), outline=(120, 70, 0), width=4)
        if i < stops[r]:
            off = (i * 37 + r * 11) % 60
            for k in range(-1, 3):
                sym = SYM[(i * 3 + r * 5 + k) % len(SYM)]
                yy = 175 + k * 70 + off - 30
                if 160 < yy + 20 < 360:
                    f = font(34)
                    w = d.textlength(sym, font=f)
                    d.text((x0 + 70 - w / 2, yy), sym, font=f, fill=SYMCOL[sym])
        else:
            sym = final[r]
            f = font(52)
            w = d.textlength(sym, font=f)
            d.text((x0 + 70 - w / 2, 220), sym, font=f, fill=SYMCOL[sym], stroke_width=2, stroke_fill=(20, 20, 80))
        d.rectangle([x0, 160, x0 + 140, 175], fill=(200, 190, 170))
        d.rectangle([x0, 345, x0 + 140, 360], fill=(200, 190, 170))
    d.line([75, 260, 565, 260], fill=(255, 0, 0, 120), width=3)
    # lever
    pull = 1 if i < 6 else 0
    d.line([595, 280, 615, 180 + pull * 120], fill=(200, 200, 200), width=8)
    d.ellipse([600, 160 + pull * 120, 632, 192 + pull * 120], fill=RED, outline=GOLD2, width=3)
    if i < stops[-1]:
        ctext(d, 430, "กำลังหมุน... ลุ้นได้งาน!", 32, fill=WHITE)
    else:
        if i % 2 == 0:
            glow_text(im, 415, "JACKPOT!!", 70, GOLD2, (255, 40, 0)); d = ImageDraw.Draw(im)
        ctext(d, 510, "PHP 3 ตัวเรียง = ได้งานทันที", 28, fill=GREEN, stroke=(0, 0, 0), sw=2)
        coins(d, T, 20)
    bulbs(d, T); ticker(d, T)
    add(im, 70 if i < stops[-1] else 110); T += 1

# ---------- Scene 3: promotions ----------
promos = [
    ("โปรสมาชิกใหม่", "สมัครวันนี้ รับโบนัส", "BUG 100%", "(ไม่ต้องทำเทิร์น แก้เองได้เลย)"),
    ("ระบบออโต้", "ฝาก Code ถอน Skill", "24 ชม.", "ไม่มีขั้นต่ำ แม้แต่ Hello World"),
    ("คืนยอดเสีย", "Deploy พัง? รับคืน", "Backup 10%", "ทุกวันศุกร์เย็น ก่อนกลับบ้าน"),
    ("โปรเด็ด", "ทำโปรเจกต์จบ", "แตกจริง!", "PHP • MySQL • Laravel • Python"),
]
for p, (tag, l1, big, l2) in enumerate(promos):
    for i in range(14):
        im = bg(T); d = ImageDraw.Draw(im)
        coins(d, T, 8)
        slide = max(0, 1 - i / 4)
        dx = int(slide * 640) * (1 if p % 2 else -1)
        card = Image.new("RGBA", (W, H), (0, 0, 0, 0)); cd = ImageDraw.Draw(card)
        cd.rounded_rectangle([50, 90, 590, 540], radius=36, fill=(20, 0, 5, 235), outline=GOLD + (255,), width=6)
        cd.rounded_rectangle([170, 70, 470, 125], radius=24, fill=RED + (255,), outline=GOLD2 + (255,), width=3)
        ctext(cd, 72, tag, 32, fill=WHITE)
        ctext(cd, 170, l1, 40, fill=WHITE)
        pulse = 1 + 0.08 * math.sin(i * 1.2)
        ctext(cd, 250, big, int(86 * pulse), fill=GOLD, stroke=(150, 30, 0), sw=4)
        ctext(cd, 400, l2, 26, fill=GOLD2)
        ctext(cd, 460, "devbanban.com", 30, fill=GREEN)
        im.paste(card, (dx, 0), card)
        d = ImageDraw.Draw(im)
        bulbs(d, T); ticker(d, T)
        add(im, 100); T += 1

# ---------- Scene 4: CTA ----------
for i in range(26):
    im = bg(T); d = ImageDraw.Draw(im)
    coins(d, T, 18)
    glow_text(im, 70, "สมัครเลย!", 72, GOLD2, (255, 60, 0))
    d = ImageDraw.Draw(im)
    ctext(d, 175, "เรียนเขียนโปรแกรมกับ", 32, fill=WHITE)
    glow_text(im, 220, "devbanban.com", 64, GOLD, (255, 0, 60))
    d = ImageDraw.Draw(im)
    big = i % 4 < 2
    pad = 8 if big else 0
    badge(d, (130 - pad, 340 - pad, 510 + pad, 420 + pad), "เข้าเรียนตอนนี้ »", 38, GREEN if big else (20, 160, 60), tcol=WHITE)
    ctext(d, 450, "ฝาก-ถอน ความรู้ ออโต้  •  แอดมินตอบไว", 24, fill=GOLD2)
    d.rounded_rectangle([60, 535, 580, 568], radius=10, fill=(0, 0, 0))
    ctext(d, 540, "*ล้อเลียนเพื่อความบันเทิง ไม่เกี่ยวข้องกับการพนันใดๆ", 17, fill=(200, 170, 170), bold=False)
    bulbs(d, T); ticker(d, T)
    add(im, 140 if i == 25 else 100); T += 1
durations[-1] = 1500

# quantize with shared adaptive palette per frame
pf = [f.quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for f in frames]
pf[0].save(OUT, save_all=True, append_images=pf[1:], duration=durations, loop=0, optimize=True, disposal=1)
frames[5].save(OUT.replace(".gif", "_f1.png"))
frames[45].save(OUT.replace(".gif", "_f2.png"))
frames[70].save(OUT.replace(".gif", "_f3.png"))
frames[-1].save(OUT.replace(".gif", "_f4.png"))
print(len(frames), sum(durations))
