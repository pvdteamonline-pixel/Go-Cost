/**
 * executiveReportPivot.js
 * Single Source of Truth helper for generating the Executive Report Pivot Table
 * matching Template Excel "ประมาณการกำไร(ขาดทุน)เบื้องต้น"
 */

export const MONTH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

// Category Options for Custom Mapping
export const PIVOT_CATEGORY_OPTIONS = [
  { value: 'auto', label: '⚡ อัตโนมัติ (ตามผังมาตรฐาน)' },
  { value: 'cogs', label: '📦 ต้นทุนสินค้า (COGS)' },
  { value: 'rev_4100_01', label: '💰 รายได้จากการขาย (4100-01)' },
  { value: 'rev_4100_05', label: '✈️ รายได้จากการขายต่างประเทศ (4100-05)' },
  { value: 'rev_4200_08', label: '💵 รายได้อื่น ๆ (4200-08)' },
  { value: 'rev_4100_03', label: '↩️ หัก รับคืนสินค้า (4100-03)' },
  { value: 'rev_4100_04', label: '✂️ หัก ส่วนลดจ่าย (4100-04)' },
  { value: 'rev_5130_02', label: '➕ บวก ส่วนลดรับ (5130-02)' },
  { value: 'cat_3_1', label: '3.1 ต้นทุนในการขาย' },
  { value: 'cat_3_2_1', label: '3.2.1 เงินเดือนฝ่ายขาย' },
  { value: 'cat_3_2_2', label: '3.2.2 ค่านายหน้า/คอมมิชชั่น' },
  { value: 'cat_3_3', label: '3.3 ค่าใช้จ่ายในการขาย/ส่งเสริมการขาย' },
  { value: 'cat_3_4', label: '3.4 ค่าใช้จ่ายในการขาย/ค่าขนส่ง/เดินทาง' },
  { value: 'cat_3_5', label: '3.5 ค่าใช้จ่ายในการขาย/แพลตฟอร์ม' },
  { value: 'cat_3_6', label: '3.6 ค่าใช้จ่ายในการบริหาร' },
  { value: 'cat_3_7', label: '3.7 สวัสดิการ' },
  { value: 'cat_3_8', label: '3.8 ค่าเครื่องเขียน/วัสดุสิ้นเปลือง/ค่าซ่อมแซม' },
  { value: 'cat_3_9', label: '3.9 ค่าบริการ/ค่าจ้าง' },
  { value: 'cat_3_10', label: '3.10 ค่าเช่า' },
  { value: 'cat_3_11', label: '3.11 ค่าสาธารณูปโภค' },
  { value: 'cat_3_12', label: '3.12 ค่าเบี้ยประกัน/ธรรมเนียมต่างๆ' },
  { value: 'cat_3_13', label: '3.13 อื่นๆ' },
  { value: 'cat_3_14', label: '3.14 ค่าดอกเบี้ย' },
  { value: 'cat_3_15', label: '3.15 อื่นๆ/ไม่ถือเป็นรายจ่ายจริง/บวกกับ' },
]

// Template Excel Row Specification
export const EXEC_REPORT_PIVOT_STRUCTURE = [
  // ─── ส่วนที่ 1: รายได้ ───
  {
    type: 'section',
    title: 'ส่วนที่ 1: รายได้',
    id: 'sec-1-revenue',
  },
  { code: '4100-01', name: 'รายได้จากการขาย', type: 'item', section: 'revenue', categoryKey: 'rev_4100_01' },
  { code: '4100-05', name: 'รายได้จากการขายต่างประเทศ', type: 'item', section: 'revenue', categoryKey: 'rev_4100_05' },
  { code: '4200-08', name: 'รายได้อื่น ๆ', type: 'item', section: 'revenue', categoryKey: 'rev_4200_08' },
  { code: '4100-03', name: 'หัก รับคืนสินค้า', type: 'item', section: 'revenue', deduct: true, categoryKey: 'rev_4100_03' },
  { code: '', name: 'รายได้ขั้นต้น', type: 'formula', id: 'gross-revenue' },
  { code: '4100-04', name: 'หัก ส่วนลดจ่าย', type: 'item', section: 'revenue', deduct: true, categoryKey: 'rev_4100_04' },
  { code: '5130-02', name: 'บวก ส่วนลดรับ', type: 'item', section: 'revenue', add: true, categoryKey: 'rev_5130_02' },
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
    categoryKey: 'cat_3_1',
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
        categoryKey: 'cat_3_2_1',
        title: 'เงินเดือนฝ่ายขาย',
        items: [
          { code: '5130-08', name: 'เงินเดือน-ฝ่ายขาย' },
          { code: '6110-03', name: 'ค่าเบี้ยเลี้ยง 1/2' },
          { code: '6120-14', name: 'ค่าจ้าง-ฝ่ายขาย+PC 1/3' },
        ],
      },
      {
        subId: '3-2-2',
        categoryKey: 'cat_3_2_2',
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
    categoryKey: 'cat_3_3',
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
    categoryKey: 'cat_3_4',
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
    categoryKey: 'cat_3_5',
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
    categoryKey: 'cat_3_6',
    catNum: '3.6',
    title: '3.6 ค่าใช้จ่ายในการบริหาร',
    items: [
      { code: '6110-01', name: 'เงินเดือน-แผนก/บริหาร' },
      { code: '6110-01-01', name: 'เงินเดือน-แผนก/บัญชี' },
      { code: '6110-01-02', name: 'เงินเดือน-แผนก/ออนไลน์' },
      { code: '6110-01-03', name: 'เงินเดือน-แผนก/คลัง' },
      { code: '6110-01-04', name: 'เงินเดือน-แผนก/-ขนส่ง/ซ่อมบำรุง' },
      { code: '6110-01-05', name: 'เงินเดือน-แผนก/การตลาด' },
      { code: '6110-01-06', name: 'เงินเดือน-แผนก/แม่บ้าน' },
      { code: '6110-01-07', name: 'เงินเดือน' },
      { code: '6110-02', name: 'ค่าล่วงเวลา-แผนก/บัญชี' },
      { code: '6110-02-01', name: 'ค่าล่วงเวลา-แผนก/ออนไลน์' },
      { code: '6110-02-02', name: 'ค่าล่วงเวลา-แผนก/คลัง' },
      { code: '6110-02-03', name: 'ค่าล่วงเวลา-แผนก/-ขนส่ง/ซ่อมบำรุง' },
      { code: '6110-04', name: 'โบนัส (ยังไม่ได้เอามาตั้ง)' },
      { code: '6110-05', name: 'เงินเพิ่มพิเศษ' },
      { code: '6110-09', name: 'เงินสมทบกองทุนประกันสังคม' },
      { code: '6110-10', name: 'เงินสมทบกองทุนทดแทน' },
      { code: '6110-19', name: 'ค่าเบี้ยเลี้ยง 2/2 -WS' },
      { code: '6120-19', name: 'ค่าจ้าง 3/3' },
    ],
    autoPrefixes: ['6110-01-', '6110-02-'],
  },
  {
    type: 'cat-group',
    id: 'cat-3-7',
    categoryKey: 'cat_3_7',
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
    categoryKey: 'cat_3_8',
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
    categoryKey: 'cat_3_9',
    catNum: '3.9',
    title: '3.9 ค่าบริการ/ค่าจ้าง',
    items: [
      { code: '6120-12', name: 'ค่าบริการทำบัญชี' },
      { code: '6120-13', name: 'ค่าบริการ' },
      { code: '6120-18', name: 'ค่าจ้าง 2/3' },
      { code: '6120-15', name: 'ค่าที่ปรึกษา' },
    ],
  },
  {
    type: 'cat-group',
    id: 'cat-3-10',
    categoryKey: 'cat_3_10',
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
    categoryKey: 'cat_3_11',
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
    categoryKey: 'cat_3_12',
    catNum: '3.12',
    title: '3.12 ค่าเบี้ยประกัน/ธรรมเนียมต่างๆ',
    items: [
      { code: '6130-05', name: 'ค่าอากรแสตมป์' },
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
    categoryKey: 'cat_3_13',
    catNum: '3.13',
    title: '3.13 อื่นๆ',
    items: [
      { code: '6170-06', name: 'ค่าใช้จ่ายเบ็ดเตล็ด' },
    ],
  },
  {
    type: 'cat-group',
    id: 'cat-3-14',
    categoryKey: 'cat_3_14',
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
    categoryKey: 'cat_3_15',
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
 * Checks if an account code or name represents Cost of Goods Sold (COGS)
 */
export function isCogsAccount(acc) {
  if (!acc || !acc.code) return false
  const cleanCode = acc.code.trim()
  const cleanName = (acc.name || '').trim()

  // Exclude specific 3.1 / 3.2 expense items that start with 5130
  if (['5130-04', '5130-06', '5130-07', '5130-12', '5130-08', '5130-02'].includes(cleanCode)) {
    return false
  }

  // Account codes for COGS: 50xx, 51xx, 52xx or name matches
  if (/^5[012]\d{2}/.test(cleanCode) || /^5\d{3}/.test(cleanCode)) {
    return true
  }

  // Name keywords for COGS
  if (/ต้นทุนสินค้า|ต้นทุนขาย|ต้นทุนผลิต|วัตถุดิบ|COGS/i.test(cleanName)) {
    return true
  }

  return false
}

/**
 * Builds the complete Pivot dataset for rendering and exporting.
 * @param {Object} rawData - Response data from RPC / DB query (contains rawAccounts, groups, etc.)
 * @param {number} year - Selected year
 * @param {string} monthFilter - '' for full year, or '1'-'12' for selected month
 * @param {Object} customMappings - Map of account code -> custom category key
 */
export function buildExecutivePivotData(rawData, year, monthFilter = '', customMappings = {}) {
  // Extract or build lookup map of account lines: code -> { code, name, monthly: [12], total }
  const accountMap = new Map()

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

  // 1b. ALWAYS populate accountMap from groups accounts too
  //     (even when rawAccounts exists) so sub-accounts added to groups show correctly
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

  // 2. ALWAYS add ungroupedAccounts to accountMap too
  //    (SQL returns both groups AND ungroupedAccounts; ungrouped accounts include COGS accounts
  //     that may not belong to any expense group — must always be visible for COGS detection)
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
  const activeMonthsCount = activeMonths > 0 ? activeMonths : 1

  // Track used account codes to identify unmatched/unmapped items
  const usedAccountCodes = new Set()

  // Helper to fetch monthly amounts for a single item spec
  // excludeGroupExtra=true skips section-2 (extra mapped accounts) — used in cat-group loops
  // so extra accounts are NOT baked into every item row (which would double-count them).
  const getItemMonthly = (spec, categoryKey = null, excludeGroupExtra = false) => {
    let monthly = Array(12).fill(0)
    const targetCodes = spec.matchCodes || (spec.code ? [spec.code] : [])

    // 1. Sum up default matched codes (unless user explicitly mapped them elsewhere)
    for (const code of targetCodes) {
      const userMapping = customMappings[code]
      if (userMapping && userMapping !== 'auto' && userMapping !== categoryKey) {
        // User mapped this code to a different category, skip default matching
        continue
      }
      if (accountMap.has(code)) {
        usedAccountCodes.add(code)
        const accData = accountMap.get(code)
        accData.monthly.forEach((val, i) => {
          monthly[i] += val
        })
      }
    }

    // 2. Sum up any other account codes explicitly mapped to this category by user.
    //    Only executed when NOT inside a group item loop (excludeGroupExtra=false).
    //    When inside a group loop, extra-mapped accounts are handled once in getExtraGroupMonthly.
    if (categoryKey && !excludeGroupExtra) {
      accountMap.forEach((acc, accCode) => {
        if (customMappings[accCode] === categoryKey && !targetCodes.includes(accCode)) {
          usedAccountCodes.add(accCode)
          acc.monthly.forEach((val, i) => {
            monthly[i] += val
          })
        }
      })
    }

    return monthly
  }

  // Helper: collect extra accounts that user mapped to a categoryKey but are NOT in knownCodes
  // Returns { rows: [{code,name,monthly}], monthly: [12] }
  const getExtraGroupMonthly = (categoryKey, knownCodes) => {
    const extraRows = []
    let extraMonthly = Array(12).fill(0)
    accountMap.forEach((acc, accCode) => {
      if (
        customMappings[accCode] === categoryKey &&
        !knownCodes.has(accCode)
      ) {
        usedAccountCodes.add(accCode)
        acc.monthly.forEach((val, i) => { extraMonthly[i] += val })
        extraRows.push({ code: accCode, name: acc.name, type: 'item', monthly: acc.monthly.slice() })
      }
    })
    return { rows: extraRows, monthly: extraMonthly }
  }

  // Calculate Section 1: Revenue
  const rev4100_01 = getItemMonthly({ code: '4100-01' }, 'rev_4100_01')
  const rev4100_05 = getItemMonthly({ code: '4100-05' }, 'rev_4100_05')
  const rev4200_08 = getItemMonthly({ code: '4200-08' }, 'rev_4200_08')
  const rev4100_03 = getItemMonthly({ code: '4100-03' }, 'rev_4100_03') // หัก รับคืนสินค้า

  // รายได้ขั้นต้น = (4100-01 + 4100-05 + 4200-08) - 4100-03
  const grossRevMonthly = Array(12).fill(0).map((_, i) =>
    (rev4100_01[i] + rev4100_05[i] + rev4200_08[i]) - rev4100_03[i]
  )

  const rev4100_04 = getItemMonthly({ code: '4100-04' }, 'rev_4100_04') // หัก ส่วนลดจ่าย
  const rev5130_02 = getItemMonthly({ code: '5130-02' }, 'rev_5130_02') // บวก ส่วนลดรับ

  // รวมรายได้ = รายได้ขั้นต้น - 4100-04 + 5130-02
  const totalRevMonthly = Array(12).fill(0).map((_, i) =>
    grossRevMonthly[i] - rev4100_04[i] + rev5130_02[i]
  )
  const totalRevSum = totalRevMonthly.reduce((a, b) => a + b, 0)

  // Section 2: COGS (ต้นทุนสินค้า)
  // Smart COGS detection: find all accounts that match COGS rules or are mapped to 'cogs'
  let cogsMonthly = Array(12).fill(0)
  const detectedCogsCodes = []

  accountMap.forEach((acc, code) => {
    const userMapping = customMappings[code]
    const isExplicitCogs = userMapping === 'cogs'
    const isAutoCogs = (!userMapping || userMapping === 'auto') && isCogsAccount(acc)

    if (isExplicitCogs || isAutoCogs) {
      usedAccountCodes.add(code)
      detectedCogsCodes.push(code)
      acc.monthly.forEach((val, i) => {
        cogsMonthly[i] += val
      })
    }
  })

  // Fallback to rawData.cogsMonthly if accountMap has 0 COGS but rawData provided it
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

  // Build the complete list of rendered rows
  const rows = []

  // Function to add a row to table
  const addRow = (rowObj) => {
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
      let mArr = Array(12).fill(0)
      if (block.code === '4100-01') mArr = rev4100_01
      else if (block.code === '4100-05') mArr = rev4100_05
      else if (block.code === '4200-08') mArr = rev4200_08
      else if (block.code === '4100-03') mArr = rev4100_03
      else if (block.code === '4100-04') mArr = rev4100_04
      else if (block.code === '5130-02') mArr = rev5130_02
      else mArr = getItemMonthly(block, block.categoryKey)

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
        // Monthly COGS% = COGS_month / Revenue_month * 100
        let monthlyPct = totalRevMonthly.map((rev, i) =>
          rev > 0 ? Number(((cogsMonthly[i] / rev) * 100).toFixed(2)) : 0
        )
        if (monthFilter) {
          const mIdx = Number(monthFilter) - 1
          monthlyPct = monthlyPct.map((v, i) => i === mIdx ? v : 0)
        }
        rows.push({
          code: '',
          name: 'คิดเป็น%',
          type: 'pct-row',
          pctValue: `${pctVal}%`,
          monthlyPct,
        })
      } else if (block.id === 'cogs-pct-check') {
        const pctVal = totalRevSum > 0 ? Number((((totalRevSum - cogsTotal) / totalRevSum) * 100).toFixed(2)) : 100
        // Monthly GrossProfit% = (Revenue_month - COGS_month) / Revenue_month * 100
        let monthlyPct = totalRevMonthly.map((rev, i) =>
          rev > 0 ? Number((((rev - cogsMonthly[i]) / rev) * 100).toFixed(2)) : 0
        )
        if (monthFilter) {
          const mIdx = Number(monthFilter) - 1
          monthlyPct = monthlyPct.map((v, i) => i === mIdx ? v : 0)
        }
        rows.push({
          code: '',
          name: 'คิดเป็น%',
          type: 'pct-row',
          pctValue: `${pctVal}%`,
          monthlyPct,
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
      const catItemRows = []

      // Collect known codes in this group (including matchCodes aliases)
      const knownGroupCodes = new Set()
      block.items.forEach((itemSpec) => {
        const codes = itemSpec.matchCodes || (itemSpec.code ? [itemSpec.code] : [])
        codes.forEach((c) => knownGroupCodes.add(c))
      })

      // Each item gets only its OWN monthly (excludeGroupExtra=true)
      block.items.forEach((itemSpec) => {
        const mArr = getItemMonthly(itemSpec, block.categoryKey, true)
        mArr.forEach((v, i) => { subGroupMonthly[i] += v })
        catItemRows.push({
          code: itemSpec.code,
          name: itemSpec.name,
          type: 'item',
          monthly: mArr,
        })
      })

      // Check autoPrefixes (e.g. for salary/OT sub-accounts like 6110-01-*, 6110-02-*)
      if (Array.isArray(block.autoPrefixes)) {
        accountMap.forEach((acc, accCode) => {
          if (!knownGroupCodes.has(accCode) && !usedAccountCodes.has(accCode)) {
            const matchesPrefix = block.autoPrefixes.some((pfx) => accCode.startsWith(pfx))
            const userMapping = customMappings[accCode]
            if (matchesPrefix && (!userMapping || userMapping === 'auto' || userMapping === block.categoryKey)) {
              knownGroupCodes.add(accCode)
              usedAccountCodes.add(accCode)
              acc.monthly.forEach((v, i) => { subGroupMonthly[i] += v })
              catItemRows.push({
                code: accCode,
                name: acc.name || accCode,
                type: 'item',
                monthly: acc.monthly.slice(),
              })
            }
          }
        })
      }

      // Append extra accounts user mapped to this category (not in items list)
      const extra = getExtraGroupMonthly(block.categoryKey, knownGroupCodes)
      extra.rows.forEach((r) => {
        catItemRows.push(r)
        r.monthly.forEach((v, i) => { subGroupMonthly[i] += v })
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
      // First pass: compute total for header % only (exclude extra to avoid double counting)
      let catTotalMonthly = Array(12).fill(0)
      block.subGroups.forEach((sg) => {
        const knownSgCodes = new Set()
        sg.items.forEach((itemSpec) => {
          const codes = itemSpec.matchCodes || (itemSpec.code ? [itemSpec.code] : [])
          codes.forEach((c) => knownSgCodes.add(c))
        })
        sg.items.forEach((itemSpec) => {
          const mArr = getItemMonthly(itemSpec, sg.categoryKey, true)
          mArr.forEach((v, i) => { catTotalMonthly[i] += v })
        })
        const extra = getExtraGroupMonthly(sg.categoryKey, knownSgCodes)
        extra.monthly.forEach((v, i) => { catTotalMonthly[i] += v })
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

        const knownSgCodes = new Set()
        sg.items.forEach((itemSpec) => {
          const codes = itemSpec.matchCodes || (itemSpec.code ? [itemSpec.code] : [])
          codes.forEach((c) => knownSgCodes.add(c))
        })

        sg.items.forEach((itemSpec) => {
          const mArr = getItemMonthly(itemSpec, sg.categoryKey, true)
          mArr.forEach((v, i) => { sgMonthly[i] += v })
          sgRows.push({
            code: itemSpec.code,
            name: itemSpec.name,
            type: 'item',
            monthly: mArr,
          })
        })

        // Append extra accounts user mapped to this sub-group
        const extra = getExtraGroupMonthly(sg.categoryKey, knownSgCodes)
        extra.rows.forEach((r) => {
          sgRows.push(r)
          r.monthly.forEach((v, i) => { sgMonthly[i] += v })
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
    } else if (block.type === 'cat-group-dynamic') {
      // Dynamic category group — renders accounts from rawData.groups matching dbGroupKeyword,
      // or falls back to fallbackItems (deduplicating codes to prevent duplicate amounts)
      let subGroupMonthly = Array(12).fill(0)
      const catItemRows = []
      const addedCodes = new Set()

      // Try to find matching group(s) from DB by keyword
      const dbGroups = Array.isArray(rawData?.groups) ? rawData.groups : []
      const matchingGroups = block.dbGroupKeyword
        ? dbGroups.filter((g) =>
            g.name?.includes(block.dbGroupKeyword) ||
            g.code?.includes(block.dbGroupKeyword)
          )
        : []

      if (matchingGroups.length > 0) {
        // Use accounts from matching DB groups (dynamic — respects new sub-accounts)
        matchingGroups.forEach((dbGroup) => {
          if (Array.isArray(dbGroup.accounts)) {
            dbGroup.accounts.forEach((acc) => {
              if (!acc.code || addedCodes.has(acc.code)) return
              // Respect customMappings: if user explicitly moved this code to another category, skip it here
              const userMapping = customMappings[acc.code]
              if (userMapping && userMapping !== 'auto' && userMapping !== block.categoryKey) return
              addedCodes.add(acc.code)
              usedAccountCodes.add(acc.code)
              const mArr = getMonthlyArr(acc)
              mArr.forEach((v, i) => { subGroupMonthly[i] += v })
              catItemRows.push({
                code: acc.code,
                name: acc.name || acc.code,
                type: 'item',
                monthly: mArr,
              })
            })
          }
        })
        // Also render fallbackItems with non-zero amounts not covered by DB group
        if (Array.isArray(block.fallbackItems)) {
          block.fallbackItems.forEach((itemSpec) => {
            if (!itemSpec.code || addedCodes.has(itemSpec.code)) return
            // Respect customMappings: skip if user moved this elsewhere
            const userMapping = customMappings[itemSpec.code]
            if (userMapping && userMapping !== 'auto' && userMapping !== block.categoryKey) {
              addedCodes.add(itemSpec.code) // mark as handled so getExtraGroupMonthly won't add it to wrong group
              return
            }
            addedCodes.add(itemSpec.code)
            const mArr = getItemMonthly(itemSpec, block.categoryKey, true)
            if (mArr.some((v) => v !== 0)) {
              mArr.forEach((v, i) => { subGroupMonthly[i] += v })
              catItemRows.push({ code: itemSpec.code, name: itemSpec.name, type: 'item', monthly: mArr })
            }
          })
        }
      } else {
        // Fallback: use fallbackItems deduped by code
        const fallbackItems = block.fallbackItems || []
        fallbackItems.forEach((itemSpec) => {
          if (!itemSpec.code || addedCodes.has(itemSpec.code)) return
          // Respect customMappings: skip if user moved this elsewhere
          const userMapping = customMappings[itemSpec.code]
          if (userMapping && userMapping !== 'auto' && userMapping !== block.categoryKey) {
            addedCodes.add(itemSpec.code)
            return
          }
          addedCodes.add(itemSpec.code)
          const mArr = getItemMonthly(itemSpec, block.categoryKey, true)
          mArr.forEach((v, i) => { subGroupMonthly[i] += v })
          catItemRows.push({ code: itemSpec.code, name: itemSpec.name, type: 'item', monthly: mArr })
        })
      }

      // Append extra accounts user explicitly mapped TO this dynamic category (not already added above)
      const extraDyn = getExtraGroupMonthly(block.categoryKey, addedCodes)
      extraDyn.rows.forEach((r) => {
        catItemRows.push(r)
        r.monthly.forEach((v, i) => { subGroupMonthly[i] += v })
      })

      const catSum = subGroupMonthly.reduce((a, b) => a + b, 0)
      const catPct = totalRevSum > 0 ? Number(((catSum / totalRevSum) * 100).toFixed(2)) : 0
      rows.push({ type: 'category-header', title: `${block.title} (${catPct}%)`, catNum: block.catNum })
      catItemRows.forEach((r) => addRow(r))
      addRow({
        code: '',
        name: `รวม ${block.title.replace(/^3\.\d+\s*/, '')}`,
        type: 'subtotal',
        monthly: subGroupMonthly,
        isBold: true,
        showAvg: true,
        showPct: true,
      })
      subGroupMonthly.forEach((v, i) => { grandTotalExpMonthly[i] += v })
      grandTotalExpSum += catSum
    }
  }

  // Section 4 summary formulas
  const totalExpPct = totalRevSum > 0 ? Number(((grandTotalExpSum / totalRevSum) * 100).toFixed(2)) : 0
  // Monthly TotalExp% = TotalExp_month / Revenue_month * 100
  let totalExpMonthlyPct = totalRevMonthly.map((rev, i) =>
    rev > 0 ? Number(((grandTotalExpMonthly[i] / rev) * 100).toFixed(2)) : 0
  )
  if (monthFilter) {
    const mIdx = Number(monthFilter) - 1
    totalExpMonthlyPct = totalExpMonthlyPct.map((v, i) => i === mIdx ? v : 0)
  }
  rows.push({
    code: '',
    name: 'คิดเป็น%',
    type: 'pct-row',
    pctValue: `${totalExpPct}%`,
    monthlyPct: totalExpMonthlyPct,
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

  // Audit summary & unmapped account detection
  const allDetectedAccounts = []
  const unmatchedAccounts = []

  accountMap.forEach((acc, code) => {
    if (acc.total !== 0) {
      const isMapped = usedAccountCodes.has(code)
      const userMapping = customMappings[code] || 'auto'

      const accInfo = {
        code,
        name: acc.name,
        total: acc.total,
        monthly: acc.monthly,
        isMapped,
        isCogs: detectedCogsCodes.includes(code),
        userMapping,
      }

      allDetectedAccounts.push(accInfo)
      if (!isMapped) {
        unmatchedAccounts.push(accInfo)
      }
    }
  })

  return {
    year,
    activeMonthsCount,
    totalRevSum,
    totalRevMonthly,
    cogsTotal,
    cogsMonthly,
    grossProfitTotal,
    grandTotalExpSum,
    netProfitTotal: grossProfitTotal - grandTotalExpSum,
    rows,
    allDetectedAccounts,
    unmatchedAccounts,
    cogsCodes: detectedCogsCodes,
  }
}
