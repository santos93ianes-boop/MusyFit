from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path('android/app/src/main/res')
sizes={'mipmap-mdpi':48,'mipmap-hdpi':72,'mipmap-xhdpi':96,'mipmap-xxhdpi':144,'mipmap-xxxhdpi':192}
for folder,size in sizes.items():
    p=root/folder; p.mkdir(parents=True,exist_ok=True)
    im=Image.new('RGB',(size,size),(7,11,13)); d=ImageDraw.Draw(im)
    # stylized M / dumbbell mark
    orange=(255,91,10); white=(242,244,245)
    w=max(2,size//14)
    cy=size//2
    d.line((size*.18,size*.32,size*.18,size*.68),fill=white,width=w)
    d.line((size*.10,size*.40,size*.10,size*.60),fill=white,width=w)
    d.line((size*.82,size*.32,size*.82,size*.68),fill=white,width=w)
    d.line((size*.90,size*.40,size*.90,size*.60),fill=white,width=w)
    pts=[(size*.25,size*.66),(size*.25,size*.33),(size*.50,size*.54),(size*.75,size*.33),(size*.75,size*.66),(size*.67,size*.66),(size*.67,size*.49),(size*.50,size*.64),(size*.33,size*.49),(size*.33,size*.66)]
    d.polygon(pts,fill=orange)
    r=size*.055; d.ellipse((size*.5-r,size*.25-r,size*.5+r,size*.25+r),fill=white)
    for name in ['ic_launcher.png','ic_launcher_round.png','ic_launcher_foreground.png']:
        im.save(p/name)
