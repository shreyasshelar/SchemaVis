import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DatabaseIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { useLogin } from '@/hooks/useAuth'
import { useRegister } from '@/hooks/useAuth'

// ── Shared field ─────────────────────────────────────────────────
function Field({
  label, type, value, onChange, placeholder, error,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-sec font-medium">{label}</label>
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : (type ?? 'text')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full bg-input border rounded-lg px-3 py-2.5 text-sm text-hi
            placeholder:text-muted outline-none transition-colors
            focus:border-acc/60 focus:ring-1 focus:ring-acc/30
            ${error ? 'border-red-500/60' : 'border-brd'}
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sec/60 hover:text-sec"
          >
            {show ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ── Login ────────────────────────────────────────────────────────
export function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()

  const handle = (e: React.FormEvent) => {
    e.preventDefault()
    login.mutate({ email, password })
  }

  return (
    <AuthShell title="Welcome back" sub="Sign in to your SchemaVis account">
      <form onSubmit={handle} className="flex flex-col gap-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

        {login.isError && (
          <p className="text-sm text-red-400 text-center">
            {(login.error as { friendlyMessage?: string })?.friendlyMessage ?? 'Login failed'}
          </p>
        )}

        <button
          type="submit"
          disabled={login.isPending}
          className="mt-1 h-10 rounded-lg bg-acc text-white font-semibold text-sm
                     hover:bg-acc/90 disabled:opacity-50 transition-colors"
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-xs text-sec mt-4">
        No account?{' '}
        <Link to="/register" className="text-acc hover:underline">Create one</Link>
      </p>
    </AuthShell>
  )
}

// ── Register ─────────────────────────────────────────────────────
export function RegisterPage() {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const register = useRegister()

  const handle = (e: React.FormEvent) => {
    e.preventDefault()
    register.mutate({ displayName: name, email, password })
  }

  return (
    <AuthShell title="Create account" sub="Start visualising your schemas today">
      <form onSubmit={handle} className="flex flex-col gap-4">
        <Field label="Display name" value={name} onChange={setName} placeholder="Shreyas" />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="8+ characters" />

        {register.isError && (
          <p className="text-sm text-red-400 text-center">
            {(register.error as { friendlyMessage?: string })?.friendlyMessage ?? 'Registration failed'}
          </p>
        )}

        <button
          type="submit"
          disabled={register.isPending}
          className="mt-1 h-10 rounded-lg bg-acc text-white font-semibold text-sm
                     hover:bg-acc/90 disabled:opacity-50 transition-colors"
        >
          {register.isPending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-xs text-sec mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-acc hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  )
}

// ── Shared shell ─────────────────────────────────────────────────
function AuthShell({ title, sub, children }: {
  title: string
  sub:   string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-xl bg-acc/20 border border-acc/40 flex items-center justify-center">
            <DatabaseIcon size={16} className="text-acc" />
          </div>
          <span className="font-bold text-xl text-hi tracking-tight">
            Schema<span className="text-acc">Vis</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-panel border border-brd rounded-2xl p-6 shadow-xl">
          <h1 className="text-lg font-semibold text-hi mb-1">{title}</h1>
          <p className="text-sm text-sec mb-6">{sub}</p>
          {children}
        </div>
      </motion.div>
    </div>
  )
}
