import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { ChevronLeft, LoaderCircle, X, Info, ShieldCheck } from 'lucide-react'
import type { NotificationPriority, Provenance } from '../../../shared-types'
import { useApp } from '../ctx'

export function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ')
}

export function Logo({ size = 40, light = false }: { size?: number; light?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill={light ? '#ffffff' : '#0F7A5A'} />
      <path d="M14 30c3-9 9-14 20-15-1 11-7 17-16 18" fill="none" stroke={light ? '#0F7A5A' : '#F6F3EC'} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M17 33c4-5 8-8 13-10" fill="none" stroke={light ? '#0F7A5A' : '#F6F3EC'} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="34" cy="34" r="3" fill="#E9B44C" />
    </svg>
  )
}

export function Screen({ title, subtitle, children, right, noBack, tone = 'paper' }: { title: string; subtitle?: string; children: ReactNode; right?: ReactNode; noBack?: boolean; tone?: 'paper' | 'navy' }) {
  const { back, canGoBack, t } = useApp()
  return (
    <div className="flex min-h-full flex-col">
      <header className={cx('sticky top-0 z-20 flex items-center gap-2 px-4 pb-3 pt-4 backdrop-blur', tone === 'navy' ? 'bg-navy/95 text-white' : 'bg-paper/90 text-ink')}>
        {!noBack && canGoBack && (
          <button onClick={back} aria-label={t('back')} className={cx('-ml-2 grid size-10 place-items-center rounded-full', tone === 'navy' ? 'hover:bg-white/10' : 'hover:bg-black/5')}>
            <ChevronLeft className="size-6" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[19px] font-bold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className={cx('truncate text-[13px]', tone === 'navy' ? 'text-white/70' : 'text-ink/60')}>{subtitle}</p>}
        </div>
        {right}
      </header>
      <div className="flex-1 px-4 pb-28">{children}</div>
    </div>
  )
}

export function Card({ children, className, onClick, as = 'div' }: { children: ReactNode; className?: string; onClick?: () => void; as?: 'div' | 'button' }) {
  const cls = cx('rounded-3xl border border-line bg-white p-4 shadow-[0_1px_0_rgba(19,41,75,0.04)]', onClick && 'w-full text-left transition active:scale-[0.99] hover:border-leaf/40', className)
  if (onClick || as === 'button') return <button onClick={onClick} className={cls}>{children}</button>
  return <div className={cls}>{children}</div>
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'navy'; size?: 'md' | 'lg' | 'sm'; icon?: ReactNode; loading?: boolean; block?: boolean }
export function Button({ variant = 'primary', size = 'md', icon, loading, block, className, children, disabled, ...rest }: BtnProps) {
  const v = {
    primary: 'bg-leaf text-white hover:bg-leaf-deep',
    navy: 'bg-navy text-white hover:bg-navy/90',
    secondary: 'bg-white text-navy border border-line hover:border-navy/30',
    ghost: 'bg-transparent text-leaf hover:bg-leaf-soft',
    danger: 'bg-rose text-white hover:bg-rose/90',
  }[variant]
  const s = { sm: 'h-9 px-3 text-[13px] rounded-xl', md: 'h-12 px-4 text-[15px] rounded-2xl', lg: 'h-14 px-5 text-base rounded-2xl' }[size]
  return (
    <button {...rest} disabled={disabled || loading} className={cx('inline-flex items-center justify-center gap-2 font-semibold transition disabled:opacity-50', v, s, block && 'w-full', className)}>
      {loading ? <LoaderCircle className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}

const TONES = {
  green: 'bg-leaf-soft text-leaf-deep',
  amber: 'bg-sun-soft text-[#8A5A08]',
  red: 'bg-rose-soft text-rose',
  blue: 'bg-mist-soft text-mist',
  gray: 'bg-black/5 text-ink/70',
  navy: 'bg-navy text-white',
}
export type Tone = keyof typeof TONES
export function Badge({ tone = 'gray', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold leading-5', TONES[tone], className)}>{children}</span>
}

export function DemoBadge() {
  const { t } = useApp()
  return <Badge tone="amber">{t('demoData')}</Badge>
}

const PROV: Record<Provenance, { label: string; tone: Tone }> = {
  beneficiary_reported: { label: 'Reported by beneficiary', tone: 'blue' },
  self_reported: { label: 'Self-reported', tone: 'blue' },
  asha_recorded: { label: 'ASHA-recorded', tone: 'green' },
  measured: { label: 'Measurement', tone: 'amber' },
  professionally_verified: { label: 'From facility record', tone: 'navy' },
  system: { label: 'System', tone: 'gray' },
}
export function ProvenanceBadge({ source, voice }: { source: Provenance; voice?: boolean }) {
  const p = PROV[source]
  return (
    <span className="inline-flex flex-wrap gap-1">
      <Badge tone={p.tone}>{p.label}</Badge>
      {voice && <Badge tone="gray">Voice, reviewed</Badge>}
    </span>
  )
}

const PRIORITY: Record<NotificationPriority, { label: string; tone: Tone }> = {
  info: { label: 'Information', tone: 'blue' },
  reminder: { label: 'Reminder', tone: 'green' },
  attention: { label: 'Attention required', tone: 'amber' },
  urgent: { label: 'Urgent guidance', tone: 'red' },
}
export function PriorityBadge({ p }: { p: NotificationPriority }) {
  return <Badge tone={PRIORITY[p].tone}>{PRIORITY[p].label}</Badge>
}

export function Field({ label, hint, children, required }: { label: string; hint?: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink/80">
        {label}
        {required && <span className="text-rose"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-ink/55">{hint}</span>}
    </label>
  )
}
const inputCls = 'w-full rounded-2xl border border-line bg-white px-3.5 text-[15px] text-ink outline-none transition placeholder:text-ink/35 focus:border-leaf focus:ring-4 focus:ring-leaf/10'
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(inputCls, 'h-12', p.className)} />
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(inputCls, 'h-12', p.className)} />
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx(inputCls, 'min-h-24 py-3', p.className)} />

export function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('mt-6', className)}>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink/55">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-ink/50">
      <LoaderCircle className="size-5 animate-spin" /> <span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mt-4 rounded-2xl border border-rose/30 bg-rose-soft p-4 text-sm text-rose">
      <p className="font-semibold">Something went wrong</p>
      <p className="mt-1">{message}</p>
      {onRetry && <button onClick={onRetry} className="mt-2 font-semibold underline">Try again</button>}
    </div>
  )
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-10 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-leaf-soft text-leaf">{icon}</div>
      <p className="font-semibold text-ink">{title}</p>
      {body && <p className="mt-1 text-sm text-ink/60">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Notice({ tone = 'blue', title, children, icon }: { tone?: 'blue' | 'amber' | 'red' | 'green'; title?: string; children: ReactNode; icon?: ReactNode }) {
  const c = { blue: 'bg-mist-soft text-navy border-mist/20', amber: 'bg-sun-soft text-[#6E4706] border-sun/30', red: 'bg-rose-soft text-rose border-rose/30', green: 'bg-leaf-soft text-leaf-deep border-leaf/20' }[tone]
  return (
    <div className={cx('flex gap-3 rounded-2xl border p-3.5 text-[13.5px] leading-relaxed', c)}>
      <span className="mt-0.5 shrink-0">{icon ?? (tone === 'green' ? <ShieldCheck className="size-4" /> : <Info className="size-4" />)}</span>
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}

export function Modal({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-[460px] overflow-y-auto rounded-t-[28px] bg-paper p-5 shadow-2xl sm:rounded-[28px]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-black/5"><X className="size-5" /></button>
        </div>
        {children}
        {footer && <div className="mt-5 flex gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function StatTile({ label, value, icon, tone = 'green', onClick }: { label: string; value: number | string; icon: ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue' | 'navy'; onClick?: () => void }) {
  const c = { green: 'bg-leaf-soft text-leaf-deep', amber: 'bg-sun-soft text-[#8A5A08]', red: 'bg-rose-soft text-rose', blue: 'bg-mist-soft text-mist', navy: 'bg-navy/10 text-navy' }[tone]
  return (
    <button onClick={onClick} disabled={!onClick} className="flex min-h-[92px] flex-col justify-between rounded-3xl border border-line bg-white p-3.5 text-left transition enabled:hover:border-leaf/40 enabled:active:scale-[0.98]">
      <span className={cx('grid size-8 place-items-center rounded-xl', c)}>{icon}</span>
      <span>
        <span className="block text-[24px] font-bold leading-none tracking-tight text-ink">{value}</span>
        <span className="mt-1 block text-[12px] leading-tight text-ink/60">{label}</span>
      </span>
    </button>
  )
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl bg-black/5 p-1">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cx('h-9 shrink-0 flex-1 rounded-xl px-3 text-[13px] font-semibold whitespace-nowrap transition', value === o.value ? 'bg-white text-navy shadow-sm' : 'text-ink/60')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
