import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
im = Image.open(sys.argv[1]).convert("RGB")
a = np.asarray(im).astype(int)
mx, mn = a.max(2), a.min(2)
cand = ((mx - mn) < 28) & (a.mean(2) > 140)
lab, n = ndi.label(cand)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(border))
fg = ~bg
fg = ndi.binary_opening(fg, iterations=2)
lab2, n2 = ndi.label(fg)
sizes = ndi.sum(fg, lab2, range(1, n2 + 1))
fg = lab2 == (np.argmax(sizes) + 1)
fg = ndi.binary_fill_holes(fg)
# enclosed wall patches (between arms and body): large low-saturation grey regions
hole = ((mx - mn) < 24) & (a.mean(2) > 80) & fg
hole[:260] = False
hl, hn = ndi.label(hole)
hs = ndi.sum(hole, hl, range(1, hn + 1))
for k, sz in enumerate(hs, 1):
    if sz > 350:
        fg[hl == k] = False
fg[440:, 418:] = False
fg = ndi.binary_opening(fg, iterations=1)
m = Image.fromarray((fg * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.2))
out = im.convert("RGBA"); out.putalpha(m)
out.save(sys.argv[2])
prev = Image.new("RGBA", im.size, (200, 0, 40, 255)); prev.alpha_composite(out); prev.save(sys.argv[3])
