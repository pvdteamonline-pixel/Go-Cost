/**
 * executiveReportPivot.js
 * Single Source of Truth helper for generating the Executive Report Pivot Table
 * matching Template Excel "ประมาณการกำไร(ขาดทุน)เบื้องต้น"
 */

export const MONTH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

// Template Excel Row Specification
export const EXEC_REPORT_PIVOT_STRUCTURE = [
  // ─── ส่วนที่ 1: รายได้ ───
  {
    type: 'section',
    title: 'ส่วนที่ 1: รายได้',
    id: 'sec-1-revenue',
  },
  { code: '4100-01', name: 'รายได้จากการขาย', type: 'item', section: 'revenue' },
  { code: '4100-05', name: 'รายได้จากการขายต่างประเทศ', type: 'item', section: 'revenue' },
  { code: '4200-08', name: 'รายได้อื่น ๆ', type: 'item', section: 'revenue' },
  { code: '4100-03', name: 'หัก รับคืนสินค้า', type: 'item', section: 'revenue', deduct: true },
  { code: '', name: 'รายได้ขั้นต้น', type: 'formula', id: 'gross-revenue' },
  { code: '4100-04', name: 'หัก ส่วนลดจ่าย', type: 'item', section: 'revenue', deduct: true },
  { code: '5130-02', name: 'บวก ส่วนลดรับ', type: 'item', section: 'revenue', add: true },
  { code: '', name: 'รวมรายได้', type: 'formula', id: 'total-revenue', isBold: true, showAvg: true },

  // ─── ส่วนที่ 2: ต้นทุนสินค้า และกำไรขั้นต้น ───
  {
    type: 'section-header',
    title: 'หัก ต้นทุนสินค้าและค่าใช้จ่ายในการขายและบริหาร',
    id: 'sec-2-cogs-header',
  },
  { code: '', name: 'คิดเป็น%', type: 'pct-row', id: 'cogs-pct' },
  { code: '', name: 'ต้นทุนสินค้า', type: 'cogs-row', id: 'cogs', isBold: true, showAvg: true, showPct: true },
  { code: '', name: 'คิดเป็น%', type: 'pct-row', id: 'cogs-pct-check' },
  { code: '', name: 'รายได้-ต้นทุน = กำไรขั้นต้น ยังไม่หักค่าใช้จ่ายของกิจการ', type: 'formula', id: 'gross-profit', isBold: true, showAvg: true, showPct: true },

  // ─── ส่วนที่ 3: ค่าใช้จ่ายในการขายและบริหาร (3.1 - 3.15) ───
  {
    type: 'cat-group',
    id: 'cat-3-1',
    catNum: '3.1',
    title: '3.1 ต้นทุนในการขาย',
    items: [
      { code: '5130-04', name: 'ค่าใช้จ่ายนำเข้าและค่าขนส่งเข้า' },
      { code: '5130-06', name: 'ค่าวัสดุสิ้นเปลือง-เพื่อจำหน่าย' },
      { code: '5130-07', name: 'ค่าอากรขาเข้า' },
      { code: '5130-12', name: 'ค่าลับคม' },
    ],
  },
  {
    type: 'cat-group-dual',
    id: 'cat-3-2',
    catNum: '3.2',
    title: '3.2 ค่าใช้จ่ายในการขาย/ฝ่ายขาย/PC',
    subGroups: [
      {
        subId: '3-2-1',
        title: 'เงินเดือนฝ่ายขาย',
        items: [
          { code: '5130-08', name: 'เงินเดือน-ฝ่ายขาย' },
          { code: '6110-03', name: 'ค่าเบี้ยเลี้ยง 1/2' },
          { code: '6120-14', name: 'ค่าจ้าง-ฝ่ายขาย+PC 1/3' },
        ],
      },
      {
        subId: '3-2-2',
        title: 'ค่านายหน้า/คอมมิชชั่น',
        items: [
          { code: '6000-01', name: 'ค่านายหน้า 1/2' },
          { code: '6110-08', name: 'คอมมิชชั่น (พนักงานบริษัทPC+/ฝ่ายขาย)' },
          { code: '6000-26', name: 'ค่านายหน้า 2/2-ไม่ใชพนักงาน' },
        ],
      },
    ],
  },
  {
    type: 'cat-group',
    id: 'cat-3-3',
    catNum: '3.3',
    title: '3.3 ค่าใช้จ่ายในการขาย/ส่งเสริมการขาย',
    items: [
      { code: '6000-02', name: 'ค่าโฆษณา' },
      { code: '6000-03', name: 'ค่าสินค้าตัวอย่าง' },
      { code: '6000-04', name: 'ค่าส่งเสริมการขาย-ทั่วไป' },
      { code: '6000-27', name: 'ค่าส่งเสริมการขาย-AB(แอมบาสเดอร์)' },
      { code: '6000-28', name: 'ค่าส่งเสริมการขาย-WS(เวิร์คช๊อป)' },
      { code: '6000-29', name: 'ค่าส่งเสริมการขาย-รีวิวสินค้า,ถ่ายคอนเท้น,TESTER' },
      { code: '6000-30', name: 'ค่าส่งเสริมการขาย-สนับสนุน' },
      { code: '6000-31', name: 'ค่าส่งเสริมการขาย-ตั้งกอง/พรีเมี่ยม' },
      { code: '6000-14-15-16', name: 'ค่าบริการพื้นที่-จัดงาน,ออกบูธ,วางสินค้า-WS', matchCodes: ['6000-14', '6000-15', '6000-16', '6000-14-15-16'] },
      { code: '6000-23', name: 'ค่าโรงแรม-ค่าที่พัก WS' },
    ],
  },
  {
    type: 'cat-group',
    id: 'cat-3-4',
    catNum: '3.4',
    title: '3.4 ค่าใช้จ่ายในการขาย/ค่าขนส่ง/เดินทาง',
    items: [
      { code: '6000-13', name: 'ค่าใช้จ่ายเดินทางไปต่างประเทศ' },
      { code: '6000-05', name: 'ค่าขนส่ง' },
      { code: '6000-09', name: 'ค่าใช้จ่ายเดินทางและยานพาหนะ' },
      { code: '6000-11', name: 'ค่าทางด่วน' },
      { code: '6000-12', name: 'ค่าน้ำมัน' },
      { code: '6001-01', name: 'ค่าขนส่ง-SHOPEE' },
      { code: '6001-02', name: 'ค่าขนส่ง-LAZADA' },
      { code: '6001-03', name: 'ค่าขนส่ง-SPX Express' },
      { code: '6001-04', name: 'ค่าขนส่ง-ROCKET8' },
      { code: '6130-04', name: 'ค่าไปรษณีย์' },
    ],
  },
  {
    type: 'cat-group',
    id: 'cat-3-5',
    catNum: '3.5',
    title: '3.5 ค่าใช้จ่ายในการขาย/แพลตฟอร์ม',
    items: [
      { code: '6000-17', name: 'ค่าบริการ,ค่าธรรมเนียม-Line@' },
      { code: '6000-19', name: 'ค่าบริการ,ค่าธรรมเนียม-SHOPEE' },
      { code: '6000-20', name: 'ค่าบริการ,ค่าธรรมเนียม-LAZADA' },
      { code: '6000-22', name: 'ค่าบริการ,ค่าธรรมเนียม-SPX Express' },
      { code: '6000-24', name: 'ค่าบริการ,ค่าธรรมเนียม-ROCKET8' },
    ],
  },
  {
    type: 'cat-group',
    id: 'cat-3-6',
    catNum: '3.6',
    title: '3.6 ค่าใช้จ่ายในการบริหาร',
    items: [
      { code: '6110-01', name: 'เงินเดือน-แผนก/บริหาร', nameKw: 'บริหาร' },
      { code: '6110-01', name: 'เงินเดือน-แผนก/บัญชี', nameKw: 'บัญชี' },
      { code: '6110-01', name: 'เงินเดือน-แผนก/ออนไลน์', nameKw: 'ออนไลน์' },
      { code: '6110-01', name: 'เงินเดือน-แผนก/คลัง', nameKw: 'คลัง' },
      { code: '6110-01', name: 'เงินเดือน-แผนก/-ขนส่ง/ซ่อมบำรุง', nameKw: 'ขนส่ง' },
      { code: '6110-01', name: 'เงินเดือน-แผนก/การตลาด', nameKw: 'การตลาด' },
      { code: '6110-01', name: 'เงินเดือน-แผนก/แม่บ้าน', nameKw: 'แม่บ้าน' },
      { code: '6110-01', name: 'เงินเดือน', isFallbackSalary: true },
      { code: '6110-19', name: 'ค่าเบี้ยเลี้ยง 2/2 -WS' },
      { code: '6120-14', name: 'ค่าจ้าง 2/3' },
      { code: '6110-02', name: 'ค่าล่วงเวลา-แผนก/บัญชี', nameKw: 'บัญชี' },
      { code: '6110-02', name: 'ค่าล่วงเวลา-แผนก/ออนไลน์', nameKw: 'ออนไลน์' },
      { code: '6110-02', name: 'ค่าล่วงเวลา-แผนก/คลัง', nameKw: 'คลัง' },
      { code: '6110-02', name: 'ค่าล่วงเวลา-แผนก/-ขนส่ง/ซ่อมบำรุง', nameKw: 'ขนส่ง' },
      { code: '6110-04', name: 'โบนัส (ยังไม่ได้เอามาตั้ง)' },
      { code: '6110-05', name: 'เงินเพิ่มพิเศษ' },
      { code: '6110-09', name: 'เงินสมทบกองทุนประกันสังคม' },
      { code: '6110-10', name: 'เงินสมทบกองทุนทดแทน' },
    ],
  },
  {
    type: 'cat-group',
    id: 'cat-3-7',
    catNum: '3.7',
    title: '3.7 สวัสดิการ',
    items: [
      { code: '6100-12', name: 'ค่าอบรมสัมนา' },
      { code: '6110-17', name: 'ค่าสวัสดิการอื่น ๆ' },
      { code: '6000-06', name: 'ค่ารับรอง' },
    ],
  },
  {
    type: 'cat-group',
    id: 'cat-3-8',
    catNum: '3.8',
    title: '3.8 ค่าเครื่องเขียน/วัสดุสิ้นเปลือง/ค่าซ่อมแซม',
    items: [
      { code: '6120-01', name: 'ค่าเครื่องเขียนแบบพิมพ์' },
      { code: '6120-02', name: 'ค่าซ่อมแซม,ตกแต่ง,ต่อเติม-สำนักงาน' },
      { code: '6120-03', name: 'วัสดุสิ้นเปลือง' },
      { code: '6120-08', name: 'ค่าซ่อมแซมเครื่องใช้,อุปกรณ์ สนง.' },
      { code: '6120-09', name: 'ค่าซ่อมแซมยานพาหนะ' },
      { code: '6120-10', name: 'ค่าอะไหล่และอุปกรณ์' },
    ],
  },
  {
    type: 'cat-group',
    id: 'cat-3-9',
    catNum: '3.9',
    title: '3.9 ค่าบริการ/ค่าจ้าง',
    items: [
      { code: '6120-12', name: 'ค่าบริการทำบัญชี' },
      { code: '6120-13', name: 'ค่าบริการ' },
      { code: '6120-18', name: 'ค่าจ้าง 3/3' },
      { code: '6120-15', name: 'ค่าที่ปรึกษา' },
    ],
  },
  {
    type: 'cat-group',
    id: 'cat-3-10',
    catNum: '3.10',
    title: '3.10 ค่าเช่า',
    items: [
      { code: '6120-16', name: 'ค่าเช่าอาคาร' },
      { code: '6120-17', name: 'ค่าเช่ายานพาหนะ' },
    ],
  },
  {
    type: 'cat-group',
    id: 'cat-3-11',
    catNum: '3.11',
    title: '3.11 ค่าสาธารณูปโภค',
    items: [
      { code: '6130-01', name: 'ค่าโทรศัพท์' },
      { code: '6130-02', name: 'ค่าไฟฟ้า' },
      { code: '6130-03', name: 'ค่าน้ำประปา' },
      { code: '6130-06', name: 'ค่าอินเทอร์เน็ต' },
    ],
  },
  {
    type: 'cat-group',
    id: 'cat-3-12',
    catNum: '3.12',
    title: '3.12 ค่าเบี้ยประกัน/ธรรมเนียมต่างๆ',
    items: [
      { code: '6130-05', name: 'ค่าอากรแสตมป์', matchCodes: ['6130-05', '6150-05'] },
      { code: '6150-04', name: 'ค่าเบี้ยประกัน-ยานพาหนะ' },
      { code: '6150-05', name: 'ค่าเบี้ยประกัน-ทรัพย์สิน' },
      { code: '6160-01', name: 'ค่าภาษีบำรุงท้องที่และภาษีโรงเรือน' },
      { code: '6160-02', name: 'ค่าภาษียานพาหนะ' },
      { code: '6160-04', name: 'ค่าธรรมเนียมธนาคาร' },
      { code: '6160-07', name: 'ค่าธรรมเนียมอื่นๆ/อย.,มอก' },
      { code: '6170-04', name: 'ค่าบริจาคการกุศล' },
    ],
  },
  {
    type: 'cat-group',
    id: 'cat-3-13',
    catNum: '3.13',
    title: '3.13 อื่นๆ',
    items: [
      { code: '6170-06', name: 'ค่าใช้จ่ายเบ็ดเตล็ด' },
    ],
  },
  {
    type: 'cat-group',
    id: 'cat-3-14',
    catNum: '3.14',
    title: '3.14 ค่าดอกเบี้ย',
    items: [
      { code: '6170-01', name: 'ดอกเบี้ยจ่าย' },
      { code: '6170-09', name: 'ดอกเบี้ย O/D' },
    ],
  },
  {
    type: 'cat-group',
    id: 'cat-3-15',
    catNum: '3.15',
    title: '3.15 อื่นๆ/ไม่ถือเป็นรายจ่ายจริง/บวกกับ',
    items: [
      { code: '6170-08', name: 'ส่วนขาดเงินเกินเศษสตางค์' },
      { code: '6190-01', name: 'ภาษีซื้อไม่ขอคืน' },
      { code: '6190-02', name: 'ภาษีซื้อขอคืนไม่ได้' },
      { code: '6190-03', name: 'เบี้ยปรับเงินเพิ่ม' },
      { code: '6190-04', name: 'ค่าใช้จ่ายต้องห้ามฯ' },
    ],
  },

  // ─── ส่วนที่ 4: สรุปยอดรวมท้ายรายงาน ───
  {
    type: 'section',
    title: 'ส่วนที่ 4: สรุปยอดรวมท้ายรายงาน',
    id: 'sec-4-summary',
  },
  { code: '', name: 'คิดเป็น%', type: 'pct-row', id: 'total-exp-pct' },
  { code: '', name: 'รวมค่าใช้จ่ายทั้งหมดของกิจการ', type: 'formula', id: 'total-exp', isBold: true, showAvg: true, showPct: true },
  { code: '', name: 'DIF', type: 'diff-row', id: 'dif' },
  { code: '', name: 'ประมาณการกำไร(ขาดทุน)', type: 'formula', id: 'net-profit', isBold: true, showAvg: true },
]

/**
 * Builds the complete Pivot dataset for rendering and exporting.
 * @param {Object} rawData - Response data from RPC / DB query (contains rawAccounts, groups, etc.)
 * @param {number} year - Selected year
 * @param {string} monthFilter - '' for full year, or '1'-'12' for selected month
 */
export function buildExecutivePivotData(rawData, year, monthFilter = '') {
  // Extract or build lookup map of account lines: code -> { code, name, monthly: [12], total }
  const accountMap = new Map()

  // Helper to extract monthly array safely
  const getMonthlyArr = (item) => {
    if (Array.isArray(item.monthly) && item.monthly.length === 12) {
      return item.monthly.map((v) => Number(v) || 0)
    }
    return Array(12).fill(0)
  }

  // 1. Map from rawAccounts if available
  if (Array.isArray(rawData?.rawAccounts)) {
    rawData.rawAccounts.forEach((acc) => {
      if (acc.code) {
        accountMap.set(acc.code, {
          code: acc.code,
          name: acc.name || '',
          monthly: getMonthlyArr(acc),
          total: Number(acc.total) || 0,
        })
      }
    })
  }

  // 2. Fallback to groups & ungroupedAccounts if rawAccounts is not available
  if (accountMap.size === 0) {
    if (Array.isArray(rawData?.groups)) {
      rawData.groups.forEach((g) => {
        if (Array.isArray(g.accounts)) {
          g.accounts.forEach((a) => {
            if (a.code && !accountMap.has(a.code)) {
              accountMap.set(a.code, {
                code: a.code,
                name: a.name || '',
                monthly: getMonthlyArr(a),
                total: Number(a.total) || 0,
              })
            }
          })
        }
      })
    }
    if (Array.isArray(rawData?.ungroupedAccounts)) {
      rawData.ungroupedAccounts.forEach((a) => {
        if (a.code && !accountMap.has(a.code)) {
          accountMap.set(a.code, {
            code: a.code,
            name: a.name || '',
            monthly: getMonthlyArr(a),
            total: Number(a.total) || 0,
          })
        }
      })
    }
  }

  // Calculate active months count (months where there is at least one transaction in database)
  let activeMonths = 0
  for (let m = 0; m < 12; m++) {
    let monthHasData = false
    for (const acc of accountMap.values()) {
      if (acc.monthly[m] !== 0) {
        monthHasData = true
        break
      }
    }
    if (monthHasData) activeMonths++
  }
  // If activeMonths is 0 (no data), default to 1 for division safety
  const activeMonthsCount = activeMonths > 0 ? activeMonths : 1

  // Helper to fetch monthly amounts for a specified account code or list of matching codes
  const getItemMonthly = (spec) => {
    let monthly = Array(12).fill(0)
    if (!spec.code && !spec.matchCodes) return monthly

    const targetCodes = spec.matchCodes || [spec.code]
    for (const code of targetCodes) {
      if (accountMap.has(code)) {
        const accData = accountMap.get(code)
        accData.monthly.forEach((val, i) => {
          monthly[i] += val
        })
      }
    }
    return monthly
  }

  // Calculate Section 1: Revenue
  const rev4100_01 = getItemMonthly({ code: '4100-01' })
  const rev4100_05 = getItemMonthly({ code: '4100-05' })
  const rev4200_08 = getItemMonthly({ code: '4200-08' })
  const rev4100_03 = getItemMonthly({ code: '4100-03' }) // หัก รับคืนสินค้า

  // รายได้ขั้นต้น = (4100-01 + 4100-05 + 4200-08) - 4100-03
  const grossRevMonthly = Array(12).fill(0).map((_, i) =>
    (rev4100_01[i] + rev4100_05[i] + rev4200_08[i]) - rev4100_03[i]
  )

  const rev4100_04 = getItemMonthly({ code: '4100-04' }) // หัก ส่วนลดจ่าย
  const rev5130_02 = getItemMonthly({ code: '5130-02' }) // บวก ส่วนลดรับ

  // รวมรายได้ = รายได้ขั้นต้น - 4100-04 + 5130-02
  const totalRevMonthly = Array(12).fill(0).map((_, i) =>
    grossRevMonthly[i] - rev4100_04[i] + rev5130_02[i]
  )
  const totalRevSum = totalRevMonthly.reduce((a, b) => a + b, 0)

  // Section 2: COGS (ต้นทุนสินค้า)
  // COGS could be explicitly imported under 5100-01 or 5001-01 or direct cogs value
  let cogsMonthly = getItemMonthly({ code: '5100-01', matchCodes: ['5100-01', '5001-01', '5100-00', '5100-99'] })
  const hasCogsInAcc = cogsMonthly.some((v) => v !== 0)
  if (!hasCogsInAcc && rawData?.cogsMonthly) {
    cogsMonthly = getMonthlyArr({ monthly: rawData.cogsMonthly })
  }
  const cogsTotal = cogsMonthly.reduce((a, b) => a + b, 0)

  // Gross Profit = รวมรายได้ - ต้นทุนสินค้า
  const grossProfitMonthly = Array(12).fill(0).map((_, i) => totalRevMonthly[i] - cogsMonthly[i])
  const grossProfitTotal = grossProfitMonthly.reduce((a, b) => a + b, 0)

  // Track subtotal of expenses for Section 3 (3.1 to 3.15)
  let grandTotalExpMonthly = Array(12).fill(0)
  let grandTotalExpSum = 0

  // Track used account codes to find unmatched codes
  const usedAccountCodes = new Set([
    '4100-01', '4100-05', '4200-08', '4100-03', '4100-04', '5130-02',
    '5100-01', '5001-01', '5100-00', '5100-99',
  ])

  // Build the complete list of rendered rows
  const rows = []

  // Function to add a row to table
  const addRow = (rowObj) => {
    // Apply month filter if selected
    let monthly = rowObj.monthly ? [...rowObj.monthly] : Array(12).fill(0)
    let total = rowObj.total !== undefined ? rowObj.total : monthly.reduce((a, b) => a + b, 0)

    if (monthFilter) {
      const mIdx = Number(monthFilter) - 1
      const mVal = monthly[mIdx] || 0
      monthly = Array(12).fill(0)
      monthly[mIdx] = mVal
      total = mVal
    }

    const effectiveActiveMonths = monthFilter ? 1 : activeMonthsCount
    const avgPerMonth = total / effectiveActiveMonths

    let pctOfRevenue = null
    const denominator = monthFilter ? totalRevMonthly[Number(monthFilter) - 1] : totalRevSum
    if (denominator && denominator !== 0 && rowObj.showPct) {
      pctOfRevenue = Number(((total / denominator) * 100).toFixed(2))
    }

    rows.push({
      ...rowObj,
      monthly,
      total,
      avgPerMonth,
      pctOfRevenue,
    })
  }

  // Iterate structure
  for (const block of EXEC_REPORT_PIVOT_STRUCTURE) {
    if (block.type === 'section') {
      rows.push({ type: 'section', title: block.title, id: block.id })
    } else if (block.type === 'section-header') {
      rows.push({ type: 'section-header', title: block.title, id: block.id })
    } else if (block.type === 'item') {
      usedAccountCodes.add(block.code)
      if (block.matchCodes) block.matchCodes.forEach((c) => usedAccountCodes.add(c))

      let mArr = Array(12).fill(0)
      if (block.code === '4100-01') mArr = rev4100_01
      else if (block.code === '4100-05') mArr = rev4100_05
      else if (block.code === '4200-08') mArr = rev4200_08
      else if (block.code === '4100-03') mArr = rev4100_03
      else if (block.code === '4100-04') mArr = rev4100_04
      else if (block.code === '5130-02') mArr = rev5130_02
      else mArr = getItemMonthly(block)

      addRow({
        code: block.code,
        name: block.name,
        type: 'item',
        monthly: mArr,
        deduct: block.deduct,
        add: block.add,
      })
    } else if (block.type === 'formula') {
      if (block.id === 'gross-revenue') {
        addRow({
          code: '',
          name: 'รายได้ขั้นต้น',
          type: 'formula',
          monthly: grossRevMonthly,
          isBold: true,
        })
      } else if (block.id === 'total-revenue') {
        addRow({
          code: '',
          name: 'รวมรายได้',
          type: 'formula',
          monthly: totalRevMonthly,
          isBold: true,
          showAvg: true,
        })
      } else if (block.id === 'gross-profit') {
        addRow({
          code: '',
          name: 'รายได้-ต้นทุน = กำไรขั้นต้น ยังไม่หักค่าใช้จ่ายของกิจการ',
          type: 'formula',
          monthly: grossProfitMonthly,
          isBold: true,
          showAvg: true,
          showPct: true,
        })
      }
    } else if (block.type === 'pct-row') {
      if (block.id === 'cogs-pct') {
        const pctVal = totalRevSum > 0 ? Number(((cogsTotal / totalRevSum) * 100).toFixed(2)) : 0
        rows.push({
          code: '',
          name: 'คิดเป็น%',
          type: 'pct-row',
          pctValue: `${pctVal}%`,
        })
      } else if (block.id === 'cogs-pct-check') {
        const pctVal = totalRevSum > 0 ? Number((((totalRevSum - cogsTotal) / totalRevSum) * 100).toFixed(2)) : 100
        rows.push({
          code: '',
          name: 'คิดเป็น%',
          type: 'pct-row',
          pctValue: `${pctVal}%`,
        })
      }
    } else if (block.type === 'cogs-row') {
      addRow({
        code: '',
        name: 'ต้นทุนสินค้า',
        type: 'cogs-row',
        monthly: cogsMonthly,
        isBold: true,
        showAvg: true,
        showPct: true,
      })
    } else if (block.type === 'cat-group') {
      // Standard category sub-group (3.1, 3.3-3.15)
      let subGroupMonthly = Array(12).fill(0)

      // Calculate total sub-group expense for pct header
      const catItemRows = []
      block.items.forEach((itemSpec) => {
        usedAccountCodes.add(itemSpec.code)
        if (itemSpec.matchCodes) itemSpec.matchCodes.forEach((c) => usedAccountCodes.add(c))

        const mArr = getItemMonthly(itemSpec)
        mArr.forEach((v, i) => { subGroupMonthly[i] += v })

        catItemRows.push({
          code: itemSpec.code,
          name: itemSpec.name,
          type: 'item',
          monthly: mArr,
        })
      })

      const catSum = subGroupMonthly.reduce((a, b) => a + b, 0)
      const catPct = totalRevSum > 0 ? Number(((catSum / totalRevSum) * 100).toFixed(2)) : 0

      // Add Category Header Row
      rows.push({
        type: 'category-header',
        title: `${block.title} (${catPct}%)`,
        catNum: block.catNum,
      })

      // Add Items
      catItemRows.forEach((r) => addRow(r))

      // Add Subtotal Row ("รวม")
      addRow({
        code: '',
        name: `รวม ${block.title.replace(/^3\.\d+\s*/, '')}`,
        type: 'subtotal',
        monthly: subGroupMonthly,
        isBold: true,
        showAvg: true,
        showPct: true,
      })

      // Add to grand total of expenses
      subGroupMonthly.forEach((v, i) => { grandTotalExpMonthly[i] += v })
      grandTotalExpSum += catSum
    } else if (block.type === 'cat-group-dual') {
      // 3.2 Category with dual sub-groups
      let catTotalMonthly = Array(12).fill(0)
      block.subGroups.forEach((sg) => {
        sg.items.forEach((itemSpec) => {
          usedAccountCodes.add(itemSpec.code)
          const mArr = getItemMonthly(itemSpec)
          mArr.forEach((v, i) => { catTotalMonthly[i] += v })
        })
      })
      const catTotalSum = catTotalMonthly.reduce((a, b) => a + b, 0)
      const catPct = totalRevSum > 0 ? Number(((catTotalSum / totalRevSum) * 100).toFixed(2)) : 0

      // Add Main Category Header
      rows.push({
        type: 'category-header',
        title: `${block.title} (${catPct}%)`,
        catNum: block.catNum,
      })

      // Sub-group 1 & Sub-group 2
      block.subGroups.forEach((sg) => {
        let sgMonthly = Array(12).fill(0)
        const sgRows = []

        sg.items.forEach((itemSpec) => {
          usedAccountCodes.add(itemSpec.code)
          const mArr = getItemMonthly(itemSpec)
          mArr.forEach((v, i) => { sgMonthly[i] += v })
          sgRows.push({
            code: itemSpec.code,
            name: itemSpec.name,
            type: 'item',
            monthly: mArr,
          })
        })

        // Sub-group items
        sgRows.forEach((r) => addRow(r))

        // Sub-group Subtotal row ("รวม")
        addRow({
          code: '',
          name: `รวม (${sg.title})`,
          type: 'subtotal',
          monthly: sgMonthly,
          isBold: true,
          showAvg: true,
          showPct: true,
        })

        // Add to grand total of expenses
        sgMonthly.forEach((v, i) => { grandTotalExpMonthly[i] += v })
        grandTotalExpSum += sgMonthly.reduce((a, b) => a + b, 0)
      })
    }
  }

  // Section 4 summary formulas
  // รวมค่าใช้จ่ายทั้งหมดของกิจการ
  const totalExpPct = totalRevSum > 0 ? Number(((grandTotalExpSum / totalRevSum) * 100).toFixed(2)) : 0
  rows.push({
    code: '',
    name: 'คิดเป็น%',
    type: 'pct-row',
    pctValue: `${totalExpPct}%`,
  })

  addRow({
    code: '',
    name: 'รวมค่าใช้จ่ายทั้งหมดของกิจการ',
    type: 'formula',
    id: 'total-exp',
    monthly: grandTotalExpMonthly,
    isBold: true,
    showAvg: true,
    showPct: true,
  })

  // DIF Row
  rows.push({
    code: '',
    name: 'DIF',
    type: 'diff-row',
    value: '-',
  })

  // ประมาณการกำไร(ขาดทุน) = กำไรขั้นต้น - รวมค่าใช้จ่ายทั้งหมดของกิจการ
  const netProfitMonthly = Array(12).fill(0).map((_, i) => grossProfitMonthly[i] - grandTotalExpMonthly[i])
  addRow({
    code: '',
    name: 'ประมาณการกำไร(ขาดทุน)',
    type: 'formula',
    id: 'net-profit',
    monthly: netProfitMonthly,
    isBold: true,
    showAvg: true,
  })

  // Check for any unmatched / ungrouped account codes from DB
  const unmatchedAccounts = []
  accountMap.forEach((acc, code) => {
    if (!usedAccountCodes.has(code) && acc.total !== 0) {
      unmatchedAccounts.push(acc)
    }
  })

  return {
    year,
    activeMonthsCount,
    totalRevSum,
    totalRevMonthly,
    cogsTotal,
    grossProfitTotal,
    grandTotalExpSum,
    netProfitTotal: grossProfitTotal - grandTotalExpSum,
    rows,
    unmatchedAccounts,
  }
}
