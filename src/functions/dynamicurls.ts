import db, { getUserPath } from '../lib/database'

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
  return dynamicURLs && typeof dynamicURLs === 'object' ? Object.entries(dynamicURLs) : []
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
  await Promise.all([
    db.ref(`users/${getUserPath()}/myDynamicURLs/${myDynamicURLID}`).remove(),
    db.ref(`dynamicurls/${dynamicURLID}`).remove(),
  ])
}
