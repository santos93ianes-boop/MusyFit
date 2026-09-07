from pathlib import Path
from PIL import Image

source = Path('assets/musyfit_app_icon.png')
if not source.exists():
    raise SystemExit(f'Ícone fonte não encontrado: {source}')

im = Image.open(source).convert('RGBA')
w, h = im.size
side = min(w, h)
left = (w - side) // 2
top = (h - side) // 2
im = im.crop((left, top, left + side, top + side))

root = Path('android/app/src/main/res')
sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

for folder, size in sizes.items():
    out_dir = root / folder
    out_dir.mkdir(parents=True, exist_ok=True)
    icon = im.resize((size, size), Image.Resampling.LANCZOS)
    # Preserve the approved icon exactly; Android applies its own launcher mask.
    icon.save(out_dir / 'ic_launcher.png', optimize=True)
    icon.save(out_dir / 'ic_launcher_round.png', optimize=True)

# Adaptive icon foreground: keep extra safe padding to avoid clipping by device masks.
for folder, size in sizes.items():
    out_dir = root / folder
    canvas = Image.new('RGBA', (size, size), (8, 10, 12, 255))
    fg_size = max(1, int(size * 0.88))
    fg = im.resize((fg_size, fg_size), Image.Resampling.LANCZOS)
    pos = ((size - fg_size)//2, (size - fg_size)//2)
    canvas.alpha_composite(fg, pos)
    canvas.save(out_dir / 'ic_launcher_foreground.png', optimize=True)

# Web/PWA icons used by manifest where supported.
web_dir = Path('app/icons')
web_dir.mkdir(parents=True, exist_ok=True)
for size in (192, 512):
    icon = im.resize((size, size), Image.Resampling.LANCZOS)
    icon.save(web_dir / f'icon-{size}.png', optimize=True)

print('MusyFit launcher icon applied from', source)
