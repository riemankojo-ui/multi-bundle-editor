"""Multi Bundle - builds the Android launcher icon and splash screen from logo.png.
Usage: python3 mbicons.py <android res dir> <logo.png>
Runs during the APK build. Nothing to ship as images, it all comes from logo.png."""
import os
import re
import sys

from PIL import Image, ImageDraw

res, logo_path = sys.argv[1], sys.argv[2]
if not os.path.isfile(logo_path):
    print('mbicons: no logo.png, keeping default icons')
    sys.exit(0)

SOFT = (201, 198, 190)      # soft warm white for the splash symbol
SPLASH_BG = '#15161a'       # same as the app header

logo = Image.open(logo_path).convert('RGB')
bg = logo.getpixel((8, 8))
fg = max((c for _, c in logo.getcolors(1 << 24)), key=sum)

# Pull the </> symbol out of the logo as a soft edged mask
lo, hi = bg[2], fg[2]
alpha = logo.split()[2].point(
    lambda v: max(0, min(255, int((v - lo) * 255 / max(1, hi - lo)))))
box = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
# Draw the </> as sharp vector shapes so it is never blurry or jagged
SHAPES = [
    [(0.3452, 0.1279), (0.3756, 0.3256), (0.0254, 0.6047), (0.0, 0.4419)],
    [(0.1827, 0.5465), (0.3756, 0.6512), (0.3706, 0.8721), (0.0254, 0.6628)],
    [(0.5533, 0.0), (0.6396, 0.0), (0.4620, 0.985), (0.3756, 0.985)],
    [(0.6294, 0.1395), (0.9594, 0.3372), (0.8071, 0.4535), (0.6345, 0.3605)],
    [(0.6294, 0.6628), (0.9695, 0.4186), (1.0, 0.6047), (0.6294, 0.8837)],
]
GW, GH, SS = 1600, 698, 4
big = Image.new('L', (GW * SS, GH * SS), 0)
dr = ImageDraw.Draw(big)
for poly in SHAPES:
    dr.polygon([(x * (GW * SS - 1), y * (GH * SS - 1)) for x, y in poly], fill=255)
glyph = big.resize((GW, GH), Image.LANCZOS)


def glyph_layer(size, frac, color, base=None):
    """Symbol centered on a square (or w x h) canvas, `frac` of the short side wide."""
    w, h = size if isinstance(size, tuple) else (size, size)
    gw = int(min(w, h) * frac)
    gh = int(glyph.height * gw / glyph.width)
    m = glyph.resize((gw, gh), Image.LANCZOS)
    pos = ((w - gw) // 2, (h - gh) // 2)
    if base is None:
        out = Image.new('RGBA', (w, h), color + (0,))
        solid = Image.new('RGBA', (gw, gh), color + (255,))
        out.paste(solid, pos, m)
        return out
    out = Image.new('RGB', (w, h), base)
    out.paste(Image.new('RGB', (gw, gh), color), pos, m)
    return out


def save(img, *parts):
    p = os.path.join(res, *parts)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    img.save(p)


# 1) Launcher icons: orange logo, symbol kept inside the safe zone
for d, px, fg_px in [('mdpi', 48, 108), ('hdpi', 72, 162), ('xhdpi', 96, 216),
                     ('xxhdpi', 144, 324), ('xxxhdpi', 192, 432)]:
    sq = logo.resize((px, px), Image.LANCZOS)
    save(sq, 'mipmap-' + d, 'ic_launcher.png')
    rnd = sq.convert('RGBA')
    mask = Image.new('L', (px * 4, px * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, px * 4 - 1, px * 4 - 1), fill=255)
    rnd.putalpha(mask.resize((px, px), Image.LANCZOS))
    save(rnd, 'mipmap-' + d, 'ic_launcher_round.png')
    save(glyph_layer(fg_px, 0.5, fg), 'mipmap-' + d, 'ic_launcher_foreground.png')

hexbg = '#%02X%02X%02X' % bg
os.makedirs(os.path.join(res, 'values'), exist_ok=True)
with open(os.path.join(res, 'values', 'ic_launcher_background.xml'), 'w') as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
            '    <color name="ic_launcher_background">%s</color>\n</resources>\n' % hexbg)

# 2) Splash: dark background, only the soft white </> symbol (no full logo)
save(glyph_layer(1152, 0.46, SOFT), 'drawable-nodpi', 'splash_glyph.png')
for root, _, names in os.walk(res):
    for n in names:
        if n == 'splash.png':
            p = os.path.join(root, n)
            w, h = Image.open(p).size
            glyph_layer((w, h), 0.34, SOFT, base=SPLASH_BG).save(p)

# 3) Point the Android 12+ splash at the symbol and the dark background
sp = os.path.join(res, 'values', 'styles.xml')
if os.path.isfile(sp):
    s = open(sp, encoding='utf-8').read()
    m = re.search(r'<style name="AppTheme\.NoActionBarLaunch"([^>]*)>(.*?)</style>', s, re.S)
    if m and 'SplashScreen' in m.group(1):
        inner = m.group(2)
        for k, v in [('windowSplashScreenBackground', SPLASH_BG),
                     ('windowSplashScreenAnimatedIcon', '@drawable/splash_glyph'),
                     ('postSplashScreenTheme', '@style/AppTheme.NoActionBar')]:
            if 'name="%s"' % k not in inner:
                inner += '    <item name="%s">%s</item>\n' % (k, v)
        s = s[:m.start()] + '<style name="AppTheme.NoActionBarLaunch"%s>%s</style>' % (m.group(1), inner) + s[m.end():]
        open(sp, 'w', encoding='utf-8').write(s)
        print('mbicons: splash style updated')
    else:
        print('mbicons: splash style not found, left as is')
print('mbicons: done')
