# รวมภาพนิ่งจาก out/stills เป็น contact sheet (out/sheetN.jpg) — python scripts/contact_sheet.py
import sys, glob, os
from PIL import Image, ImageDraw
files = sorted(glob.glob('out/stills/*.png'))
cols = 3; tw = 640; th = 360
for page in range(0, len(files), 9):
    chunk = files[page:page+9]
    rows = (len(chunk)+cols-1)//cols
    sheet = Image.new('RGB', (cols*tw+ (cols+1)*8, rows*(th+30)+8), (30,30,30))
    d = ImageDraw.Draw(sheet)
    for i,f in enumerate(chunk):
        im = Image.open(f).convert('RGB').resize((tw,th))
        x = 8 + (i%cols)*(tw+8); y = 8 + (i//cols)*(th+30)
        sheet.paste(im,(x,y)); d.text((x+4,y+th+4), os.path.basename(f), fill=(255,255,255))
    sheet.save(f'out/sheet{page//9}.jpg', quality=85)
print('ok')
