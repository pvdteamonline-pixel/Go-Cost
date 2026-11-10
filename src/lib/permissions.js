// Mirror ของ has_page_permission() ฝั่ง Postgres — ใช้แค่กรอง UI (ซ่อน/โชว์เมนู)
// การบังคับสิทธิ์จริงเกิดที่ RPC ฝั่ง server เสมอ อย่าพึ่งพาไฟล์นี้เพื่อความปลอดภัย
export function hasPagePermission(user, pageKey) {
  if (!user) return false
  // Each page follows its own checkbox; Workshop/history must not grant report access.
  if (user.role === 'ADMIN') return true
  return Array.isArray(user.page_permissions) && user.page_permissions.includes(pageKey)
}
