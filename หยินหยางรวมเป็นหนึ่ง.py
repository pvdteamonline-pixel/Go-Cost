import os
from pathlib import Path

# --- [1] ส่วนกำหนดค่า (Constants) ป้องกัน Syntax Error จากการก๊อปวาง ---
T_HEADER  = "#Go-Cost"
T_FILE    = "### 📄 File: "
T_BLOCK   = "```"
T_SEP     = "---"
NL        = chr(10) # Newline character

def run_unbreakable():
    # บังคับ Path ให้แม่นยำที่สุด
    curr = Path(__file__).parent.absolute()
    os.chdir(curr)
    
    out_name = 'Go-Cost.md'
    out_path = curr / out_name

    # ตั้งค่าตัวกรอง (Ignore)
    skip_dir = {'.git', 'node_modules', '.vercel', 'dist', 'build', 'public'}
    skip_file = {'package-lock.json', 'src.zip', out_name, Path(__file__).name}
    skip_ext = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.zip', '.pdf'}

    print(f"📍 Target: {curr}")
    
    try:
        count = 0
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(T_HEADER + NL + NL)

            for p in curr.rglob('*'):
                # กรองไฟล์ขยะและโฟลเดอร์
                if p.is_dir() or any(d in p.parts for d in skip_dir): continue
                if p.name in skip_file or p.suffix.lower() in skip_ext: continue
                
                # 🚨 SECURITY: กรองไฟล์ Config/Env ที่อาจจะมี API Key
                if '.env' in p.name.lower(): continue

                try:
                    # อ่าน Content แบบ UTF-8
                    txt = p.read_text(encoding='utf-8')
                    ext = p.suffix[1:] if p.suffix else 'text'
                    
                    # เขียนลงไฟล์แยกส่วน เพื่อลดโอกาส Syntax พัง
                    f.write(T_FILE + "`" + str(p.relative_to(curr)) + "`" + NL)
                    f.write(T_BLOCK + ext + NL)
                    f.write(txt)
                    f.write(NL + T_BLOCK + NL + NL + T_SEP + NL + NL)
                    
                    count += 1
                    print(f"✅ อ่านสำเร็จ: {p.name}")
                except:
                    continue

        print(f"{NL}✨ สำเร็จ! รวมไป {count} ไฟล์")
        print(f"📂 ไฟล์อยู่ที่: {out_path}")

    except Exception as e:
        print(f"{NL}❌ พัง! เพราะว่า: {e}")

if __name__ == "__main__":
    run_unbreakable()
    print(NL + "="*40)
    input("กด Enter เพื่อปิดนะเพื่อน...")