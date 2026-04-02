import { v4 as uuidv4 } from 'uuid';

class Table {
  /**
* @param tableName The name of the Table
* 
*/
  constructor(tableName: string, creatorID: string, playerListID: string, sportName: string, scoringType = "") {
    this.tableName = tableName
    this.creatorID = creatorID;
    this.id = uuidv4();
    this.password = uuidv4()
    this.currentMatch = ""
    this.previousMatches = {}
    this.playerList = {}
    this.scheduledMatches = {}
    this.playerListID = playerListID
    this.sportName = sportName,
      this.scoringType = scoringType
  }
  tableName: string
  creatorID: string
  id: string
  password: string
  currentMatch: string
  previousMatches: Record<string, any>
  playerList: Record<string, any>
  scheduledMatches: Record<string, any>
  playerListID: string
  sportName: string
  scoringType: string
}

export default Table
