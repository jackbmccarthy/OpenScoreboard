import db, { getUserPath } from '@/lib/database'
import { subscribeToPathValue } from '@/lib/realtime'
import { newScoreboard } from '@/classes/Scoreboard'
import { defaultScoreboard } from '@/scoreboard/templates/defaultscoreboard'
import type { OwnershipMutationOptions } from './deletion'
import { clearScoreboardTemplateIdFromScoreboards, isRecordActive, softDeleteCanonical } from './deletion'

function normalizeTemplatePayload(template) {
  return {
    name: template.name || 'Untitled Template',
    description: template.description || '',
    category: template.category || 'General',
    createdBy: template.createdBy || getUserPath(),
    isActive: template.isActive !== false,
    web: {
      html: template.web?.html || '',
      css: template.web?.css || '',
      javascript: template.web?.javascript || '',
    },
    config: template.config || {},
    type: template.type || 'liveStream',
  }
}

export function getBuiltInScoreboardTemplates() {
  return [
    {
      id: 'builtin-default-stream',
      name: 'Default Stream Scoreboard',
      description: 'Classic overlay layout with names, scores, and match point indicators.',
      category: 'Built-in',
      type: 'liveStream',
      isBuiltIn: true,
      web: {
        html: defaultScoreboard.html,
        css: defaultScoreboard.css,
        javascript: '',
      },
      config: {},
      isActive: true,
    },
  ]
}

export async function getScoreboardTemplates() {
  const builtIns = getBuiltInScoreboardTemplates()
  const snapshot = await db.ref('scoreboardTemplates').get()
  const templates = snapshot.val()
  const custom: Array<Record<string, any>> = templates && typeof templates === 'object'
    ? Object.entries(templates).map(([id, template]) => ({ id, ...(template as Record<string, any>) }))
    : []

  return [...builtIns, ...custom].filter((template: Record<string, any>) => template.isActive !== false)
}

export function subscribeToScoreboardTemplates(callback: (templates: Array<Record<string, any>>) => void) {
  const builtIns = getBuiltInScoreboardTemplates()
  return subscribeToPathValue('scoreboardTemplates', (templatesValue) => {
    const custom = templatesValue && typeof templatesValue === 'object'
      ? Object.entries(templatesValue as Record<string, Record<string, any>>).map(([id, template]) => ({ id, ...template }))
      : []

    callback([...builtIns, ...custom].filter((template: Record<string, any>) => template.isActive !== false))
  })
}

export async function getAdminManagedScoreboardTemplates() {
  const snapshot = await db.ref('scoreboardTemplates').get()
  const templates = snapshot.val()
  return templates && typeof templates === 'object'
    ? Object.entries(templates)
      .map(([id, template]) => ({ id, ...(template as Record<string, any>) }))
      .filter((template) => isRecordActive(template))
    : []
}

export async function addScoreboardTemplate(template) {
  const payload = normalizeTemplatePayload(template)
  const newTemplate = await db.ref('scoreboardTemplates').push(payload)
  return newTemplate.key
}

export async function updateScoreboardTemplate(templateID, template) {
  await db.ref(`scoreboardTemplates/${templateID}`).set(normalizeTemplatePayload(template))
}

export async function duplicateScoreboardTemplate(templateID, ownerID = getUserPath()) {
  const snapshot = await db.ref(`scoreboardTemplates/${templateID}`).get()
  const template = snapshot.val()
  if (!template || typeof template !== 'object') {
    throw new Error('Template not found')
  }
  return addScoreboardTemplate({
    ...(template as Record<string, any>),
    name: `${(template as Record<string, any>).name || 'Template'} Copy`,
    createdBy: ownerID,
  })
}

export async function toggleScoreboardTemplateActive(templateID, isActive) {
  const snapshot = await db.ref(`scoreboardTemplates/${templateID}`).get()
  const template = snapshot.val()
  if (!template || typeof template !== 'object') {
    throw new Error('Template not found')
  }
  await updateScoreboardTemplate(templateID, {
    ...(template as Record<string, any>),
    isActive,
  })
}

export async function deleteScoreboardTemplate(templateID, options: OwnershipMutationOptions = {}) {
  const clearedScoreboards = await clearScoreboardTemplateIdFromScoreboards(templateID, options)
  await softDeleteCanonical(`scoreboardTemplates/${templateID}`, {
    deleteReason: 'delete_scoreboard_template',
    clearedScoreboards,
  }, {
    entityType: 'scoreboardTemplate',
    canonicalID: templateID,
    ownerID: getUserPath(),
  }, options)

  return {
    entityType: 'scoreboardTemplate',
    canonicalID: templateID,
    canonicalPath: `scoreboardTemplates/${templateID}`,
    dryRun: Boolean(options.dryRun),
    deleteMode: 'soft_deleted',
    ownerID: getUserPath(),
    dependentIDs: {
      clearedScoreboards,
    },
  }
}

export async function createScoreboardFromTemplate(name, template, ownerID = getUserPath()) {
  const scoreboardPayload = {
    ...newScoreboard(ownerID, name, template.type || 'liveStream'),
    config: template.config || {},
    web: {
      html: template.web?.html || '',
      css: template.web?.css || '',
      javascript: template.web?.javascript || '',
    },
  }

  const newlyAdded = await db.ref('scoreboards').push(scoreboardPayload)
  await db.ref(`users/${ownerID}/myScoreboards`).push({
    id: newlyAdded.key,
    createdOn: new Date(),
    name,
    type: template.type || 'liveStream',
  })
  return newlyAdded.key
}
