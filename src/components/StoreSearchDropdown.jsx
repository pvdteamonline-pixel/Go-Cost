import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

// ค้นหาร้านค้า พิมพ์แล้วรอ 3 วินาทีค่อยค้น (ตามที่ระบุไว้) แล้วแสดงผลให้เลือก
export default function StoreSearchDropdown({ selectedStore, onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc('search_stores', { p_query: query })
      setSearching(false)
      if (!error) {
        setResults(data ?? [])
        setOpen(true)
      }
    }, 3000)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  function pick(store) {
    onSelect(store)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  return (
    <div className="relative">
      {selectedStore ? (
        <div className="glass-solid p-4 flex items-start justify-between">
          <div>
            <p className="text-ink-900 font-medium">{selectedStore.name}</p>
            <p className="text-ink-500 text-sm mt-0.5">
              {selectedStore.province || '-'} · {selectedStore.region || '-'}
            </p>
            <p className="text-ink-400 text-xs mt-1">
              เซลล์ที่สังกัด: {selectedStore.assigned_sales_name || 'ยังไม่ได้กำหนด'}
            </p>
          </div>
          <button type="button" onClick={() => onSelect(null)} className="text-ocean text-xs hover:underline">เปลี่ยนร้าน</button>
        </div>
      ) : (
        <>
          <input
            className="glass-input w-full"
            placeholder="พิมพ์ชื่อร้าน / รหัสลูกค้า / จังหวัด แล้วรอสักครู่..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {searching && <p className="text-ink-400 text-xs mt-1">กำลังค้นหา...</p>}
          {open && results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full glass-solid max-h-64 overflow-y-auto p-2">
              {results.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick(s)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-ink-100 text-sm"
                >
                  <p className="text-ink-900">{s.name}</p>
                  <p className="text-ink-500 text-xs">{s.province} · {s.region} {s.customer_code ? `· รหัส ${s.customer_code}` : ''}</p>
                </button>
              ))}
            </div>
          )}
          {open && !searching && query.trim() && results.length === 0 && (
            <div className="absolute z-20 mt-1 w-full glass-solid p-3 text-ink-400 text-sm">ไม่พบร้านค้าที่ตรงกับ "{query}"</div>
          )}
        </>
      )}
    </div>
  )
}
