// ─────────────────────────────────────────────────────────────────
// ตัวช่วย parse ไฟล์บัญชี (.xlsx) ที่ export จากโปรแกรมบัญชีจริง (Express ฯลฯ)
// ใช้ร่วมกันทั้งไฟล์ "ประมาณการกำไรขาดทุน" และ "งบทดลอง"
//
// บั๊กสำคัญที่ต้องกันไว้เสมอ: รหัสบัญชีรูปแบบ "NNNN-NN" (เช่น 6001-01, 6110-03)
// ถูก Excel ตีความเป็นวันที่โดยอัตโนมัติในไฟล์จริงที่ตรวจสอบมา (เช่น 6001-01
// กลายเป็นวันที่ 1 มกราคม ปี 6001) — ต้องแปลงกลับเป็นข้อความรหัสให้ถูกต้องเสมอ
// ก่อนใช้งาน ไม่งั้นจะดึงรหัสผิดเพี้ยนไปครึ่งไฟล์โดยไม่มี error ให้เห็น
// ─────────────────────────────────────────────────────────────────

export const MONTH_ABBR = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
export const CODE_RE = /^\d{4}(-\d{2})+$/

// แปลงค่าจากเซลล์ (ที่อาจถูก Excel แปลงเป็นวันที่โดยไม่ตั้งใจ) กลับเป็นรหัสบัญชี
// ที่ถูกต้อง — รองรับทั้งกรณีเป็น Date object, ข้อความปกติ, และเครื่องหมาย ditto (")
export function normalizeCodeCell(cell, lastCode) {
  if (cell === undefined || cell === null || cell === '') return null
  if (cell instanceof Date) {
    // Excel/SheetJS ตีความ "6001-01" เป็นวันที่ ปี 6001 เดือน 1 — แปลงกลับ
    const year = cell.getFullYear()
    const month = String(cell.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }
  const str = String(cell).trim()
  if (str === '') return null
  if (str === '"') return lastCode ?? null
  return str
}

// ค่าตัวเลขในไฟล์บัญชีไทยมักเขียน "-" แทนศูนย์/ว่าง แทนที่จะเป็น 0 หรือ blank จริง
export function parseAccountingNumber(cell) {
  if (cell === undefined || cell === null || cell === '') return 0
  if (typeof cell === 'number') return cell
  const str = String(cell).trim()
  if (str === '' || str === '-' || str.startsWith('-----')) return 0
  const n = Number(str.replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

export function findHeaderRow(rows, requiredLabels) {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i] || []
    const ok = requiredLabels.every((label) => row.some((c) => typeof c === 'string' && c.includes(label)))
    if (ok) return i
  }
  return -1
}

// ─────────────────────────────────────────────────────────────────
// parseTrialBalanceSheet — งบทดลอง Express (เลขที่บัญชี/แผนก/ชื่อบัญชี/ยอดยกมา/
// ยอดเคลื่อนไหว/ยอดคงเหลือ) โครงสร้างต่างจากไฟล์ประมาณการกำไรขาดทุนโดยสิ้นเชิง
//
// จุดสำคัญที่ต้องระวัง (พบจริงในไฟล์ตัวอย่าง):
// 1. รหัสบัญชีถูก Excel แปลงเป็นวันที่ — ใช้ normalizeCodeCell แก้แล้ว
// 2. ไฟล์มี "2 รายงานซ้อนกัน" ในชีตเดียว (บริษัทหลัก คอลัมน์ซ้าย + สาขา/บัญชี
//    "(001)" คอลัมน์ขวา ห่างกันด้วยคอลัมน์ว่าง) — ต้องอ่านแค่บล็อกซ้ายเท่านั้น
//    (ตรวจจับโดยหาตำแหน่งที่ "เลขที่บัญชี" ปรากฏซ้ำในแถวหัวตาราง แล้วตัดที่ตรงนั้น
//    แทนการ hardcode เลขคอลัมน์ เผื่อไฟล์ในอนาคตมีจำนวนคอลัมน์ไม่เท่าเดิม)
// 3. ใช้ยอด "เคลื่อนไหว" (การเปลี่ยนแปลงในช่วงที่เลือก) ไม่ใช่ยอดยกมา/คงเหลือ
// 4. เก็บเป็นยอดสุทธิ (เดบิทเคลื่อนไหว - เครดิตเคลื่อนไหว) ต่อรหัส — ค่าบวก =
//    ฝั่งเดบิท, ค่าลบ = ฝั่งเครดิต (ให้ report คำนวณจากเครื่องหมายแทนการเดาจาก
//    ชื่อหมวดหมู่ ซึ่งแม่นยำกว่า)
// ─────────────────────────────────────────────────────────────────
export function parseTrialBalanceSheet(sheetRows) {
  const headerIdx = findHeaderRow(sheetRows, ['เลขที่บัญชี', 'ชื่อบัญชี'])
  if (headerIdx === -1) return { rows: [], error: 'ไม่พบหัวตาราง "เลขที่บัญชี" / "ชื่อบัญชี" ในชีตนี้' }

  const header = sheetRows[headerIdx]
  const labelRow = sheetRows[headerIdx - 1] || [] // แถวเหนือหัวตาราง มี "ยอดเคลื่อนไหว" กำกับ

  // หาบล็อกซ้าย/ขวา: ตำแหน่งที่ "เลขที่บัญชี" ปรากฏครั้งที่ 2 คือจุดเริ่มบล็อกขวา (ตัดทิ้ง)
  const codeColIndexes = []
  header.forEach((c, i) => { if (typeof c === 'string' && c.includes('เลขที่บัญชี')) codeColIndexes.push(i) })
  const blockEnd = codeColIndexes.length > 1 ? codeColIndexes[1] : header.length

  const codeCol = codeColIndexes[0]
  const nameCol = header.findIndex((c, i) => i < blockEnd && typeof c === 'string' && c.includes('ชื่อบัญชี'))

  const movementLabelCol = labelRow.findIndex((c, i) => i < blockEnd && typeof c === 'string' && c.includes('ยอดเคลื่อนไหว'))
  if (movementLabelCol === -1) return { rows: [], error: 'ไม่พบคอลัมน์ "ยอดเคลื่อนไหว" ในชีตนี้' }
  const debitCol = movementLabelCol
  const creditCol = movementLabelCol + 1

  const results = []
  let lastCode = null
  for (let r = headerIdx + 1; r < sheetRows.length; r++) {
    const row = sheetRows[r] || []
    const name = row[nameCol]
    const code = normalizeCodeCell(row[codeCol], lastCode)
    if (!code || !CODE_RE.test(code)) continue
    lastCode = code

    const debit = parseAccountingNumber(row[debitCol])
    const credit = parseAccountingNumber(row[creditCol])
    const net = debit - credit
    if (net === 0) continue

    results.push({ code, amount: net, description: name ? String(name).trim() : '' })
  }
  return { rows: results, error: null, blockEnd }
}
