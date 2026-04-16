import { useEffect, useState } from 'react'

type DeleteReportState<TReport> = {
  report: TReport | null
  loading: boolean
  error: string
}

const emptyState = {
  report: null,
  loading: false,
  error: '',
}

export function useOwnershipDeleteReport<TReport>(
  requestKey: string,
  loadReport: (() => Promise<TReport>) | null,
) {
  const [state, setState] = useState<DeleteReportState<TReport>>(emptyState)

  useEffect(() => {
    if (!requestKey || !loadReport) {
      setState(emptyState)
      return
    }

    let cancelled = false
    setState({
      report: null,
      loading: true,
      error: '',
    })

    void loadReport()
      .then((report) => {
        if (cancelled) {
          return
        }
        setState({
          report,
          loading: false,
          error: '',
        })
      })
      .catch((error) => {
        if (cancelled) {
          return
        }
        setState({
          report: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load delete impact.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [requestKey])

  return state
}
