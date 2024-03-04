import { v4 as uuidv4 } from 'uuid';

class Table {
  /**
* @param tableName The name of the Table
* 
*/
  constructor(tableName, creatorID, playerListID, sportName, scoringType="") {
    this.tableName = tableName
    this.creatorID = creatorID;
    this.id = uuidv4();
    this.password = uuidv4()
    this.currentMatch = ""
    this.previousMatches = {}
    this.playerList= {}
    this.scheduledMatches ={}
    this.playerListID = playerListID
    this.sportName = sportName,
    this.scoringType = scoringType
  }

}

export default Table