import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function NotificationsBell() {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const load = useCallback(async () => {
    if (!currentUser) return
    const { data, error } = await supabase.rpc('get_notifications', {
      p_target_role: currentUser.role,
      p_target_user: currentUser.id,
    })
    if (!error && data?.success) {
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    }
  }, [currentUser])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000) // poll ทุก 30 วิ (เรียนจากบทเรียน quota เดิม ไม่ poll ถี่กว่านี้)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleMarkRead(notifId) {
    await supabase.rpc('mark_notification_read', { p_notif_id: notifId })
    load()
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative btn-ghost px-3 py-2">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose text-white text-[10px] rounded-full w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 glass-solid p-3 z-30 max-h-96 overflow-y-auto">
          <p className="text-ink-500 text-xs uppercase tracking-wider px-1 mb-2">การแจ้งเตือน</p>
          {notifications.length === 0 && (
            <p className="text-ink-400 text-sm text-center py-6">ไม่มีการแจ้งเตือน</p>
          )}
          <div className="space-y-1">
            {notifications.map((n) => (
              <button
                key={n.notif_id}
                onClick={() => handleMarkRead(n.notif_id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  n.status === 0 ? 'bg-ocean-pale text-ink-900' : 'text-ink-600 hover:bg-ink-100'
                }`}
              >
                <p>{n.message}</p>
                <p className="text-ink-400 text-xs mt-0.5">{new Date(n.created_at).toLocaleString('th-TH')}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
