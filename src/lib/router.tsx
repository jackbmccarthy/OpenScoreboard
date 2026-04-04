'use client'

import type React from 'react'
import { useEffect, useState } from 'react'

type AnyProps = Record<string, any>

type NavigateOptions = {
  replace?: boolean
}

type CompatLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> &
  AnyProps & {
    to: string
  }

type LocationShape = {
  pathname: string
  search: string
  hash: string
}

function getLocationSnapshot(): LocationShape {
  if (typeof window === 'undefined') {
    return {
      pathname: '/',
      search: '',
      hash: '',
    }
  }

  return {
    pathname: window.location.pathname || '/',
    search: window.location.search || '',
    hash: window.location.hash || '',
  }
}

function getMergedSearchParams() {
  if (typeof window === 'undefined') {
    return new URLSearchParams()
  }

  return new URLSearchParams(window.location.search)
}

function notifyLocationChange() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function BrowserRouter({ children, ...props }: { children: React.ReactNode } & AnyProps) {
  return <>{children}</>
}

export function Routes({ children, ...props }: { children: React.ReactNode } & AnyProps) {
  return <>{children}</>
}

export function Route({
  element,
  children,
  ...props
}: {
  element?: React.ReactNode
  children?: React.ReactNode
} & AnyProps) {
  return <>{element ?? children ?? null}</>
}

export function Outlet({ children, ...props }: { children?: React.ReactNode } & AnyProps) {
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
  return (to: string | number, options?: NavigateOptions) => {
    if (typeof window === 'undefined') {
      return
    }

    if (typeof to === 'number') {
      if (to < 0) {
        window.history.go(to)
      } else if (to > 0) {
        window.history.go(to)
      }
      notifyLocationChange()
      return
    }

    if (options?.replace) {
      window.history.replaceState(window.history.state, '', to)
    } else {
      window.history.pushState(window.history.state, '', to)
    }

    notifyLocationChange()
  }
}

export function useLocation() {
  const [location, setLocation] = useState<LocationShape>(getLocationSnapshot)

  useEffect(() => {
    const handlePopState = () => {
      setLocation(getLocationSnapshot())
    }

    window.addEventListener('popstate', handlePopState)
    handlePopState()

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return {
    ...location,
    state: null,
    key: `${location.pathname}${location.search}${location.hash}`,
  }
}

export function useParams<TParams extends Record<string, string | string[] | undefined>>() {
  const location = getLocationSnapshot()
  const searchParams = getMergedSearchParams()
  const pathnameSegments = location.pathname.split('/').filter(Boolean)
  const merged: Record<string, string | string[] | undefined> = {}

  searchParams.forEach((value, key) => {
    merged[key] = value

    if (key.endsWith('Id')) {
      const legacyKey = `${key.slice(0, -2)}ID`
      if (!(legacyKey in merged)) {
        merged[legacyKey] = value
      }
    }
  })

  const routeHints = [
    pathnameSegments[1] === 'table' ? { tableID: pathnameSegments[2] } : null,
    pathnameSegments[0] === 'match' ? { id: pathnameSegments[1] } : null,
    pathnameSegments[0] === 'playerregistration' ? { id: pathnameSegments[1], playerListID: pathnameSegments[1] } : null,
    pathnameSegments[0] === 'scoring' && pathnameSegments[1] === 'table'
      ? { id: pathnameSegments[2], tableID: pathnameSegments[2] }
      : null,
    pathnameSegments[0] === 'teamscoring' && pathnameSegments[1] === 'teammatch'
      ? { id: pathnameSegments[2], teamMatchID: pathnameSegments[2] }
      : null,
    pathnameSegments[0] === 'qrcode' ? { tableID: searchParams.get('tableID') || undefined } : null,
    pathnameSegments[0] === 'scheduledtablematches'
      ? { tableID: searchParams.get('tableID') || undefined }
      : null,
  ].filter(Boolean) as Array<Record<string, string | undefined>>

  for (const hint of routeHints) {
    Object.entries(hint).forEach(([key, value]) => {
      if (typeof value !== 'undefined' && !(key in merged)) {
        merged[key] = value
      }
    })
  }

  const firstParamValue = pathnameSegments[pathnameSegments.length - 1]
  if (firstParamValue) {
    if (typeof merged.id === 'undefined') {
      merged.id = firstParamValue
    }
    if (typeof merged.tableID === 'undefined') {
      merged.tableID = firstParamValue
    }
    if (typeof merged.playerListID === 'undefined') {
      merged.playerListID = firstParamValue
    }
    if (typeof merged.teamMatchID === 'undefined') {
      merged.teamMatchID = firstParamValue
    }
  }

  return merged as TParams
}

export function useSearchParams() {
  const [searchParams, setSearchParams] = useState(() => getMergedSearchParams())

  useEffect(() => {
    const handlePopState = () => {
      setSearchParams(getMergedSearchParams())
    }

    window.addEventListener('popstate', handlePopState)
    handlePopState()

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return [new URLSearchParams(searchParams.toString()), () => {}] as const
}

export function NavLink(props: CompatLinkProps) {
  return <CompatLink {...props} />
}

export function CompatLink({ to, children, onClick, ...rest }: CompatLinkProps) {
  const navigate = useNavigate()

  return (
    <a
      href={to}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
          event.preventDefault()
          navigate(to)
        }
      }}
      {...rest}
    >
      {children}
    </a>
  )
}

export { CompatLink as Link }
