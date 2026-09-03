const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'generated-images');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
const dataset = require('./dataset.js');

const PY = path.join(__dirname, '_gen_img.py');

function tryFont(size) {
  for (const f of [
    '/Library/Fonts/Arial.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
    '/System/Library/Fonts/Helvetica.ttc'
  ]) {
    try { return `ImageFont.truetype(${JSON.stringify(f)}, ${size})`; } catch (e) {}
  }
  return 'ImageFont.load_default()';
}

const code = `
import math, random, os
from PIL import Image, ImageDraw, ImageFont
random.seed(42)
OUT = ${JSON.stringify(OUT_DIR)}
DATA = ${JSON.stringify(dataset)}

def font(size):
    for f in [${["'/Library/Fonts/Arial.ttf'","'/System/Library/Fonts/Supplemental/Arial.ttf'"].join(',')}]:
        try: return ImageFont.truetype(f, size)
        except: pass
    return ImageFont.load_default()

def ecg(path, pid, diag):
    W,H=1000,500
    img=Image.new("RGB",(W,H),(255,255,255)); d=ImageDraw.Draw(img)
    for x in range(0,W,10): d.line([(x,0),(x,H)],fill=(235,235,235),width=1)
    for y in range(0,H,10): d.line([(0,y),(W,y)],fill=(235,235,235),width=1)
    for x in range(0,W,50): d.line([(x,0),(x,H)],fill=(215,215,215),width=1)
    for y in range(0,H,50): d.line([(0,y),(W,y)],fill=(215,215,215),width=1)
    pts=[]; b=H*0.55
    for i in range(W):
        ph=i%200
        y=b + 6*math.sin(ph/16) + 42*math.exp(-((ph-40)**2)/22) - 8*math.exp(-((ph-140)**2)/30) + 4*math.sin(i/140)
        pts.append((i,y))
    d.line(pts,fill=(20,20,20),width=2)
    d.text((20,20),f"ECG 12-LEAD | {pid}",fill=(0,0,0),font=font(16))
    d.text((20,46),diag,fill=(60,60,60),font=font(13))
    img.save(path)

def xray(path,pid,diag,part):
    W,H=600,820
    img=Image.new("L",(W,H),28); d=ImageDraw.Draw(img)
    for _ in range(14000):
        img.putpixel((random.randint(0,W-1),random.randint(0,H-1)),random.randint(20,95))
    if part=="chest":
        for i in range(7):
            y=H*0.18+i*64
            d.arc([-40,y,90,y+240],90,270,fill=155,width=9)
            d.arc([W-90,y,W+40,y+240],270,90,fill=155,width=9)
        d.ellipse([W*0.08,H*0.26,W*0.47,H*0.78],fill=16,outline=140,width=5)
        d.ellipse([W*0.53,H*0.26,W*0.92,H*0.78],fill=16,outline=140,width=5)
        d.ellipse([W*0.30,H*0.40,W*0.70,H*0.64],fill=58,outline=150,width=4)
        for i in range(6): d.rectangle([W*0.485,H*0.32+i*45,W*0.515,H*0.32+i*45+32],fill=165)
    elif part=="bone":
        d.rounded_rectangle([W*0.24,H*0.08,W*0.30,H*0.52],radius=14,fill=150,outline=200)
        d.ellipse([W*0.19,H*0.5,W*0.35,H*0.96],fill=140,outline=200)
        d.line([(int(W*0.4),0),(int(W*0.4),H)],fill=200,width=2)
    elif part=="skull":
        d.ellipse([W*0.2,H*0.12,W*0.8,H*0.9],fill=38,outline=180,width=7)
        d.ellipse([W*0.28,H*0.3,W*0.4,H*0.52],fill=66,outline=150,width=4)
        d.ellipse([W*0.6,H*0.3,W*0.72,H*0.52],fill=66,outline=150,width=4)
    d2=ImageDraw.Draw(img)
    d2.text((20,18),f"{part.upper()} X-RAY | {pid}",fill=255,font=font(18))
    d2.text((20,48),diag,fill=225,font=font(13))
    img.save(path)

def usg(path,pid,diag):
    W,H=640,480
    img=Image.new("L",(W,H),14); d=ImageDraw.Draw(img)
    for _ in range(10000):
        img.putpixel((random.randint(0,W-1),random.randint(0,H-1)),random.randint(10,75))
    d.pieslice([-120,H-10,500,W+110],180,360,fill=68,outline=200,width=2)
    d.ellipse([W*0.3,H*0.22,W*0.92,H*0.62],fill=38,outline=170,width=3)
    d.rectangle([0,H-58,W,H],fill=70)
    d.text((20,H-42),f"USG | {pid} | {diag}",fill=255,font=font(15))
    d.text((20,18),"HealthLedger US 7.0 MHz",fill=200,font=font(13))
    img.save(path)

def mri(path,pid,diag):
    W,H=700,700
    img=Image.new("L",(W,H),18); d=ImageDraw.Draw(img)
    d.ellipse([W*0.2,H*0.14,W*0.8,H*0.86],fill=88,outline=160,width=4)
    d.ellipse([W*0.3,H*0.27,W*0.7,H*0.73],fill=58,outline=130,width=3)
    d.ellipse([W*0.38,H*0.4,W*0.62,H*0.62],fill=38,outline=110,width=3)
    d.ellipse([W*0.42,H*0.42,W*0.48,H*0.5],fill=140)
    d.ellipse([W*0.52,H*0.42,W*0.58,H*0.5],fill=140)
    if random.random()>0.4: d.ellipse([W*0.55,H*0.6,W*0.66,H*0.72],fill=195,outline=235,width=3)
    for _ in range(5000):
        img.putpixel((random.randint(0,W-1),random.randint(0,H-1)),random.randint(12,55))
    d2=ImageDraw.Draw(img)
    d2.text((20,20),f"MRI Axial | {pid}",fill=230,font=font(16))
    d2.text((20,48),diag,fill=205,font=font(13))
    d2.text((20,H-30),"HealthLedger Neuro MRI",fill=200,font=font(13))
    img.save(path)

def ct(path,pid,diag):
    W,H=520,520
    img=Image.new("L",(W,H),16); d=ImageDraw.Draw(img)
    for _ in range(16000):
        img.putpixel((random.randint(0,W-1),random.randint(0,H-1)),random.randint(10,92))
    d.ellipse([W*0.25,H*0.24,W*0.75,H*0.76],fill=68,outline=170,width=4)
    d.ellipse([W*0.4,H*0.4,W*0.6,H*0.6],fill=44,outline=120,width=3)
    d.ellipse([W*0.5,H*0.52,W*0.565,H*0.585],fill=210,outline=240,width=2)
    d2=ImageDraw.Draw(img)
    d2.text((20,20),f"CT | {pid}",fill=230,font=font(16))
    d2.text((20,48),diag,fill=205,font=font(13))
    d2.text((20,H-28),"HealthLedger Radiology",fill=200,font=font(13))
    img.save(path)

def report(path,pid,diag,dept,name):
    W,H=820,1020
    img=Image.new("RGB",(W,H),(248,248,248)); d=ImageDraw.Draw(img)
    d.rectangle([0,0,W,90],fill=(18,38,78))
    d.text((30,22),"HEALTHLEDGER MEDICAL REPORT",fill=(255,255,255),font=font(26))
    d.text((30,58),dept.upper(),fill=(200,212,235),font=font(18))
    d.rectangle([30,120,W-30,225],outline=(175,175,175),fill=(255,255,255))
    d.text((50,140),f"Patient ID  : {pid}",fill=(40,40,40),font=font(18))
    d.text((50,178),f"Physician   : {name}",fill=(40,40,40),font=font(18))
    d.text((50,260),"DIAGNOSIS",fill=(18,38,78),font=font(20))
    d.text((50,292),diag,fill=(55,55,55),font=font(18))
    d.rectangle([30,350,W-30,590],outline=(175,175,175),fill=(255,255,255))
    d.text((50,370),"Clinical Notes:",fill=(18,38,78),font=font(18))
    note=diag+" - Findings consistent on imaging and clinical exam."
    d.text((50,408),note[:70],fill=(60,60,60),font=font(16))
    d.text((50,440),"Treatment plan and follow-up schedule documented.",fill=(60,60,60),font=font(16))
    d.text((50,472),"Report reviewed and signed electronically.",fill=(60,60,60),font=font(16))
    d.text((50,H-90),f"Generated 2026-09-03 | Signed: {name}",fill=(120,120,120),font=font(14))
    d.line([(50,H-62),(W-50,H-62)],fill=(120,120,120),width=2)
    img.save(path)

def skin(path,pid,diag):
    W,H=500,500
    img=Image.new("RGB",(W,H),(243,208,188)); d=ImageDraw.Draw(img)
    for _ in range(2600):
        x=random.randint(0,W-1);y=random.randint(0,H-1);v=random.randint(232,255)
        img.putpixel((x,y),(v,int(v*0.86),int(v*0.78)))
    d.ellipse([W*0.3,H*0.3,W*0.7,H*0.7],fill=(122,60,50),outline=(90,40,30),width=4)
    d.ellipse([W*0.34,H*0.34,W*0.66,H*0.66],fill=(152,82,60))
    d2=ImageDraw.Draw(img)
    d2.text((20,20),f"Dermatology | {pid}",fill=(80,30,20),font=font(16))
    d2.text((20,50),diag,fill=(100,40,30),font=font(13))
    img.save(path)
`;

const py = code + `
count=0
for p in DATA:
    pid=p["patientId"]; dept=p["department"]; diag=p["diagnosis"]; name=p["doctor"]
    out=os.path.join(OUT,f"{pid}.png")
    if dept in ("Cardiology","Emergency"):
        ecg(out,pid,diag)
    elif dept in ("Orthopaedics","General Surgery"):
        part="bone" if any(k in diag for k in ["Fracture","Replacement","ACL","Tendon","Spondylosis"]) else "chest"
        xray(out,pid,diag,part)
    elif dept=="OB-GYN":
        usg(out,pid,diag)
    elif dept=="Neurology":
        mri(out,pid,diag)
    elif dept in ("Oncology","Radiology","Internal Medicine"):
        ct(out,pid,diag)
    elif dept=="Dermatology":
        skin(out,pid,diag)
    else:
        report(out,pid,diag,dept,name)
    count+=1
print(f"Generated {count} images")
`;

fs.writeFileSync(PY, py);
const result = execFileSync('python3', [PY], { encoding: 'utf8', cwd: __dirname });
console.log(result.trim());
