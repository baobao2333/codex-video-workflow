"""Contact sheet made from the exact render(frame) outputs."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

p = Path(__file__).resolve().parent
t = json.loads((p/'timeline.json').read_text(encoding='utf-8'))
sheet = Image.new('RGB', (1440, 1160), '#101015')
draw = ImageDraw.Draw(sheet)
font = ImageFont.truetype(str(p/'assets/NotoMedium.ttf'), 18)
for i, scene in enumerate(t['scenes']):
    x, y = (i%3)*480, (i//3)*290
    frame = Image.open(p/f"frames/frame-{scene['still']:.3f}.png").convert('RGB').resize((480, 270))
    sheet.paste(frame, (x, y))
    draw.text((x+10, y+270), f"{scene['start']:05.2f}s  {scene['title']}", font=font, fill='#e5e4da')
sheet.save(p/'frames/storyboard.jpg', quality=93)
