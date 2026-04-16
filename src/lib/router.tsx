'use client'

import type React from 'react'
import Link, { type LinkProps } from 'next/link'
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation'
import { useEffect } from 'react'

type AnyProps = Record<string, unknown>

type NavigateOptions = {
  replace?: boolean
}

type CompatLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> &
  Omit<LinkProps, 'href'> &
  AnyProps & {
    to: string
  }

export function BrowserRouter({ children }: { children: React.ReactNode } & AnyProps) {
  return <>{children}</>
}

export function Routes({ children }: { children: React.ReactNode } & AnyProps) {
  return <>{children}</>
}

export function Route({
  element,
  children,
}: {
  element?: React.ReactNode
  children?: React.ReactNode
} & AnyProps) {
  return <>{element ?? children ?? null}</>
}

export function Outlet({ children }: { children?: React.ReactNode } & AnyProps) {
  return <>{children ?? null}</>
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const navigate = useNavigate()

  useEffect(() => {
    navigate(to, { replace })
  }, [navigate, replace, to])

  return null
}

export function useNavigate() {
  const router = useRouter()

  return (to: string | number, options?: NavigateOptions) => {
    if (typeof to === 'number') {
      if (to !== 0 && typeof window !== 'undefined') {
        window.history.go(to)
      }
      return
    }

    if (options?.replace) {
      router.replace(to)
      return
    }

    router.push(to)
  }
}

export function useLocation() {
  const pathname = usePathname()
  const searchParams = useNextSearchParams()
  const search = searchParams?.toString() || ''

  return {
    pathname: pathname || '/',
    search: search ? `?${search}` : '',
    hash: '',
    state: null,
    key: `${pathname || '/'}${search ? `?${search}` : ''}`,
  }
}

export function useParams<TParams extends Record<string, string | string[] | undefined>>() {
  const params = (useNextParams() || {}) as Record<string, string | string[] | undefined>
  const pathname = usePathname() || '/'
  const searchParams = useNextSearchParams()
  const safeSearchParams = searchParams ?? new URLSearchParams()
  const merged: Record<string, string | string[] | undefined> = { ...params }
  const pathnameSegments = pathname.split('/').filter(Boolean)

  safeSearchParams.forEach((value, key) => {
    merged[key] = value

    if (key.endsWith('Id')) {
      const legacyKey = `${key.slice(0, -2)}ID`
      if (!(legacyKey in merged)) {
        merged[legacyKey] = value
      }
    }
  })

  if (pathnameSegments[0] === 'scoring' && pathnameSegments[1] === 'table' && pathnameSegments[2]) {
    merged.id ??= pathnameSegments[2]
    merged.tableID ??= pathnameSegments[2]
  }

  if (pathnameSegments[0] === 'teamscoring' && pathnameSegments[1] === 'teammatch' && pathnameSegments[2]) {
    merged.id ??= pathnameSegments[2]
    merged.teamMatchID ??= pathnameSegments[2]
  }

  if (pathnameSegments[0] === 'match' && pathnameSegments[1]) {
    merged.id ??= pathnameSegments[1]
  }

  if (pathnameSegments[0] === 'playerregistration' && pathnameSegments[1]) {
    merged.id ??= pathnameSegments[1]
    merged.playerListID ??= pathnameSegments[1]
    merged.password ??= pathnameSegments[2] || undefined
  }

  if (pathnameSegments[0] === 'qrcode') {
    merged.tableID ??= safeSearchParams.get('tableID') || undefined
  }

  if (pathnameSegments[0] === 'scheduledtablematches') {
    merged.tableID ??= safeSearchParams.get('tableID') || undefined
  }

  return merged as TParams
}

export function useSearchParams() {
  const searchParams = useNextSearchParams()
  return [new URLSearchParams(searchParams?.toString() || ''), () => {}] as const
}

export function NavLink(props: CompatLinkProps) {
  return <CompatLink {...props} />
}

export function CompatLink({ to, children, onClick, ...rest }: CompatLinkProps) {
  return (
    <Link
      href={to}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Link>
  )
}

export { CompatLink as Link }
