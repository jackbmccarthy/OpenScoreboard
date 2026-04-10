import { v4 as uuidv4 } from 'uuid';
import { buildAccessSecretMetadata } from '../functions/accessSecrets';

class Table {
  /**
* @param tableName The name of the Table
* 
*/
  constructor(tableName: string, creatorID: string, playerListID: string, sportName: string, scoringType = "", autoAdvanceMode = "manual", autoAdvanceDelaySeconds = 0) {
    const password = uuidv4()
    this.tableName = tableName
    this.creatorID = creatorID;
    this.id = uuidv4();
    this.password = ""
    Object.assign(this, buildAccessSecretMetadata(password))
    this.currentMatch = ""
    this.previousMatches = {}
    this.playerList = {}
    this.scheduledMatches = {}
    this.autoAdvanceMode = autoAdvanceMode
    this.autoAdvanceDelaySeconds = autoAdvanceDelaySeconds
    this.playerListID = playerListID
    this.sportName = sportName,
      this.scoringType = scoringType
  }
  tableName: string
  creatorID: string
  id: string
  password: string
  passwordHash: string
  passwordUpdatedAt: string
  accessVersion: number
  currentMatch: string
  previousMatches: Record<string, any>
  playerList: Record<string, any>
  scheduledMatches: Record<string, any>
  autoAdvanceMode: string
  autoAdvanceDelaySeconds: number
  playerListID: string
  sportName: string
  scoringType: string
}

export default Table
