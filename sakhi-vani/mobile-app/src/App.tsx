import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { House, Users, CalendarDays, Bell, Ellipsis, Landmark, MessageCircle, UserRound, X } from 'lucide-react'
import type { AppNotification, Lang } from '../../shared-types'
import type { PublicUser } from '../../core/service'
import { api } from './api/client'
import { Ctx, type AppCtx, type Route } from './ctx'
import { translate, type TKey } from './i18n'
import { PriorityBadge, cx } from './components/ui'
import { Splash, Login, Register, Notifications, Settings, openLink } from './screens/common'
import { AshaHome, People, Households, BeneficiaryProfile, Records, VoiceDoc, ReviewDraft, Visits, AshaRequests, Documents, Water, AuditLogScreen, AshaMore } from './screens/asha'
import { CitizenHome, HealthProfile, Schemes, SchemeDetail, Eligibility, RequestAsha, CitizenRequests, Maternal, ChildHealth, ElderlyCare, Appointments, Assistant } from './screens/citizen'
import { CallSimulator } from './screens/call'

const ASHA_TABS: Array<{ name: string; label: TKey; icon: ReactNode }> = [
  { name: 'home', label: 'home', icon: <House className="size-5" /> },
  { name: 'people', label: 'beneficiaries', icon: <Users className="size-5" /> },
  { name: 'visits', label: 'visits', icon: <CalendarDays className="size-5" /> },
  { name: 'alerts', label: 'alerts', icon: <Bell className="size-5" /> },
  { name: 'more', label: 'more', icon: <Ellipsis className="size-5" /> },
]
const CITIZEN_TABS: Array<{ name: string; label: TKey; icon: ReactNode }> = [
  { name: 'home', label: 'home', icon: <House className="size-5" /> },
  { name: 'schemes', label: 'schemes', icon: <Landmark className="size-5" /> },
  { name: 'assistant', label: 'assistant', icon: <MessageCircle className="size-5" /> },
  { name: 'alerts', label: 'alerts', icon: <Bell className="size-5" /> },
  { name: 'profile', label: 'profile', icon: <UserRound className="size-5" /> },
]

const ASHA_SCREENS: Record<string, () => ReactNode> = {
  home: () => <AshaHome />, people: () => <People />, visits: () => <Visits />, visitsList: () => <Visits />, alerts: () => <Notifications />, more: () => <AshaMore />,
  households: () => <Households />, beneficiary: () => <BeneficiaryProfile />, records: () => <Records />, voice: () => <VoiceDoc />, review: () => <ReviewDraft />,
  requests: () => <AshaRequests />, documents: () => <Documents />, water: () => <Water />, audit: () => <AuditLogScreen />, settings: () => <Settings />,
}
const CITIZEN_SCREENS: Record<string, () => ReactNode> = {
  home: () => <CitizenHome />, schemes: () => <Schemes />, assistant: () => <Assistant />, alerts: () => <Notifications />, profile: () => <HealthProfile />,
  scheme: () => <SchemeDetail />, eligibility: () => <Eligibility />, requestAsha: () => <RequestAsha />, requests: () => <CitizenRequests />, maternal: () => <Maternal />,
  child: () => <ChildHealth />, elderly: () => <ElderlyCare />, appointments: () => <Appointments />, call: () => <CallSimulator />, settings: () => <Settings />, appointmentsList: () => <Appointments />,
}
const PUBLIC_SCREENS: Record<string, () => ReactNode> = { splash: () => <Splash />, login: () => <Login />, register: () => <Register /> }

interface Toast { id: number; message: string; tone: 'ok' | 'error' | 'info' }

export default function App() {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('sakhi-vani:lang') as Lang) || 'en')
  const [user, setUserState] = useState<PublicUser | null>(null)
  const [booting, setBooting] = useState(true)
  const [stack, setStack] = useState<Route[]>([{ name: 'splash' }])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [popup, setPopup] = useState<AppNotification | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [unread, setUnread] = useState(0)
  const seen = useRef<Set<string> | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem('sakhi-vani:lang', l); document.documentElement.lang = l }
  const setUser = useCallback((u: PublicUser | null) => {
    setUserState(u)
    seen.current = null
    setStack([{ name: u ? 'home' : 'splash' }])
  }, [])

  useEffect(() => {
    document.title = 'SAKHI VANI'
    if (!api.session()) { setBooting(false); return }
    api.call('me').then((m) => setUser(m.user)).catch(() => api.logout()).finally(() => setBooting(false))
  }, [setUser])

  const toast = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  // Poll notifications: new unread items appear as an in-app pop-up alert.
  useEffect(() => {
    if (!user) return
    let alive = true
    const tick = async () => {
      try {
        const list = await api.call('listNotifications')
        if (!alive) return
        const unreadList = list.filter((n) => !n.read)
        setUnread(unreadList.length)
        if (seen.current === null) { seen.current = new Set(list.map((n) => n.id)); return }
        const fresh = unreadList.find((n) => !seen.current!.has(n.id))
        list.forEach((n) => seen.current!.add(n.id))
        if (fresh) setPopup(fresh)
      } catch { /* offline or logged out */ }
    }
    tick()
    const id = setInterval(tick, 4000)
    return () => { alive = false; clearInterval(id) }
  }, [user, refreshKey])

  useEffect(() => { scroller.current?.scrollTo({ top: 0 }) }, [stack])
  useEffect(() => {
    if (!popup) return
    const id = setTimeout(() => setPopup(null), 6000)
    return () => clearTimeout(id)
  }, [popup])

  const route = stack[stack.length - 1]
  const ctx: AppCtx = useMemo(() => ({
    lang, setLang, t: (k: TKey) => translate(lang, k), user, setUser, route,
    push: (name, params) => setStack((s) => [...s, { name, params }]),
    back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    tab: (name) => setStack([{ name }]),
    canGoBack: stack.length > 1,
    toast,
    refreshKey,
    bump: () => setRefreshKey((k) => k + 1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [lang, user, route, stack.length, toast, refreshKey, setUser])

  const screens = !user ? PUBLIC_SCREENS : user.role === 'asha' ? ASHA_SCREENS : CITIZEN_SCREENS
  const render = screens[route.name] ?? screens.home ?? screens.splash
  const tabs = !user ? null : user.role === 'asha' ? ASHA_TABS : CITIZEN_TABS
  const hideNav = route.name === 'call'

  return (
    <Ctx.Provider value={ctx}>
      <div className="min-h-dvh bg-[#E9E4D8] sm:py-6">
        <div className="relative mx-auto flex h-dvh max-w-[480px] flex-col overflow-hidden bg-paper font-sans text-ink sm:h-[calc(100dvh-3rem)] sm:rounded-[36px] sm:shadow-[0_30px_80px_-30px_rgba(19,41,75,0.45)]">
          <div ref={scroller} className="flex-1 overflow-y-auto">
            {booting ? <div className="grid h-full place-items-center text-ink/50">Loading…</div> : <div key={stack.length + route.name}>{render()}</div>}
          </div>
          {tabs && !hideNav && (
            <nav aria-label="Main" className="absolute inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 backdrop-blur">
              <ul className="grid grid-cols-5">
                {tabs.map((tb) => {
                  const active = stack[0].name === tb.name
                  return (
                    <li key={tb.name}>
                      <button onClick={() => ctx.tab(tb.name)} aria-current={active ? 'page' : undefined} className={cx('relative flex w-full flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-semibold', active ? 'text-leaf' : 'text-ink/50')}>
                        <span className={cx('grid h-8 w-12 place-items-center rounded-full transition', active && 'bg-leaf-soft')}>{tb.icon}</span>
                        <span className="max-w-full truncate px-1">{ctx.t(tb.label)}</span>
                        {tb.name === 'alerts' && unread > 0 && <span className="absolute right-[18%] top-0.5 grid min-w-[18px] place-items-center rounded-full bg-rose px-1 text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          )}
          {popup && (
            <div role="alert" className="absolute inset-x-3 top-3 z-50 rounded-3xl border border-line bg-white p-4 shadow-[0_20px_50px_-20px_rgba(19,41,75,0.55)]">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-leaf-soft text-leaf"><Bell className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <PriorityBadge p={popup.priority} />
                  <p className="mt-1 text-[14.5px] font-semibold leading-snug text-ink">{popup.title}</p>
                  <p className="text-[13px] leading-snug text-ink/60">{popup.body}</p>
                  <div className="mt-2 flex gap-3">
                    {popup.link && <button className="text-[13px] font-semibold text-leaf" onClick={async () => { await api.call('markNotificationRead', { id: popup.id }); openLink(ctx.push, popup.link); setPopup(null); ctx.bump() }}>Open</button>}
                    <button className="text-[13px] font-semibold text-ink/50" onClick={() => setPopup(null)}>Dismiss</button>
                  </div>
                </div>
                <button aria-label="Close" onClick={() => setPopup(null)}><X className="size-4 text-ink/40" /></button>
              </div>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4">
            {toasts.map((t) => (
              <div key={t.id} className={cx('rounded-2xl px-4 py-2.5 text-[13.5px] font-semibold shadow-lg', t.tone === 'error' ? 'bg-rose text-white' : t.tone === 'ok' ? 'bg-navy text-white' : 'bg-ink text-white')}>{t.message}</div>
            ))}
          </div>
        </div>
      </div>
    </Ctx.Provider>
  )
}
