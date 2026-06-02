import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  DatabaseIcon, EyeIcon, EyeOffIcon,
  BookOpenIcon, AlertCircleIcon,
} from 'lucide-react'
import { useLogin, useRegister } from '@/hooks/useAuth'

// ── Field ─────────────────────────────────────────────────────────
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
  const hasError   = Boolean(error)

  return (
    <div className="flex flex-col gap-1">
      <label className={`text-xs font-medium ${hasError ? 'text-red-400' : 'text-sec'}`}>
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : (type ?? 'text')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full bg-input border rounded-lg px-3 py-2.5 text-sm text-hi
            placeholder:text-muted outline-none transition-all
            ${hasError
              ? 'border-red-500/70 ring-1 ring-red-500/30 focus:border-red-500/80 focus:ring-red-500/40'
              : 'border-brd focus:border-acc/60 focus:ring-1 focus:ring-acc/30'
            }
          `}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sec/60 hover:text-sec"
          >
            {show ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
          </button>
        )}
      </div>
      {hasError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 text-xs text-red-400"
        >
          <AlertCircleIcon size={11} className="flex-none" />
          {error}
        </motion.p>
      )}
    </div>
  )
}

// ── Server-error banner ───────────────────────────────────────────
function ServerError({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25"
    >
      <AlertCircleIcon size={14} className="text-red-400 flex-none mt-0.5" />
      <p className="text-sm text-red-400 leading-snug">{message}</p>
    </motion.div>
  )
}

// ── Login ─────────────────────────────────────────────────────────
export function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [errors,   setErrors]   = useState({ email: '', password: '' })
  const login = useLogin()

  const validate = () => {
    const e = { email: '', password: '' }
    if (!email.trim())
      e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'Enter a valid email address'
    if (!password)
      e.password = 'Password is required'
    setErrors(e)
    return !e.email && !e.password
  }

  const handle = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    login.mutate({ email: email.trim(), password })
  }

  return (
    <AuthShell title="Welcome back" sub="Sign in to your SchemaVis account">
      <form onSubmit={handle} className="flex flex-col gap-4" noValidate>
        <Field
          label="Email" type="email"
          value={email} placeholder="you@example.com"
          onChange={(v) => { setEmail(v); setErrors((p) => ({ ...p, email: '' })) }}
          error={errors.email}
        />
        <Field
          label="Password" type="password"
          value={password} placeholder="••••••••"
          onChange={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: '' })) }}
          error={errors.password}
        />

        {login.isError && (
          <ServerError
            message={
              (login.error as { friendlyMessage?: string })?.friendlyMessage
              ?? 'Incorrect email or password. Please try again.'
            }
          />
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

// ── Register ──────────────────────────────────────────────────────
export function RegisterPage() {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [errors,   setErrors]   = useState({ name: '', email: '', password: '' })
  const register = useRegister()

  const validate = () => {
    const e = { name: '', email: '', password: '' }
    if (!name.trim())
      e.name = 'Display name is required'
    if (!email.trim())
      e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'Enter a valid email address'
    if (!password)
      e.password = 'Password is required'
    else if (password.length < 8)
      e.password = 'Password must be at least 8 characters'
    setErrors(e)
    return !e.name && !e.email && !e.password
  }

  const handle = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    register.mutate({ displayName: name.trim(), email: email.trim(), password })
  }

  return (
    <AuthShell title="Create account" sub="Start visualising your schemas today">
      <form onSubmit={handle} className="flex flex-col gap-4" noValidate>
        <Field
          label="Display name"
          value={name} placeholder="Shreyas"
          onChange={(v) => { setName(v); setErrors((p) => ({ ...p, name: '' })) }}
          error={errors.name}
        />
        <Field
          label="Email" type="email"
          value={email} placeholder="you@example.com"
          onChange={(v) => { setEmail(v); setErrors((p) => ({ ...p, email: '' })) }}
          error={errors.email}
        />
        <Field
          label="Password" type="password"
          value={password} placeholder="8+ characters"
          onChange={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: '' })) }}
          error={errors.password}
        />

        {register.isError && (
          <ServerError
            message={
              (register.error as { friendlyMessage?: string })?.friendlyMessage
              ?? 'Registration failed. Please try again.'
            }
          />
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

// ── Shell ─────────────────────────────────────────────────────────
function AuthShell({ title, sub, children }: {
  title: string
  sub:   string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base px-4">
      {/* Top nav */}
      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 h-12 border-b border-brd bg-panel/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-acc/20 border border-acc/40 flex items-center justify-center">
            <DatabaseIcon size={12} className="text-acc" />
          </div>
          <span className="font-bold text-sm text-hi">Schema<span className="text-acc">Vis</span></span>
        </div>
        <Link
          to="/docs"
          className="flex items-center gap-1.5 text-xs text-sec hover:text-hi transition-colors"
        >
          <BookOpenIcon size={13} />
          Docs
        </Link>
      </div>

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
