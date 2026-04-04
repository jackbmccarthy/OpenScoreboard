import { NextResponse } from 'next/server'
import { executeDatabaseActions, type DatabaseAction } from '@/server/databaseDriver'

export const runtime = 'nodejs'

type RequestBody = {
  actions?: DatabaseAction[]
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody
    const actions = Array.isArray(body.actions) ? body.actions : []

    if (actions.length === 0) {
      return NextResponse.json(
        { error: 'No database actions were provided.' },
        { status: 400 },
      )
    }

    const authorization = request.headers.get('authorization')
    const authToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : null

    const results = await executeDatabaseActions(actions, authToken)
    return NextResponse.json({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database request failed'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
