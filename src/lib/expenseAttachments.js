import { supabase } from './supabaseClient'
export const ATTACHMENT_BUCKET = 'workshop-attachments'
export async function uploadExpenseAttachment(file) {
  if (!file) return null
  if (file.size > 10 * 1024 * 1024) throw new Error('ไฟล์แนบต้องไม่เกิน 10 MB')
  const path = `expenses/${crypto.randomUUID()}/${file.name.replace(/[^\p{L}\p{N}._-]/gu, '_')}`
  const {error} = await supabase.storage.from(ATTACHMENT_BUCKET).upload(path, file)
  if (error) throw error
  return path
}
export async function openAttachment(path) {
  if (!path) return
  if (/^https:\/\//i.test(path)) { window.open(path, '_blank', 'noopener,noreferrer'); return }
  const { data, error } = await supabase.storage.from(ATTACHMENT_BUCKET).createSignedUrl(path, 300)
  if (error) throw error
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
}
