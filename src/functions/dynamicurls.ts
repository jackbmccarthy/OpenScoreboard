import db, { getUserPath } from '../lib/database'
import { isRecordActive, softDeleteCanonical } from './deletion'

function getDynamicURLPayload(dynamicURL) {
  return {
    dynamicURLName: dynamicURL.dynamicURLName || '',
    scoreboardID: dynamicURL.scoreboardID || '',
    tableID: dynamicURL.tableID || '',
    teammatchID: dynamicURL.teammatchID || dynamicURL.teamMatchID || '',
    teamMatchID: dynamicURL.teamMatchID || dynamicURL.teammatchID || '',
    tableNumber: dynamicURL.tableNumber || '',
  }
}

function getDynamicURLPreview(dynamicURLID, dynamicURL) {
  return {
    id: dynamicURLID,
    dynamicURLName: dynamicURL.dynamicURLName || '',
    scoreboardID: dynamicURL.scoreboardID || '',
    tableID: dynamicURL.tableID || '',
    teammatchID: dynamicURL.teammatchID || dynamicURL.teamMatchID || '',
    teamMatchID: dynamicURL.teamMatchID || dynamicURL.teammatchID || '',
    tableNumber: dynamicURL.tableNumber || '',
  }
}

export async function getMyDynamicURLs() {
  const snapshot = await db.ref(`users/${getUserPath()}/myDynamicURLs`).get()
  const dynamicURLs = snapshot.val()
  if (!dynamicURLs || typeof dynamicURLs !== 'object') {
    return []
  }

  return Promise.all(Object.entries(dynamicURLs).map(async ([myDynamicURLID, preview]) => {
    const previewEntry = preview as Record<string, any>
    const dynamicURLID = previewEntry?.id
    if (typeof dynamicURLID !== 'string' || dynamicURLID.length === 0) {
      return null
    }
    const canonicalSnapshot = await db.ref(`dynamicurls/${dynamicURLID}`).get()
    if (!isRecordActive(canonicalSnapshot.val())) {
      return null
    }
    return [myDynamicURLID, previewEntry]
  })).then((entries) => entries.filter(Boolean))
}

export async function addDynamicURL(dynamicURL) {
  const payload = getDynamicURLPayload(dynamicURL)
  const newDynamicURL = await db.ref('dynamicurls').push(payload)
  await db.ref(`users/${getUserPath()}/myDynamicURLs`).push(getDynamicURLPreview(newDynamicURL.key, payload))
  return newDynamicURL.key
}

export async function updateDynamicURL(myDynamicURLID, dynamicURLID, dynamicURL) {
  const payload = getDynamicURLPayload(dynamicURL)
  await Promise.all([
    db.ref(`dynamicurls/${dynamicURLID}`).set(payload),
    db.ref(`users/${getUserPath()}/myDynamicURLs/${myDynamicURLID}`).set(getDynamicURLPreview(dynamicURLID, payload)),
  ])
}

export async function deleteDynamicURL(myDynamicURLID, dynamicURLID) {
  const previewPath = `users/${getUserPath()}/myDynamicURLs/${myDynamicURLID}`
  await softDeleteCanonical(`dynamicurls/${dynamicURLID}`, {
    deleteReason: 'delete_dynamic_url'
  }, {
    entityType: 'dynamicURL',
    canonicalID: dynamicURLID,
    ownerID: getUserPath(),
    previewPath,
  })
  await Promise.all([
    db.ref(previewPath).remove(),
  ])
}
