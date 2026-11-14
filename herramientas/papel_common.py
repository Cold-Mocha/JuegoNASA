from PIL import Image, ImageFilter
def paper(im, border=9):
    a=im.split()[-1]
    g=a.filter(ImageFilter.MaxFilter(border*2+1)).filter(ImageFilter.GaussianBlur(1.2)).point(lambda v:255 if v>100 else 0)
    out=Image.new('RGBA',im.size,(0,0,0,0)); w=Image.new('RGBA',im.size,(250,248,240,255)); w.putalpha(g)
    out.alpha_composite(w); out.alpha_composite(im); return out
