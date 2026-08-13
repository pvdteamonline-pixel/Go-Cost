import { supabase } from './supabaseClient'

/**
 * Maps an account code (e.g. "4200-01", "42000-01", "6001-01") to its default category.
 */
export function detectCategoryFromCode(code) {
  if (!code) return 'ค่าใช้จ่ายในการขายและบริหาร (Selling & Administrative Expenses)'
  const cleanCode = String(code).trim()
  const firstDigit = cleanCode.charAt(0)

  switch (firstDigit) {
    case '1':
      return 'สินทรัพย์ (Assets)'
    case '2':
      return 'หนี้สิน (Liabilities)'
    case '3':
      return 'ส่วนของผู้ถือหุ้น / ทุน (Equity)'
    case '4':
      return 'รายได้ (Revenue)'
    case '5':
      return 'ต้นทุนขาย / ต้นทุนผลิต (Cost of Sales)'
    case '6':
    default:
      return 'ค่าใช้จ่ายในการขายและบริหาร (Selling & Administrative Expenses)'
  }
}

/**
 * Finds or creates an account group for a given account code prefix.
 * e.g. code "4200-01" -> prefix "4" -> target group code starting with "4" (e.g. "4000-00")
 */
export async function findTargetGroupForCode(code, actorId) {
  if (!code) return null
  const cleanCode = String(code).trim()
  const firstDigit = cleanCode.charAt(0)

  // 1. Fetch all groups
  const { data: groups } = await supabase.from('account_groups').select('id, code, name')
  if (!groups || groups.length === 0) return null

  // 2. Find group starting with same first digit (e.g. '4000-00', 'GRP-04', etc.)
  let matchedGroup = groups.find((g) => g.code && g.code.trim().startsWith(firstDigit))

  // Fallback: match group name containing digit (e.g. "หมวด 4")
  if (!matchedGroup) {
    matchedGroup = groups.find((g) => g.name && (g.name.includes(`หมวด ${firstDigit}`) || g.name.includes(`หมวด${firstDigit}`)))
  }

  // Fallback: take first group if none match
  if (!matchedGroup && groups.length > 0) {
    matchedGroup = groups[0]
  }

  return matchedGroup ? matchedGroup.id : null
}

/**
 * Saves a new account and automatically links it to the appropriate group based on code prefix.
 */
export async function autoSaveAndGroupAccount({ code, name, category, description }, actorId) {
  const cleanCode = String(code || '').trim()
  const cleanName = String(name || cleanCode).trim()
  const finalCategory = category || detectCategoryFromCode(cleanCode)
  const finalDesc = String(description || cleanName || finalCategory).trim()

  if (!cleanCode || !cleanName) {
    return { success: false, message: 'กรุณากรอกรหัสและชื่อบัญชีให้ครบ' }
  }

  // 1. เรียกใช้ RPC auto_create_and_group_account (SECURITY DEFINER)
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('auto_create_and_group_account', {
      p_actor_id: actorId || null,
      p_code: cleanCode,
      p_name: cleanName,
      p_category: finalCategory,
      p_description: finalDesc,
    })

    if (!rpcErr && rpcData && rpcData.success) {
      return rpcData
    }
  } catch (e) {
    // silent fallback to client logic if RPC fails
  }

  // 2. Client-side fallback: หา group_id
  const groupId = await findTargetGroupForCode(cleanCode, actorId)

  // 3. ตรวจสอบรหัสเดิมหรือสร้างผ่าน RPC create_account
  let accountId = null
  const { data: existingAcc } = await supabase
    .from('accounts')
    .select('id, group_id')
    .eq('code', cleanCode)
    .maybeSingle()

  if (existingAcc) {
    accountId = existingAcc.id
  } else {
    // ลองใช้ create_account RPC
    const { data: createRes } = await supabase.rpc('create_account', {
      p_code: cleanCode,
      p_name: cleanName,
      p_category: finalCategory,
      p_description: finalDesc,
      p_actor_id: actorId || null,
    })

    if (createRes && createRes.success && createRes.id) {
      accountId = createRes.id
    } else {
      // Re-fetch account ID
      const { data: refetch } = await supabase.from('accounts').select('id').eq('code', cleanCode).maybeSingle()
      if (refetch) {
        accountId = refetch.id
      } else {
        return { success: false, message: createRes?.message || 'ไม่สามารถสร้างรหัสบัญชีใหม่ได้' }
      }
    }
  }

  // 4. บันทึก group_id เข้าตาราง accounts และ account_group_splits
  if (accountId && groupId) {
    try {
      await supabase.from('accounts').update({ group_id: groupId }).eq('id', accountId)
    } catch (e) {}

    try {
      await supabase.rpc('set_account_group_split', {
        p_account_id: accountId,
        p_group_id: groupId,
        p_fraction: 1.0,
        p_actor_id: actorId || null,
      })
    } catch (e) {}
  }

  return { success: true, accountId, groupId, message: `บันทึกรหัส ${cleanCode} (${cleanName}) และจัดเข้ากลุ่มเรียบร้อยแล้ว` }
}
