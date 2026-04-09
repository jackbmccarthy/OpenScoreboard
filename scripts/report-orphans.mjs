#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { auditOwnershipSnapshot } from './ownership-audit.mjs'

async function main() {
  const [, , inputPath, ...args] = process.argv
  const strictMode = args.includes('--strict')

  if (!inputPath) {
    console.error('Usage: node scripts/report-orphans.mjs <snapshot.json> [--strict]')
    process.exit(1)
  }

  const absoluteInputPath = path.resolve(process.cwd(), inputPath)
  const raw = fs.readFileSync(absoluteInputPath, 'utf8')
  const snapshot = JSON.parse(raw)

  const report = auditOwnershipSnapshot(snapshot)

  console.log(JSON.stringify(report, null, 2))

  const hasErrors = report.issues.some((issue) => issue.severity === 'error')
  const hasWarnings = report.issues.some((issue) => issue.severity === 'warning')

  if (strictMode && (hasErrors || hasWarnings)) {
    process.exit(2)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
