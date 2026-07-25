import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { THAI_MONTHS } from '../lib/constants'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function DeleteModal({ period, onCancel, onConfirm, busy }) {
  const [step, setStep] = useState(1)
  const [confirmText, setConfirmText] = useState('')
  const CONFIRM_WORD = 'ยืนยันลบ'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="glass w-full max-w-md p-6 space-y-4 shadow-2xl">
        {step === 1 ? (
          <>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-ink-900 font-medium">ยืนยันการลบงบทดลอง</h3>
                <p className="text-ink-600 text-sm mt-1">
                  คุณกำลังจะลบ <span className="font-medium text-rose">{THAI_MONTHS[period.month - 1]} {period.year}</span>
                </p>
                <p className="text-ink-400 text-xs mt-1">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onCancel} className="btn-ghost text-sm">ยกเลิก</button>
              <button onClick={() => setStep(2)} className="bg-rose text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
                ดำเนินการต่อ →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔐</span>
              <div>
                <h3 className="text-ink-900 font-medium">ยืนยันขั้นสุดท้าย</h3>
                <p className="text-ink-600 text-sm mt-1">
                  พิมพ์ <span className="font-mono font-bold text-rose bg-rose-pale px-1.5 py-0.5 rounded">{CONFIRM_WORD}</span> เพื่อยืนยันการลบ
                </p>
              </div>
            </div>
            <input className="glass-input w-full" placeholder={`พิมพ์ "${CONFIRM_WORD}" เพื่อยืนยัน`}
                   value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoFocus />
            <div className="flex justify-end gap-3">
              <button onClick={onCancel} className="btn-ghost text-sm">ยกเลิก</button>
              <button onClick={onConfirm} disabled={confirmText !== CONFIRM_WORD || busy}
                      className="bg-rose text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                {busy ? 'กำลังลบ...' : '🗑️ ลบถาวร'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function TrialBalancePage() {
  const { currentUser } = useAuth()
  const canUse = hasPagePermission(currentUser, 'trial-balance')

  const [periods, setPeriods] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState(null) // {year, month}
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [deletingPeriod, setDeletingPeriod] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [uploadHintOpen, setUploadHintOpen] = useState(false)

  const loadPeriods = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_trial_balance_periods', { p_actor_id: currentUser?.id ?? null })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setPeriods(data ?? [])
    if (!selectedPeriod && data && data.length > 0) setSelectedPeriod({ year: data[0].year, month: data[0].month })
  }, [currentUser, selectedPeriod])

  useEffect(() => { if (canUse) loadPeriods() }, [canUse]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadReport = useCallback(async () => {
    if (!selectedPeriod) { setReport(null); return }
    setReportLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_trial_balance_report', {
      p_actor_id: currentUser?.id ?? null, p_year: selectedPeriod.year, p_month: selectedPeriod.month,
    })
    setReportLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setReport(data)
  }, [currentUser, selectedPeriod])

  useEffect(() => { loadReport() }, [loadReport])

  async function handleDeleteConfirm() {
    setDeleteBusy(true)
    const { data, error: err } = await supabase.rpc('delete_trial_balance_period', {
      p_actor_id: currentUser?.id ?? null, p_year: deletingPeriod.year, p_month: deletingPeriod.month,
    })
    setDeleteBusy(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setDeletingPeriod(null)
    if (selectedPeriod?.year === deletingPeriod.year && selectedPeriod?.month === deletingPeriod.month) setSelectedPeriod(null)
    loadPeriods()
  }

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {deletingPeriod && (
        <DeleteModal period={deletingPeriod} busy={deleteBusy} onCancel={() => setDeletingPeriod(null)} onConfirm={handleDeleteConfirm} />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">งบทดลอง (Trial Balance)</h1>
          <p className="text-ink-600 text-sm mt-1">แสดงยอด Debit / Credit แยกตามกลุ่มรหัสบัญชี — นำเข้าจากไฟล์ Express จริง</p>
        </div>
        <button onClick={() => setUploadHintOpen((o) => !o)} className="btn-ghost text-sm">+ นำเข้างบทดลองใหม่</button>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      {uploadHintOpen && (
        <div className="bg-ocean-pale border border-ocean/20 rounded-lg p-4 text-sm text-ink-700">
          💡 นำเข้างบทดลองใหม่ได้ที่หน้า <b>"แนบไฟล์บัญชี"</b> (เลือกประเภทไฟล์เป็น "งบทดลอง (Trial Balance)") —
          นำเข้าเสร็จแล้วกลับมาที่หน้านี้เพื่อดู/ลบงบทดลองที่นำเข้าไว้
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 glass p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-black/10">
            <p className="text-ink-900 font-medium text-sm">งบทดลองทั้งหมด</p>
          </div>
          {loading && <p className="text-ink-500 text-sm p-4">กำลังโหลด...</p>}
          {!loading && periods.length === 0 && <p className="text-ink-400 text-sm p-4 text-center">ยังไม่มีงบทดลอง</p>}
          <div className="divide-y divide-black/5">
            {periods.map((p) => {
              const isSelected = selectedPeriod?.year === p.year && selectedPeriod?.month === p.month
              return (
                <div key={`${p.year}-${p.month}`} className={`p-3 cursor-pointer transition-colors ${isSelected ? 'bg-ocean-pale' : 'hover:bg-black/[0.02]'}`}>
                  <button onClick={() => setSelectedPeriod({ year: p.year, month: p.month })} className="w-full text-left">
                    <p className="text-ink-900 text-sm font-medium">งบทดลอง {THAI_MONTHS[p.month - 1]} {p.year}</p>
                    <p className="text-ink-400 text-xs mt-0.5">{p.line_count} รายการ · {p.uploaded_by_name || '-'}</p>
                  </button>
                  <button onClick={() => setDeletingPeriod(p)} className="text-rose text-xs hover:underline mt-1.5">🗑️ ลบงบนี้</button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          {reportLoading && <div className="glass p-10 text-center text-ink-400 text-sm">กำลังโหลด...</div>}
          {!reportLoading && !selectedPeriod && (
            <div className="glass p-10 text-center text-ink-400 text-sm">เลือกงบทดลองทางซ้าย หรือกด "นำเข้างบทดลองใหม่"</div>
          )}
          {!reportLoading && selectedPeriod && report && (
            <div className="glass p-6 space-y-5">
              <div className="text-center border-b border-black/10 pb-4">
                <h2 className="font-display italic text-2xl text-ink-900">งบทดลอง {THAI_MONTHS[selectedPeriod.month - 1]} {selectedPeriod.year}</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-black/15">
                      <th className="text-left py-2 pr-3 text-ink-500 font-medium text-xs w-28">รหัสบัญชี</th>
                      <th className="text-left py-2 pr-3 text-ink-500 font-medium text-xs">ชื่อบัญชี</th>
                      <th className="text-right py-2 pr-3 text-ink-500 font-medium text-xs w-36">เดบิต (฿)</th>
                      <th className="text-right py-2 text-ink-500 font-medium text-xs w-36">เครดิต (฿)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...report.groups, ...(report.ungroupedAccounts.length > 0 ? [{ groupId: 'ungrouped', code: '-', name: 'ยังไม่มีกลุ่ม', accounts: report.ungroupedAccounts }] : [])].map((group) => {
                      const gDebit = group.accounts.reduce((s, a) => s + a.debit, 0)
                      const gCredit = group.accounts.reduce((s, a) => s + a.credit, 0)
                      return (
                        <React.Fragment key={group.groupId}>
                          <tr className="bg-ink-100/60">
                            <td colSpan={4} className="py-2 px-2">
                              <span className="doc-badge mr-2">{group.code}</span>
                              <span className="text-ink-800 font-medium text-xs">{group.name}</span>
                            </td>
                          </tr>
                          {group.accounts.map((acc) => (
                            <tr key={acc.code} className="border-b border-black/5 hover:bg-black/[0.015] transition-colors">
                              <td className="py-2 pr-3 text-ocean font-mono text-xs pl-4">{acc.code}</td>
                              <td className="py-2 pr-3 text-ink-700">{acc.name}</td>
                              <td className="py-2 pr-3 text-right text-ink-900 tabular-nums">{acc.debit > 0 ? formatBaht(acc.debit) : '—'}</td>
                              <td className="py-2 text-right text-ink-900 tabular-nums">{acc.credit > 0 ? formatBaht(acc.credit) : '—'}</td>
                            </tr>
                          ))}
                          <tr className="border-b border-black/10 bg-white/40">
                            <td colSpan={2} className="py-1.5 pl-4 text-ink-400 text-xs italic">รวม {group.name}</td>
                            <td className="py-1.5 pr-3 text-right text-ink-600 text-xs font-medium tabular-nums">{gDebit > 0 ? formatBaht(gDebit) : ''}</td>
                            <td className="py-1.5 text-right text-ink-600 text-xs font-medium tabular-nums">{gCredit > 0 ? formatBaht(gCredit) : ''}</td>
                          </tr>
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-black/20">
                      <td colSpan={2} className="py-3 text-ink-900 font-bold">ยอดรวมทั้งสิ้น</td>
                      <td className="py-3 pr-3 text-right font-display italic text-lg text-rose tabular-nums">{formatBaht(report.totalDebit)}</td>
                      <td className="py-3 text-right font-display italic text-lg text-sage tabular-nums">{formatBaht(report.totalCredit)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="pb-2 text-xs">
                        {Math.abs(report.totalDebit - report.totalCredit) < 0.01 ? (
                          <span className="text-sage">✅ Debit = Credit — งบสมดุล</span>
                        ) : (
                          <span className="text-gold-dark">
                            ℹ️ ผลต่าง: {formatBaht(Math.abs(report.totalDebit - report.totalCredit))} บาท — ปกติถ้ายังไม่ได้นำเข้าครบทุกรหัสในระบบ (งบทดลองเต็มบริษัทมีบัญชีสินทรัพย์/หนี้สินด้วย ซึ่งไม่อยู่ในผังบัญชีนี้)
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
