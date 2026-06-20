import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore, useAuthHydrated } from '@/store/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DatabaseIcon, SparklesIcon, MessageSquareIcon, ZapIcon,
  ShieldCheckIcon, LayersIcon, ServerIcon, GitBranchIcon,
  ArrowRightIcon, CheckIcon, CodeIcon, RefreshCwIcon,
  RocketIcon, CloudIcon, BookOpenIcon, KeyIcon,
  RepeatIcon, ExternalLinkIcon, ChevronDownIcon, MenuIcon, XIcon,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────
// Reusable fade-up wrapper — uses animate (not whileInView) so content
// is always visible without depending on IntersectionObserver
// ─────────────────────────────────────────────────────────────────
function FadeUp({
  children, delay = 0, className = '',
}: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Sticky nav
// ─────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features',     label: 'Features' },
  { href: '#stack',        label: 'Tech stack' },
  { href: '#api',          label: 'API' },
  { href: '#artifacts',    label: 'Artifacts' },
]

function DocsNav() {
  const [open, setOpen] = useState(false)
  const hydrated        = useAuthHydrated()
  const rawAuth         = useAuthStore((s) => s.isAuthenticated)
  const isAuthenticated = hydrated && rawAuth

  return (
    <nav className="sticky top-0 z-50 bg-app/95 backdrop-blur-xl border-b border-brd">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-acc/20 border border-acc/40 flex items-center justify-center">
            <DatabaseIcon size={14} className="text-acc" />
          </div>
          <span className="font-bold text-md text-hi tracking-tight">
            Schema<span className="text-acc">Vis</span>
          </span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-xs text-sec">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="hover:text-hi transition-colors">{l.label}</a>
          ))}
        </div>

        {/* Desktop CTAs — hidden until auth store hydrates from localStorage */}
        <div className="hidden sm:flex items-center gap-2">
          {!hydrated ? (
            /* Placeholder so the nav doesn't shift after hydration */
            <div className="h-8 w-20" />
          ) : isAuthenticated ? (
            <Link to="/" className="inline-flex items-center gap-1.5 h-8 px-4 text-xs rounded-lg bg-acc hover:bg-accD text-white font-semibold transition-colors">
              ← Back to app
            </Link>
          ) : (
            <>
              <Link to="/login"    className="inline-flex items-center h-8 px-3 text-xs text-sec hover:text-hi transition-colors">Sign in</Link>
              <Link to="/register" className="inline-flex items-center h-8 px-3 text-xs rounded-lg bg-acc hover:bg-accD text-white font-semibold transition-colors">Get started</Link>
            </>
          )}
        </div>

        {/* Mobile: back-to-app or sign in + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          {!hydrated ? null : isAuthenticated ? (
            <Link to="/" className="text-xs text-acc font-medium hover:text-accD transition-colors">← App</Link>
          ) : (
            <Link to="/login" className="text-xs text-sec hover:text-hi transition-colors">Sign in</Link>
          )}
          <button
            onClick={() => setOpen(o => !o)}
            className="w-8 h-8 rounded-lg bg-surf border border-brd flex items-center justify-center text-sec hover:text-hi transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <XIcon size={15} /> : <MenuIcon size={15} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-brd bg-panel overflow-hidden"
          >
            <div className="flex flex-col px-4 py-3 gap-1">
              {NAV_LINKS.map(l => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="py-2.5 text-sm text-sec hover:text-hi border-b border-brd/50 last:border-0 transition-colors"
                >
                  {l.label}
                </a>
              ))}
              {hydrated && (isAuthenticated ? (
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="mt-2 py-2.5 text-sm text-center rounded-lg bg-acc text-white font-semibold hover:bg-accD transition-colors"
                >
                  ← Back to app
                </Link>
              ) : (
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="mt-2 py-2.5 text-sm text-center rounded-lg bg-acc text-white font-semibold hover:bg-accD transition-colors"
                >
                  Get started free
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────
function Hero() {
  const hydrated        = useAuthHydrated()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated) && hydrated
  return (
    <section className="relative flex flex-col items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-acc/8 blur-3xl pointer-events-none" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #252538 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-acc/10 border border-acc/25 text-acc text-xs font-medium"
        >
          <SparklesIcon size={12} />
          AI-powered · Open source · Self-hosted
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[1.75rem] sm:text-[2.6rem] lg:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight"
        >
          Design databases{' '}
          <span className="bg-gradient-to-r from-acc via-purple-400 to-blue-400 bg-clip-text text-transparent">
            with AI,
          </span>
          <br />not guesswork.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-md text-sec leading-relaxed max-w-xl"
        >
          Describe your domain in plain English — or paste existing SQL.
          SchemaVis asks the right questions, then renders a live, interactive
          entity-relationship diagram as you chat.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {!hydrated ? (
            /* Reserve space while localStorage hydrates — prevents layout shift */
            <div className="h-10 w-36 rounded-xl bg-acc/40 animate-pulse" />
          ) : isAuthenticated ? (
            <Link
              to="/"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-acc hover:bg-accD text-white font-semibold text-sm transition-colors shadow-glow"
            >
              Open app <ArrowRightIcon size={14} />
            </Link>
          ) : (
            <Link
              to="/register"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-acc hover:bg-accD text-white font-semibold text-sm transition-colors shadow-glow"
            >
              Start for free <ArrowRightIcon size={14} />
            </Link>
          )}
          <a
            href="#demo"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surf border border-brd hover:border-brdLt text-sec hover:text-hi font-medium text-sm transition-colors"
          >
            See a demo <ChevronDownIcon size={14} />
          </a>
          <a
            href="https://github.com/shreyasshelar/SchemaVis"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surf border border-brd hover:border-brdLt text-sec hover:text-hi text-sm transition-colors"
          >
            <CodeIcon size={14} /> GitHub
          </a>
        </motion.div>

        {/* Tech pill row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-wrap justify-center gap-2 pt-2"
        >
          {['Java 21', 'Spring Boot', 'React', 'PostgreSQL', 'k3s + ArgoCD'].map((t) => (
            <span key={t} className="text-2xs text-muted px-2 py-0.5 rounded-full border border-brd bg-surf/50">
              {t}
            </span>
          ))}
        </motion.div>
      </div>

    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// How it works
// ─────────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    icon: <MessageSquareIcon size={20} className="text-acc" />,
    title: 'Describe your domain',
    desc: 'Type your requirements in plain English ("I need a multi-tenant SaaS with users and billing") or paste any existing SQL DDL. No special syntax — just talk.',
    tag: 'Natural language or SQL',
  },
  {
    num: '02',
    icon: <SparklesIcon size={20} className="text-purple-400" />,
    title: 'Chat with the AI',
    desc: 'The AI asks targeted questions: What relationships exist? Are fields nullable? Any unique constraints? It builds the full picture before committing any tables.',
    tag: 'Gemini 2.5 Flash → Groq → OpenRouter',
  },
  {
    num: '03',
    icon: <DatabaseIcon size={20} className="text-ok" />,
    title: 'Watch the diagram build',
    desc: 'Every AI response updates the live React Flow ER diagram on the right. Pan, zoom, inspect columns and relationships. When the AI is satisfied it marks the schema complete.',
    tag: 'Interactive React Flow canvas',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeUp className="text-center mb-16">
          <span className="text-xs text-acc font-semibold uppercase tracking-widest">How it works</span>
          <h2 className="text-[1.9rem] font-extrabold text-hi mt-3 tracking-tight">
            Three steps to a complete schema
          </h2>
          <p className="text-sec text-md mt-3 max-w-lg mx-auto">
            No forms, no drag-and-drop tables, no manual foreign keys. Just a conversation.
          </p>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <FadeUp key={step.num} delay={i * 0.1}>
              <div className="relative rounded-2xl bg-panel border border-brd p-6 h-full flex flex-col gap-4 hover:border-brdLt transition-colors group">
                {/* Step number watermark */}
                <span className="absolute top-4 right-5 text-[3rem] font-black text-brd group-hover:text-acc/10 transition-colors leading-none select-none">
                  {step.num}
                </span>

                <div className="w-10 h-10 rounded-xl bg-surf border border-brd flex items-center justify-center">
                  {step.icon}
                </div>

                <div className="flex-1">
                  <h3 className="text-md font-bold text-hi mb-2">{step.title}</h3>
                  <p className="text-xs text-sec leading-relaxed">{step.desc}</p>
                </div>

                <span className="text-2xs text-muted px-2.5 py-1 rounded-full bg-surf border border-brd self-start">
                  {step.tag}
                </span>
              </div>
            </FadeUp>
          ))}
        </div>

      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// Demo — static split-pane mockup
// ─────────────────────────────────────────────────────────────────
const CHAT_MESSAGES = [
  { role: 'assistant', text: 'Hi! Tell me about your database — or paste your DDL and I\'ll get started.' },
  { role: 'user',      text: 'I need an e-commerce app with users, products, and orders.' },
  { role: 'assistant', text: 'Got it. Does each order belong to one user, and can one user have multiple orders?' },
  { role: 'user',      text: 'Yes, and each order can have multiple products.' },
  { role: 'assistant', text: 'That means we need a join table. I\'ve updated the diagram with USERS, PRODUCTS, ORDERS, and ORDER_ITEMS.' },
]

function TableCard({ name, cols }: { name: string; cols: { n: string; t: string; pk?: boolean; fk?: boolean }[] }) {
  return (
    <div className="rounded-lg overflow-hidden border border-brd bg-panel shadow-md min-w-[160px]">
      <div className="flex items-center gap-2 px-3 py-2 bg-surf/80 border-b border-brd">
        <span className="w-2 h-2 rounded-full bg-acc/70 flex-none" />
        <span className="text-xs font-semibold text-hi font-mono">{name}</span>
        <span className="ml-auto text-2xs text-muted font-mono">{cols.length} cols</span>
      </div>
      {cols.map((c) => (
        <div key={c.n} className="flex items-center gap-1.5 px-3 h-6 border-t border-brd/40">
          <span className="w-3 flex-none">
            {c.pk && <KeyIcon size={9} className="text-gold" />}
            {c.fk && !c.pk && <KeyIcon size={9} className="text-acc" />}
          </span>
          <span className={`flex-1 text-2xs font-mono truncate ${c.pk ? 'text-gold' : c.fk ? 'text-acc' : 'text-hi'}`}>{c.n}</span>
          <span className="text-2xs text-muted font-mono">{c.t}</span>
        </div>
      ))}
    </div>
  )
}

function Demo() {
  return (
    <section id="demo" className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeUp className="text-center mb-10">
          <span className="text-xs text-acc font-semibold uppercase tracking-widest">Live preview</span>
          <h2 className="text-[1.9rem] font-extrabold text-hi mt-3 tracking-tight">
            What it looks like
          </h2>
          <p className="text-sec text-md mt-2 max-w-md mx-auto">
            A familiar chat interface on the left. An interactive ER diagram on the right.
          </p>
        </FadeUp>

        <FadeUp>
          <div className="rounded-2xl border border-brd overflow-hidden shadow-lg">
            {/* Fake title bar */}
            <div className="h-9 bg-panel border-b border-brd flex items-center px-4 gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-err/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-warn/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-ok/60" />
              <span className="ml-3 text-2xs text-muted truncate">SchemaVis — E-commerce schema</span>
            </div>

            {/* ── Responsive split pane ──
                Mobile  : chat stacked above diagram grid (no absolute positions)
                md+     : side-by-side with absolute-positioned ER nodes + SVG lines ── */}
            <div className="flex flex-col md:flex-row md:h-[440px]">

              {/* Chat panel — full width on mobile, 45% on md+ */}
              <div className="w-full md:w-[45%] flex flex-col border-b md:border-b-0 md:border-r border-brd bg-panel">
                <div className="flex-1 overflow-hidden p-4 flex flex-col gap-3 max-h-64 md:max-h-none">
                  {CHAT_MESSAGES.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.12, duration: 0.35 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-uBg text-hi rounded-br-sm'
                            : 'bg-aiBg border border-brd text-sec rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="flex items-center gap-1.5 px-3 py-2 self-start"
                  >
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 rounded-full bg-sec/50 animate-bounce-dot"
                        style={{ animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </motion.div>
                </div>
                <div className="p-3 border-t border-brd">
                  <div className="flex items-center gap-2 bg-input border border-brd rounded-lg px-3 py-2">
                    <span className="flex-1 text-xs text-muted">Reply to SchemaVis…</span>
                    <span className="text-2xs text-muted border border-brd rounded px-1">↵</span>
                  </div>
                </div>
              </div>

              {/* ── Mobile diagram: 2×2 grid of table cards, no absolute positioning ── */}
              <div
                className="md:hidden grid grid-cols-2 gap-3 p-4"
                style={{ backgroundColor: '#0D0D18' }}
              >
                {/* Schema complete badge */}
                <div className="col-span-2 flex items-center justify-center gap-1.5 py-1">
                  <CheckIcon size={10} className="text-ok" />
                  <span className="text-2xs text-ok font-medium">Schema complete — 4 tables</span>
                </div>
                {[
                  { name: 'USERS',       cols: [{ n: 'id', t: 'uuid', pk: true }, { n: 'email', t: 'varchar' }, { n: 'name', t: 'varchar' }] },
                  { name: 'PRODUCTS',    cols: [{ n: 'id', t: 'uuid', pk: true }, { n: 'name', t: 'varchar' }, { n: 'price', t: 'numeric' }] },
                  { name: 'ORDERS',      cols: [{ n: 'id', t: 'uuid', pk: true }, { n: 'user_id', t: 'uuid', fk: true }, { n: 'total', t: 'numeric' }] },
                  { name: 'ORDER_ITEMS', cols: [{ n: 'id', t: 'uuid', pk: true }, { n: 'order_id', t: 'uuid', fk: true }, { n: 'product_id', t: 'uuid', fk: true }] },
                ].map((table, i) => (
                  <motion.div
                    key={table.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.35 }}
                  >
                    <TableCard name={table.name} cols={table.cols} />
                  </motion.div>
                ))}
              </div>

              {/* ── Desktop diagram: absolute-positioned ER nodes + SVG lines ── */}
              <div
                className="hidden md:block flex-1 relative overflow-hidden"
                style={{
                  backgroundColor: '#0D0D18',
                  backgroundImage: 'radial-gradient(circle, #252538 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              >
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.4 }} className="absolute top-6 left-6">
                  <TableCard name="USERS" cols={[{ n: 'id', t: 'uuid', pk: true }, { n: 'email', t: 'varchar' }, { n: 'name', t: 'varchar' }, { n: 'created_at', t: 'timestamp' }]} />
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.45, duration: 0.4 }} className="absolute top-6 right-6">
                  <TableCard name="PRODUCTS" cols={[{ n: 'id', t: 'uuid', pk: true }, { n: 'name', t: 'varchar' }, { n: 'price', t: 'numeric' }, { n: 'stock', t: 'int' }]} />
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 0.4 }} className="absolute bottom-16 left-[25%]">
                  <TableCard name="ORDERS" cols={[{ n: 'id', t: 'uuid', pk: true }, { n: 'user_id', t: 'uuid', fk: true }, { n: 'total', t: 'numeric' }, { n: 'status', t: 'varchar' }]} />
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.75, duration: 0.4 }} className="absolute bottom-16 right-[10%]">
                  <TableCard name="ORDER_ITEMS" cols={[{ n: 'id', t: 'uuid', pk: true }, { n: 'order_id', t: 'uuid', fk: true }, { n: 'product_id', t: 'uuid', fk: true }, { n: 'qty', t: 'int' }]} />
                </motion.div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  <defs>
                    <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L6,3 z" fill="#303048" />
                    </marker>
                  </defs>
                  <line x1="170" y1="120" x2="200" y2="310" stroke="#303048" strokeWidth="1.5" markerEnd="url(#arr)" strokeDasharray="4 3" />
                  <line x1="320" y1="120" x2="330" y2="310" stroke="#303048" strokeWidth="1.5" markerEnd="url(#arr)" strokeDasharray="4 3" />
                  <line x1="280" y1="350" x2="320" y2="350" stroke="#303048" strokeWidth="1.5" markerEnd="url(#arr)" strokeDasharray="4 3" />
                  <text x="174" y="225" fill="#48486A" fontSize="9" fontFamily="monospace">1..∞</text>
                  <text x="324" y="225" fill="#48486A" fontSize="9" fontFamily="monospace">1..∞</text>
                  <text x="292" y="344" fill="#48486A" fontSize="9" fontFamily="monospace">1..∞</text>
                </svg>

                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1 }} className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-ok/10 border border-ok/30">
                  <CheckIcon size={10} className="text-ok" />
                  <span className="text-2xs text-ok font-medium">Schema complete</span>
                </motion.div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surf/80 border border-brd text-2xs text-sec pointer-events-none">
                  <RefreshCwIcon size={10} /> Re-layout
                </div>
              </div>

            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// Features
// ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <RepeatIcon size={18} className="text-acc" />,
    title: 'AI fallback chain',
    desc: 'Gemini 2.5 Flash is primary. If rate-limited, the request automatically retries on Groq (Llama 3.3) then OpenRouter. Zero downtime from a single provider being slow.',
  },
  {
    icon: <DatabaseIcon size={18} className="text-blue-400" />,
    title: 'Interactive ER diagram',
    desc: 'Built on React Flow — pinch to zoom, drag to pan, minimap for large schemas. Custom node cards show columns, types, PK/FK indicators, and nullable dots.',
  },
  {
    icon: <BookOpenIcon size={18} className="text-purple-400" />,
    title: 'Persistent project history',
    desc: 'Every schema session is saved to PostgreSQL. Switch between projects in the sidebar and your full chat and diagram restore instantly.',
  },
  {
    icon: <CodeIcon size={18} className="text-ok" />,
    title: 'DDL import',
    desc: 'Paste any CREATE TABLE SQL and the AI reads it, explains the schema, fills the diagram, and starts asking about gaps. Works with MySQL, Postgres, SQLite syntax.',
  },
  {
    icon: <ShieldCheckIcon size={18} className="text-warn" />,
    title: 'Auth & rate limiting',
    desc: 'JWT authentication (HMAC-SHA256, 30-day tokens), BCrypt password hashing. Per-IP rate limiting via Bucket4j prevents AI API abuse.',
  },
  {
    icon: <ZapIcon size={18} className="text-gold" />,
    title: 'Production-grade stack',
    desc: 'Java 21 virtual threads handle concurrent AI calls without thread-pool tuning. Spring Actuator provides liveness and readiness probes for Kubernetes.',
  },
  {
    icon: <CloudIcon size={18} className="text-blue-300" />,
    title: 'Cloudflare tunnel',
    desc: 'No open inbound ports on the server. Cloudflare\'s edge handles TLS termination, DDoS protection, and global anycast routing to the k3s cluster.',
  },
  {
    icon: <GitBranchIcon size={18} className="text-acc" />,
    title: 'GitOps with ArgoCD',
    desc: 'Push to main → GitHub Actions builds Docker images → ArgoCD Image Updater detects the tag → commits to git → ArgoCD reconciles the cluster. Full audit trail.',
  },
]

function Features() {
  return (
    <section id="features" className="py-16 px-6 bg-panel/40">
      <div className="max-w-6xl mx-auto">
        <FadeUp className="text-center mb-16">
          <span className="text-xs text-acc font-semibold uppercase tracking-widest">Features</span>
          <h2 className="text-[1.9rem] font-extrabold text-hi mt-3 tracking-tight">
            Everything you need
          </h2>
          <p className="text-sec text-md mt-3 max-w-lg mx-auto">
            From the first chat message to a Kubernetes-deployed production service.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.05}>
              <div className="rounded-xl bg-panel border border-brd p-5 h-full flex flex-col gap-3 hover:border-brdLt transition-colors">
                <div className="w-9 h-9 rounded-lg bg-surf border border-brd flex items-center justify-center flex-none">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-hi mb-1.5">{f.title}</h3>
                  <p className="text-xs text-sec leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tech stack
// ─────────────────────────────────────────────────────────────────
const STACK = [
  {
    category: 'Backend',
    color: 'text-green-400',
    bg: 'bg-green-400/10 border-green-400/20',
    items: [
      { name: 'Java 21', note: 'Virtual threads (Project Loom)' },
      { name: 'Spring Boot 3.2', note: 'REST, Security, Actuator' },
      { name: 'PostgreSQL 16', note: 'Persistent sessions + messages' },
      { name: 'Flyway', note: 'Versioned DB migrations' },
      { name: 'Bucket4j', note: 'Per-IP rate limiting' },
      { name: 'Spring Security', note: 'JWT + BCrypt auth' },
    ],
  },
  {
    category: 'Frontend',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/20',
    items: [
      { name: 'React 19', note: 'Component-based UI' },
      { name: 'TypeScript', note: 'End-to-end type safety' },
      { name: 'Vite 8', note: 'Sub-second HMR, optimised builds' },
      { name: 'Tailwind CSS', note: 'Design tokens, utility-first' },
      { name: 'Framer Motion', note: 'Spring-physics animations' },
      { name: 'React Flow', note: 'Interactive ER diagram canvas' },
    ],
  },
  {
    category: 'AI Layer',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/20',
    items: [
      { name: 'Gemini 2.5 Flash', note: 'Primary — fast, free tier' },
      { name: 'Groq (Llama 3.3)', note: 'Fallback #1 — ultra-fast inference' },
      { name: 'OpenRouter', note: 'Fallback #2 — free Llama tier' },
      { name: 'FallbackAiService', note: 'Auto-retries on rate limit/error' },
    ],
  },
  {
    category: 'Infrastructure',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10 border-orange-400/20',
    items: [
      { name: 'k3s', note: 'Lightweight Kubernetes on GCP VM' },
      { name: 'Helm 3', note: 'Kubernetes package management' },
      { name: 'ArgoCD', note: 'GitOps — watches git, syncs cluster' },
      { name: 'Cloudflare Tunnel', note: 'No open ports, free TLS' },
      { name: 'GitHub Actions', note: 'CI + Docker image builds' },
      { name: 'ghcr.io', note: 'Private container registry' },
    ],
  },
]

function TechStack() {
  return (
    <section id="stack" className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeUp className="text-center mb-16">
          <span className="text-xs text-acc font-semibold uppercase tracking-widest">Tech stack</span>
          <h2 className="text-[1.9rem] font-extrabold text-hi mt-3 tracking-tight">
            Built on world-class open source
          </h2>
          <p className="text-sec text-md mt-3 max-w-lg mx-auto">
            Every technology was chosen for a specific reason. No fads, no bloat.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STACK.map((cat, ci) => (
            <FadeUp key={cat.category} delay={ci * 0.08}>
              <div className="rounded-2xl bg-panel border border-brd p-5 h-full">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-2xs font-semibold mb-4 ${cat.bg} ${cat.color}`}>
                  <LayersIcon size={10} />
                  {cat.category}
                </div>
                <div className="flex flex-col gap-3">
                  {cat.items.map((item) => (
                    <div key={item.name} className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-hi">{item.name}</span>
                      <span className="text-2xs text-muted">{item.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// Deployment pipeline
// ─────────────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  { icon: '📝', label: 'git push main',          sub: 'You push code',                   tag: 'GitHub' },
  { icon: '⚙️', label: 'CI runs',                sub: 'Build + type-check passes',       tag: 'GitHub Actions' },
  { icon: '🐳', label: 'Docker images pushed',   sub: 'sha-abc1234 + latest to ghcr.io', tag: 'ghcr.io' },
  { icon: '🔍', label: 'Image Updater detects',  sub: 'New sha-* tag spotted',           tag: 'ArgoCD Image Updater' },
  { icon: '🔄', label: 'ArgoCD syncs',           sub: 'Git diff → cluster diff',         tag: 'ArgoCD' },
  { icon: '🚀', label: 'Rolling update',         sub: 'Zero-downtime pod swap',          tag: 'k3s' },
  { icon: '✅', label: 'Live in ~4 minutes',     sub: 'Audit commit in git history',     tag: 'GitOps' },
]

function Pipeline() {
  const [active, setActive] = useState(-1)
  const [running, setRunning] = useState(false)

  const play = () => {
    if (running) return
    setRunning(true)
    setActive(-1)
    PIPELINE_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setActive(i)
        if (i === PIPELINE_STEPS.length - 1) setRunning(false)
      }, i * 700)
    })
  }

  const reset = () => {
    setActive(-1)
    setRunning(false)
  }

  return (
    <section className="py-16 px-6 bg-panel/40">
      <div className="max-w-3xl mx-auto">
        <FadeUp className="text-center mb-12">
          <span className="text-xs text-acc font-semibold uppercase tracking-widest">CI / CD</span>
          <h2 className="text-[1.9rem] font-extrabold text-hi mt-3 tracking-tight">
            From push to live in 4 minutes
          </h2>
          <p className="text-sec text-md mt-3 max-w-lg mx-auto">
            One <code className="text-acc font-mono text-xs bg-acc/10 px-1.5 py-0.5 rounded">git push</code> triggers
            the entire pipeline. ArgoCD handles everything after images are built.
          </p>
        </FadeUp>

        <FadeUp>
          {/* Progress bar */}
          <div className="h-1 bg-surf rounded-full overflow-hidden mb-8">
            <motion.div
              className="h-full bg-acc rounded-full"
              animate={{ width: active >= 0 ? `${((active + 1) / PIPELINE_STEPS.length) * 100}%` : '0%' }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-2 mb-8">
            {PIPELINE_STEPS.map((step, i) => (
              <motion.div
                key={step.label}
                animate={{
                  opacity: i <= active ? 1 : 0.25,
                  x: i <= active ? 0 : -8,
                }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-panel border border-brd"
              >
                <span className="text-xl w-8 text-center">{step.icon}</span>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-hi">{step.label}</div>
                  <div className="text-2xs text-sec mt-0.5">{step.sub}</div>
                </div>
                <span className="text-2xs text-muted px-2 py-0.5 rounded-full border border-brd bg-surf hidden sm:block">
                  {step.tag}
                </span>
                {i <= active && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 rounded-full bg-ok/20 border border-ok/40 flex items-center justify-center flex-none">
                    <CheckIcon size={9} className="text-ok" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={play}
              disabled={running}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-acc hover:bg-accD text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RocketIcon size={13} /> {running ? 'Running…' : 'Simulate deploy'}
            </button>
            <button
              onClick={reset}
              className="px-5 py-2.5 rounded-xl bg-surf border border-brd text-sec hover:text-hi text-xs font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// API reference
// ─────────────────────────────────────────────────────────────────
const ENDPOINTS = [
  {
    method: 'POST', path: '/api/auth/register',
    desc: 'Create a new account',
    request: '{ "email": "...", "password": "...", "displayName": "..." }',
    response: '{ "token": "eyJ...", "userId": "uuid", "email": "...", "displayName": "..." }',
    auth: false,
  },
  {
    method: 'POST', path: '/api/auth/login',
    desc: 'Sign in, get a JWT',
    request: '{ "email": "...", "password": "..." }',
    response: '{ "token": "eyJ...", "userId": "uuid", "email": "...", "displayName": "..." }',
    auth: false,
  },
  {
    method: 'POST', path: '/api/sessions',
    desc: 'Start a new schema session (optionally seed with DDL)',
    request: '{ "ddl": "CREATE TABLE users ..." }  // optional',
    response: '{ "sessionId": "uuid", "message": "...", "diagram": "erDiagram ...", "complete": false }',
    auth: true,
  },
  {
    method: 'POST', path: '/api/sessions/{id}/messages',
    desc: 'Send a chat message, get AI reply + updated diagram',
    request: '{ "content": "Add a payments table" }',
    response: '{ "messageId": "uuid", "content": "...", "diagram": "erDiagram ...", "complete": false }',
    auth: true,
  },
  {
    method: 'GET', path: '/api/sessions/{id}',
    desc: 'Fetch full session — all messages + current diagram',
    request: '—',
    response: '{ "sessionId": "uuid", "messages": [...], "currentDiagram": "..." }',
    auth: true,
  },
  {
    method: 'GET', path: '/api/sessions',
    desc: 'List all sessions (projects sidebar)',
    request: '—',
    response: '[{ "sessionId": "...", "name": "...", "hasDiagram": true, "messageCount": 12 }]',
    auth: true,
  },
  {
    method: 'DELETE', path: '/api/sessions/{id}',
    desc: 'Delete a session permanently',
    request: '—',
    response: '204 No Content',
    auth: true,
  },
  {
    method: 'GET', path: '/actuator/health',
    desc: 'Kubernetes liveness / readiness probe',
    request: '—',
    response: '{ "status": "UP" }',
    auth: false,
  },
]

const METHOD_STYLE: Record<string, string> = {
  GET:    'bg-blue-400/10 text-blue-400 border-blue-400/25',
  POST:   'bg-ok/10 text-ok border-ok/25',
  DELETE: 'bg-err/10 text-err border-err/25',
  PUT:    'bg-warn/10 text-warn border-warn/25',
}

function APISection() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <section id="api" className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <FadeUp className="text-center mb-12">
          <span className="text-xs text-acc font-semibold uppercase tracking-widest">API reference</span>
          <h2 className="text-[1.9rem] font-extrabold text-hi mt-3 tracking-tight">
            Clean REST API
          </h2>
          <p className="text-sec text-md mt-3 max-w-lg mx-auto">
            Base URL: <code className="text-acc font-mono text-xs bg-acc/10 px-1.5 py-0.5 rounded">https://schemavis.shreyasshelar.uk/api</code>
            {' '}· Full interactive docs at <code className="text-xs font-mono text-muted">/swagger-ui.html</code>
          </p>
        </FadeUp>

        <FadeUp>
          <div className="flex flex-col gap-2">
            {ENDPOINTS.map((ep) => {
              const key = ep.method + ep.path
              const isOpen = open === key
              return (
                <div key={key} className="rounded-xl border border-brd overflow-hidden bg-panel">
                  <button
                    onClick={() => setOpen(isOpen ? null : key)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surf/50 transition-colors text-left"
                  >
                    <span className={`text-2xs font-bold px-2 py-0.5 rounded border font-mono w-14 text-center flex-none ${METHOD_STYLE[ep.method] ?? ''}`}>
                      {ep.method}
                    </span>
                    <code className="text-xs font-mono text-hi flex-1 truncate">{ep.path}</code>
                    <span className="text-2xs text-muted hidden sm:block mr-3">{ep.desc}</span>
                    {ep.auth && (
                      <span className="text-2xs text-warn border border-warn/25 bg-warn/10 px-1.5 py-0.5 rounded flex-none">
                        🔒 auth
                      </span>
                    )}
                    <ChevronDownIcon
                      size={13}
                      className={`text-muted transition-transform flex-none ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-brd px-5 py-4 grid sm:grid-cols-2 gap-4"
                    >
                      <div>
                        <p className="text-2xs text-muted uppercase tracking-wider mb-2">Request body</p>
                        <pre className="text-2xs font-mono text-sec bg-surf rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{ep.request}</pre>
                      </div>
                      <div>
                        <p className="text-2xs text-muted uppercase tracking-wider mb-2">Response</p>
                        <pre className="text-2xs font-mono text-sec bg-surf rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{ep.response}</pre>
                      </div>
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// Artifacts / detailed docs links
// ─────────────────────────────────────────────────────────────────
const ARTIFACTS = [
  {
    icon: <ServerIcon size={18} className="text-acc" />,
    title: 'Architecture',
    desc: 'Interactive SVG showing every component — browser, Cloudflare, k3s, ArgoCD, PostgreSQL, and the AI provider chain — with hover tooltips.',
    href: '/docs/architecture.html',
    tag: 'Interactive SVG',
  },
  {
    icon: <RocketIcon size={18} className="text-ok" />,
    title: 'Deployment flow',
    desc: 'Animated 7-step walkthrough of the GitOps pipeline — from git push to live pods updating. Click Play to watch the whole sequence.',
    href: '/docs/deployment-flow.html',
    tag: 'Animated steps',
  },
  {
    icon: <BookOpenIcon size={18} className="text-blue-400" />,
    title: 'API reference',
    desc: 'Full expandable endpoint cards with request/response tabs, authentication requirements, and error codes.',
    href: '/docs/api-reference.html',
    tag: 'Expandable cards',
  },
  {
    icon: <LayersIcon size={18} className="text-purple-400" />,
    title: 'Setup guide',
    desc: 'Interactive checklist with progress bar covering all 6 phases from GCP VM creation to first live deploy. Commands copy on click.',
    href: '/docs/setup-guide.html',
    tag: 'Interactive checklist',
  },
]

function Artifacts() {
  return (
    <section id="artifacts" className="py-16 px-6 bg-panel/40">
      <div className="max-w-5xl mx-auto">
        <FadeUp className="text-center mb-14">
          <span className="text-xs text-acc font-semibold uppercase tracking-widest">Interactive artifacts</span>
          <h2 className="text-[1.9rem] font-extrabold text-hi mt-3 tracking-tight">
            Deep-dive documentation
          </h2>
          <p className="text-sec text-md mt-3 max-w-lg mx-auto">
            Each artifact is a standalone interactive page with animations, live demos, and copy-ready commands.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 gap-5">
          {ARTIFACTS.map((a, i) => (
            <FadeUp key={a.title} delay={i * 0.08}>
              <a
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-4 rounded-2xl bg-panel border border-brd p-6 h-full hover:border-acc/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-surf border border-brd flex items-center justify-center">
                    {a.icon}
                  </div>
                  <ExternalLinkIcon size={13} className="text-muted group-hover:text-acc transition-colors mt-1" />
                </div>
                <div className="flex-1">
                  <h3 className="text-md font-bold text-hi mb-2">{a.title}</h3>
                  <p className="text-xs text-sec leading-relaxed">{a.desc}</p>
                </div>
                <span className="text-2xs text-muted px-2.5 py-1 rounded-full bg-surf border border-brd self-start">
                  {a.tag}
                </span>
              </a>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// CTA
// ─────────────────────────────────────────────────────────────────
function CTA() {
  const hydrated        = useAuthHydrated()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated) && hydrated
  return (
    <section className="py-16 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <FadeUp>
          <div className="relative rounded-3xl bg-panel border border-brd p-12 overflow-hidden">
            {/* Background accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-acc/5 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-acc/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-acc/20 border border-acc/40 flex items-center justify-center mx-auto mb-6">
                <DatabaseIcon size={24} className="text-acc" />
              </div>

              <h2 className="text-[2rem] font-extrabold text-hi mb-4 tracking-tight">
                Start designing your<br />
                <span className="bg-gradient-to-r from-acc to-purple-400 bg-clip-text text-transparent">
                  database schema
                </span>
              </h2>

              <p className="text-sec text-md mb-8 max-w-sm mx-auto leading-relaxed">
                Free to use. No credit card. Your schemas are private, persistent, and yours.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {!hydrated ? (
                  <div className="h-11 w-44 rounded-xl bg-acc/40 animate-pulse" />
                ) : isAuthenticated ? (
                  <Link
                    to="/"
                    className="flex items-center gap-2 px-7 py-3 rounded-xl bg-acc hover:bg-accD text-white font-bold text-sm transition-colors shadow-glow"
                  >
                    Open app <ArrowRightIcon size={15} />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="flex items-center gap-2 px-7 py-3 rounded-xl bg-acc hover:bg-accD text-white font-bold text-sm transition-colors shadow-glow"
                    >
                      Create free account <ArrowRightIcon size={15} />
                    </Link>
                    <Link
                      to="/login"
                      className="flex items-center gap-2 px-7 py-3 rounded-xl bg-surf border border-brd hover:border-brdLt text-sec hover:text-hi font-medium text-sm transition-colors"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────
function Footer() {
  const hydrated        = useAuthHydrated()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated) && hydrated
  return (
    <footer className="border-t border-brd bg-panel/40 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-acc/20 border border-acc/40 flex items-center justify-center">
            <DatabaseIcon size={12} className="text-acc" />
          </div>
          <span className="font-bold text-sm text-hi">Schema<span className="text-acc">Vis</span></span>
          <span className="text-muted text-xs ml-2">
            Java 21 · Spring Boot 3.2 · React 19 · k3s
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs text-sec">
          <Link to="/" className="hover:text-hi transition-colors">App</Link>
          {hydrated && !isAuthenticated && (
            <Link to="/register" className="hover:text-hi transition-colors">Register</Link>
          )}
          <a href="/docs/architecture.html" className="hover:text-hi transition-colors">Architecture</a>
          <a href="/docs/api-reference.html" className="hover:text-hi transition-colors">API docs</a>
          <a
            href="https://github.com/shreyasshelar/SchemaVis"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-hi transition-colors flex items-center gap-1"
          >
            GitHub <ExternalLinkIcon size={10} />
          </a>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────────────────────────
// Page root
// ─────────────────────────────────────────────────────────────────
export default function DocsPage() {
  // Inject a <style> tag to override the app-level overflow:hidden rules.
  // The globals.css sets html/body/#root to overflow:hidden for the workspace.
  // DocsPage needs normal window scrolling, so we use !important to win the cascade.
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'docs-scroll-override'
    style.textContent = 'html, body, #root { overflow: auto !important; height: auto !important; }'
    document.head.appendChild(style)
    return () => { document.getElementById('docs-scroll-override')?.remove() }
  }, [])

  return (
    <div className="min-h-screen bg-app text-hi">
      <DocsNav />
      <Hero />
      <HowItWorks />
      <Demo />
      <Features />
      <TechStack />
      <Pipeline />
      <APISection />
      <Artifacts />
      <CTA />
      <Footer />
    </div>
  )
}
