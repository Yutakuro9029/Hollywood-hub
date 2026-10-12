"""ภาพป๊อปอัปโปรโมท devbanban.com (ล้อเลียนเว็บพนัน)
ใช้:  python make_popup.py <person.png ที่ตัดพื้นหลังแล้ว> <output.png>
แก้ข้อความได้ที่ส่วน TEXT ด้านล่าง"""
import math, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

# ───────── TEXT (แก้ตรงนี้) ─────────
RIBBON = "ประกาศด่วน!"
TITLE = "DEVBANBAN"
TITLE2 = ".COM"
SUB = "เว็บสอนโค้ดตรง ไม่ผ่านเอเย่นต์"
BUBBLE = ["สมัครเลย", "ไม่ผิดหวัง!"]
BADGES = [("โบนัส", "BUG", "100%"), ("ฟรี!", "SOURCE", "CODE"), ("เทิร์น", "0", "เท่า")]
BULLETS = [
    "สอน PHP • MySQL • Laravel • Python",
    "ฝาก-ถอน ความรู้ ออโต้ 24 ชม.",
    "ทำโปรเจกต์จบ แตกง่าย แตกจริง",
]
BUTTON = "สมัครเรียนเลย"
URL = "devbanban.com"
DISCLAIMER = "*ภาพล้อเลียนเพื่อความบันเทิง ไม่เกี่ยวข้องกับการพนันใดๆ"
# ───────────────────────────────────

W, H = 720, 960
F = "C:/Windows/Fonts/"
def font(sz, bold=True):
    return ImageFont.truetype(F + ("leelawdb.ttf" if bold else "leelawad.ttf"), sz)

GOLD, GOLD2, RED, DARK = (255, 205, 60), (255, 240, 150), (220, 20, 40), (25, 5, 10)
WHITE, GREEN = (255, 255, 255), (40, 210, 90)

UPPER = set("\u0e31\u0e34\u0e35\u0e36\u0e37\u0e47\u0e4d")
TONE = set("\u0e48\u0e49\u0e4a\u0e4b\u0e4c")
def tdraw(d, xy, s, f, **kw):
    # Pillow ที่ไม่มี raqm จะวางวรรณยุกต์ทับสระบน: ยกขึ้นเอง
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

def ctext(d, y, s, sz, fill=WHITE, stroke=None, sw=0, bold=True, cx=W / 2):
    f = font(sz, bold)
    w = d.textlength(s, font=f)
    tdraw(d, (cx - w / 2, y), s, f, fill=fill, stroke_width=sw, stroke_fill=stroke)

def glow_text(im, y, s, sz, fill, glow, cx=W / 2):
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ctext(ImageDraw.Draw(layer), y, s, sz, fill=glow + (255,), stroke=glow + (255,), sw=7, cx=cx)
    layer = layer.filter(ImageFilter.GaussianBlur(10))
    im.alpha_composite(layer)
    ctext(ImageDraw.Draw(im), y, s, sz, fill=fill, stroke=(90, 30, 0), sw=3, cx=cx)

def star(cx, cy, r1, r2, n=14, rot=0):
    pts = []
    for i in range(n * 2):
        r = r1 if i % 2 == 0 else r2
        a = math.pi * i / n + rot
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

im = Image.new("RGBA", (W, H), DARK + (255,))
d = ImageDraw.Draw(im)

# sunburst ออกจากหลังตัวคน
cx, cy = 230, 470
for i in range(28):
    a0 = i * (360 / 28)
    d.pieslice([cx - 1200, cy - 1200, cx + 1200, cy + 1200], a0, a0 + 360 / 28,
               fill=(110, 12, 28) if i % 2 else (60, 6, 16))
halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(halo).ellipse([cx - 230, cy - 230, cx + 230, cy + 230], fill=(255, 170, 40, 150))
im.alpha_composite(halo.filter(ImageFilter.GaussianBlur(60)))

# ── หัว ──
d = ImageDraw.Draw(im)
d.rounded_rectangle([240, 34, 480, 84], radius=25, fill=RED, outline=GOLD2, width=3)
ctext(d, 36, RIBBON, 30)
glow_text(im, 92, TITLE, 92, GOLD, (255, 60, 0))
glow_text(im, 196, TITLE2, 52, WHITE, (255, 0, 60), cx=W / 2 + 180)
d = ImageDraw.Draw(im)
ctext(d, 262, SUB, 26, fill=GOLD2, stroke=(60, 0, 0), sw=2)

# ── คน: สติกเกอร์ขอบขาว + เรืองแสงทอง ──
person = Image.open(sys.argv[1]).convert("RGBA")
pw = 520
person = person.resize((pw, pw), Image.LANCZOS)
px, py = -50, 300
alpha = person.getchannel("A")
outline = alpha.filter(ImageFilter.MaxFilter(13))
glow = alpha.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(14))
lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
lay.paste(Image.new("RGBA", (pw, pw), GOLD + (255,)), (px, py), glow)
lay.paste(Image.new("RGBA", (pw, pw), WHITE + (255,)), (px, py), outline)
lay.alpha_composite(person, (max(px, 0), py), (max(-px, 0), 0))
im.alpha_composite(lay)

# ── ลูกโป่งคำพูด ──
d = ImageDraw.Draw(im)
bx, by = 300, 300
d.rounded_rectangle([bx, by, bx + 200, by + 92], radius=22, fill=WHITE, outline=(30, 30, 30), width=3)
d.polygon([(bx + 30, by + 88), (bx + 10, by + 130), (bx + 70, by + 88)], fill=WHITE, outline=(30, 30, 30))
d.line([(bx + 32, by + 89), (bx + 68, by + 89)], fill=WHITE, width=4)
ctext(d, by + 8, BUBBLE[0], 28, fill=(30, 30, 30), cx=bx + 100)
ctext(d, by + 46, BUBBLE[1], 28, fill=RED, cx=bx + 100)

# ── ตราดาวด้านขวา ──
for k, (t1, t2, t3) in enumerate(BADGES):
    sx, sy = 615, 345 + k * 122
    col = [RED, (200, 120, 0), (130, 20, 160)][k]
    d.polygon(star(sx, sy, 64, 52, 16, k * 0.2), fill=GOLD2)
    d.polygon(star(sx, sy, 58, 47, 16, k * 0.2), fill=col)
    ctext(d, sy - 46, t1, 18, fill=GOLD2, cx=sx)
    big = 25 if len(t2) > 3 else 38
    ctext(d, sy - 24 - (big - 30) * 0.4, t2, big, fill=WHITE, stroke=(60, 0, 0), sw=2, cx=sx)
    ctext(d, sy + 14, t3, 22, fill=GOLD2, cx=sx)

# ── แผงล่าง ──
panel = Image.new("RGBA", (W, H), (0, 0, 0, 0))
pd = ImageDraw.Draw(panel)
pd.rectangle([0, 700, W, H], fill=(12, 2, 6, 245))
pd.line([(0, 700), (W, 700)], fill=GOLD, width=4)
im.alpha_composite(panel)
d = ImageDraw.Draw(im)
for i, b in enumerate(BULLETS):
    y = 718 + i * 40
    d.ellipse([70, y + 9, 90, y + 29], fill=GREEN)
    d.line([(75, y + 19), (79, y + 24), (86, y + 13)], fill=WHITE, width=3)
    tdraw(d, (104, y), b, font(25), fill=WHITE)

# ปุ่ม
d.rounded_rectangle([130, 846, 590, 914], radius=34, fill=(10, 120, 50))
d.rounded_rectangle([130, 840, 590, 906], radius=34, fill=GREEN, outline=GOLD2, width=4)
ctext(d, 846, BUTTON + "  »", 36, stroke=(0, 70, 20), sw=2)
ctext(d, 916, URL + "   " + DISCLAIMER, 15, fill=(200, 170, 170), bold=False)

# ไฟวิ่งรอบขอบ
for i, x in enumerate(range(14, W, 28)):
    for y in (10, H - 10):
        c = GOLD2 if i % 2 == 0 else (150, 90, 0)
        d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=c)
for i, y in enumerate(range(38, H - 20, 28)):
    for x in (10, W - 10):
        c = GOLD2 if i % 2 == 0 else (150, 90, 0)
        d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=c)

im.convert("RGB").save(sys.argv[2], optimize=True)
print("saved", sys.argv[2])
