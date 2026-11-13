import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
export default function DataStatusBox() {
  const { currentUser } = useAuth()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!currentUser?.id) return setLoading(false)
      setLoading(true)
      try {
        const { data: batches } = await supabase
          .rpc('get_import_batches', { p_actor_id: currentUser.id, p_batch_type: 'pl_estimate' })
        if (batches && batches.length > 0) {
          const sorted = [...batches].sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
          const latest = sorted[0]
          setStatus({
            latestImportAt: latest.uploaded_at,
            latestYear: Math.max(...batches.map(b => Number(b.year) || 0)) || latest.year,
            latestMonthRange: latest.month_range || null,
          })
        }
      } catch {
        // silent fail
      }
      setLoading(false)
    }
    load()
  }, [currentUser])

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-black/10">
        <p className="text-ink-400 text-[10px]">กำลังโหลดสถานะ...</p>
      </div>
    )
  }

  const importDate = status?.latestImportAt
    ? new Date(status.latestImportAt)
    : null

  const monthName = status?.latestMonthRange || null


  return (
    <div className="mt-3 pt-3 border-t border-black/10 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-ink-400">สถานะข้อมูล</p>
      {importDate ? (
        <div className="bg-white/50 border border-black/[0.07] rounded-xl p-2.5 space-y-1.5">
          <div className="flex items-start gap-1.5">
            <span className="text-xs mt-0.5">📂</span>
            <div>
              <p className="text-[10px] text-ink-500">แนบไฟล์ล่าสุด</p>
              <p className="text-[11px] font-medium text-ink-800">
                {importDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-ink-400">เวลา {importDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
            </div>
          </div>
          {monthName && (
            <div className="flex items-start gap-1.5">
              <span className="text-xs mt-0.5">📅</span>
              <div>
                <p className="text-[10px] text-ink-500">ช่วงเดือนที่ระบุในไฟล์</p>
                <p className="text-[11px] font-medium text-ocean">{monthName} ปี {status?.latestYear}</p>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-2.5">
          <p className="text-[10px] text-amber-700">⚠️ ยังไม่มีข้อมูลในระบบ</p>
          <p className="text-[9px] text-amber-500 mt-0.5">กรุณาแนบไฟล์บัญชีก่อน</p>
        </div>
      )}
    </div>
  )
}
