import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await login(id, password)
    setSubmitting(false)
    if (!result.success) setError(result.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="โลโก้บริษัท" className="mx-auto mb-4 h-16 w-auto object-contain" />
          <h1 className="font-display italic text-4xl text-ink-900">GoCost</h1>
          <p className="text-ink-600 text-sm mt-1">ระบบวางแผนและติดตามงบการตลาด</p>
        </div>

        <form onSubmit={handleSubmit} className="glass p-8 space-y-5">
          <div>
            <label className="block text-xs text-ink-600 mb-1.5">รหัสผู้ใช้งาน</label>
            <input
              className="glass-input w-full"
              value={id}
              onChange={(e) => setId(e.target.value)}
              autoComplete="username"
              placeholder="เช่น Kanok500"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-600 mb-1.5">รหัสผ่าน</label>
            <input
              type="password"
              className="glass-input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  )
}
