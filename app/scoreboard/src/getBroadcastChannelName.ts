export function getBroadcastChannelName(){
    const params = new URLSearchParams(window.location.search);
    const tableID= params.get("tid")
const teamMatchID = params.get("tmid")
const teamMatchTableNumber = params.get("table")
const dynamicURLID =params.get("dynid")
const  scoreboardID = params.get("sid");
return (tableID?tableID:"")+(teamMatchID?teamMatchID:"")+(teamMatchTableNumber?teamMatchTableNumber:"")+(dynamicURLID?dynamicURLID:"")+(scoreboardID?scoreboardID:"")
}