import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import escenario_props as E
from papel_common import paper
from PIL import Image
from playwright.sync_api import sync_playwright
OUT=sys.argv[1]
os.makedirs(OUT,exist_ok=True)
meta={}
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page()
    for name,(fn,tipo,col) in E.PROPS.items():
        w,h,svg=E.svg_of(name)
        sub={'interactivo':'interactivos','decoracion':'decoracion','cascaron':'cascaron'}[tipo]
        d=f'{OUT}/{sub}'; os.makedirs(f'{d}/svg',exist_ok=True); os.makedirs(f'{d}/png',exist_ok=True)
        open(f'{d}/svg/{name}.svg','w').write(svg)
        big=svg.replace(f'width="{w}" height="{h}"',f'width="{w*2}" height="{h*2}"',1)
        pg.set_viewport_size({'width':w*2,'height':h*2})
        pg.set_content(f'<body style="margin:0;background:transparent">{big}</body>')
        pg.locator('svg').screenshot(path='/tmp/p.png',omit_background=True)
        im=paper(Image.open('/tmp/p.png').convert('RGBA'),border=10)
        im.save(f'{d}/png/{name}@2x.png',optimize=True)
        meta[name]={'tipo':tipo,'colocacion':col,'tamano_1x':[w,h],'ancla':'centro-inferior' if col=='piso' else 'centro','archivo':f'{sub}/png/{name}@2x.png'}
    b.close()
json.dump(meta,open(f'{OUT}/props.json','w'),ensure_ascii=False,indent=2)
# hoja de revisión
ims=[(n,Image.open(f"{OUT}/{m['archivo']}")) for n,m in meta.items()]
W=1800; x=y=0; rowh=0; pos=[]
for n,im in ims:
    s=im.resize((im.width//2,im.height//2))
    if x+s.width>W: x=0; y+=rowh+20; rowh=0
    pos.append((s,x,y)); x+=s.width+20; rowh=max(rowh,s.height)
sheet=Image.new('RGBA',(W,y+rowh+10),(42,35,120,255))
for s,x,y in pos: sheet.alpha_composite(s,(x,y))
sheet.convert('RGB').save(f'{OUT}/_hoja-revision.png'); print(len(meta))
