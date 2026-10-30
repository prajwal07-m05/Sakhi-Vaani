import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { Lang } from '../../shared-types'
import type { PublicUser } from '../../core/service'
import { translate, type TKey } from './i18n'

export interface Route {
  name: string
  params?: Record<string, string | undefined>
}

export interface AppCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (k: TKey) => string
  user: PublicUser | null
  setUser: (u: PublicUser | null) => void
  route: Route
  push: (name: string, params?: Route['params']) => void
  back: () => void
  tab: (name: string) => void
  canGoBack: boolean
  toast: (message: string, tone?: 'ok' | 'error' | 'info') => void
  refreshKey: number
  bump: () => void
}

export const Ctx = createContext<AppCtx>(null as unknown as AppCtx)
export const useApp = () => useContext(Ctx)
export const useT = () => useContext(Ctx).t
export { translate }

/** Small data-loading hook: re-runs when deps or the global refresh key change. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const { refreshKey } = useApp()
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const fnRef = useRef(fn)
  fnRef.current = fn
  const reload = useCallback(() => {
    setLoading(true)
    setError(undefined)
    fnRef.current()
      .then((d) => setData(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, [...deps, refreshKey])
  return { data, error, loading, reload, setData }
}
