import React, { Component, useEffect, useState } from 'react';
import ArchivedMatchList from './src/ArchivedMatchList';
import { createNativeStackNavigator, } from '@react-navigation/native-stack';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import AddPlayers from './src/AddPlayers';
import MyTables from './src/MyTables';
import TableScoring from './src/TableScoring';
import MyScoreboards from './src/MyScoreboards';
import MyTeams from './src/MyTeams';
import MyTeamMatches from './src/MyTeamMatches';
import { isLocalDatabase, subFolderPath } from './openscoreboard.config';
import Home from './src/Home';
import Login from './src/Login';
import ScheduledTableMatches from './src/ScheduledTableMatches';
import { LinearGradient } from 'expo-linear-gradient';
import { authStateListener } from './database';
import MyAccount from './src/MyAccount';
import LoadingPage from './src/LoadingPage';
import MyPlayerLists from './src/MyPlayerLists';
//import QRCodeScreen from './src/QRCode';
import MyDynamicURLs from './src/MyDynamicURLs';
import BulkAddPlayer from './src/BulkAddPlayers';
import PlayerRegistration from './src/PlayerRegistration';

export const linkingConfig = {
  screens: {
    TableScoring: { path: subFolderPath + "/scoring/table/:tableID/:name/:password" },
    TeamMatchScoring: {
      path: subFolderPath + "/teamscoring/teammatch/:isTeamMatch/:teamMatchID/:tableNumber",
      parse: {
        isTeamMatch: (isTeamMatch) => { return true },
      },
    },
    PlayerRegistration: {
      path: subFolderPath + "/playerregistration/:playerListID/:password",
    },
    Login: subFolderPath + "/login",
    Home: {
      path: subFolderPath + "/",
      screens: {
        MyTables: subFolderPath + "/tables",
        ArchivedMatchList: subFolderPath + "/archivedmatches",
        AddPlayers: subFolderPath + "/addplayers",
        MyScoreboards: subFolderPath + "/scoreboards",
        MyTeams: subFolderPath + "/teams",
        MyTeamMatches: subFolderPath + "/teammatches",
        ScheduledTableMatches: subFolderPath + "/scheduledtablematches",
        //QRCodeScreen:subFolderPath+"/qrcode",
        BulkAddPlayer: subFolderPath + "/bulkplayer"
      }
    },


  }
}
console.log(linkingConfig)
const ScoreboardStack = createNativeStackNavigator()

function ScoreboardNavigation() {

  let [doneLoading, setDoneLoading] = useState(false)
  let [isSignedIn, setIsSignedIn] = useState(isLocalDatabase)
  let [hasLoadedLogin, setHasLoadedLogin] = useState(false)



  useEffect(() => {
if (!isLocalDatabase) {
    authStateListener((user) => {
      
        if (user) {

          setIsSignedIn(true)
          setDoneLoading(true)

        }
        else {
          setIsSignedIn(false)
          setDoneLoading(true)
        }
      
      

    })
}
else {
        setDoneLoading(true)
      }
  }, [])

  if (doneLoading) {
    return (


      <NavigationContainer linking={{ config: linkingConfig, }}>

        
        <ScoreboardStack.Navigator screenOptions={{
          contentStyle: {
            backgroundColor: "white"
          },
          headerTitleStyle: {
            color: "white",
          },
          headerBackground: () => {
            return (<LinearGradient
              colors={['#000000', '#0028ff']}
              style={{ flex: 1 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}

            />)
          },

          headerTintColor: "white"
        }} >


          {


            isSignedIn ? <>
              <ScoreboardStack.Group navigationKey={isSignedIn === true ? "user" : "guest"}>
                <ScoreboardStack.Screen name="Home" component={Home} options={{ title: "Open Scoreboard" }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen  name={"MyTables"} component={MyTables} options={{ title: "My Tables" }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="ArchivedMatchList" component={ArchivedMatchList} options={{ title: "Archived Matches" }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="AddPlayers" component={AddPlayers} options={{ title: "Manage Players" }} />
                <ScoreboardStack.Screen name="MyScoreboards" component={MyScoreboards} options={{ title: "My Scoreboards" }} />
                <ScoreboardStack.Screen name="MyTeams" component={MyTeams} options={{ title: "My Teams" }} />
                <ScoreboardStack.Screen name="MyTeamMatches" component={MyTeamMatches} options={{ title: "My Team Matches" }} />
                <ScoreboardStack.Screen name="ScheduledTableMatches" component={ScheduledTableMatches} options={{ title: "Scheduled Matches" }} />
                <ScoreboardStack.Screen name="TableScoring" component={TableScoring} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="TeamMatchScoring" component={TableScoring} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="MyAccount" component={MyAccount} options={{ title: "My Account" }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="MyPlayerLists" component={MyPlayerLists} options={{ title: "Player Lists" }} ></ScoreboardStack.Screen>
                {/* <ScoreboardStack.Screen name="QRCodeScreen" component={QRCodeScreen}  ></ScoreboardStack.Screen> */}
                <ScoreboardStack.Screen name="DynamicURLS" component={MyDynamicURLs} options={{ title: "Dynamic URLs" }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="BulkAddPlayer" component={BulkAddPlayer} options={{ title: "Bulk Add Player" }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="PlayerRegistration" component={PlayerRegistration} options={{ title: "Player Registration Screen" }} ></ScoreboardStack.Screen>

              </ScoreboardStack.Group>

            </>

              : <>
                <ScoreboardStack.Screen name="Login" component={Login} />
                <ScoreboardStack.Screen name="TableScoring" component={TableScoring} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="TeamMatchScoring" component={TableScoring} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="PlayerRegistration" component={PlayerRegistration} options={{ headerShown: false }} ></ScoreboardStack.Screen>
              </>


          }
        </ScoreboardStack.Navigator>

      </NavigationContainer>

    )
  }
  else {
    return <LoadingPage></LoadingPage>
  }

}
export default function App() {


  return (
    <ScoreboardNavigation />
  );

}


