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
import i18n from './src/translations/translate';
import TableLiveScoringLink from './src/TableLiveScoringLink';

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
                <ScoreboardStack.Screen  name={"MyTables"} component={MyTables} options={{ title: i18n.t("myTables") }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="ArchivedMatchList" component={ArchivedMatchList} options={{ title: i18n.t("archivedMatches") }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="AddPlayers" component={AddPlayers} options={{ title: i18n.t("managePlayers") }} />
                <ScoreboardStack.Screen name="MyScoreboards" component={MyScoreboards} options={{ title: i18n.t("myScoreboards") }} />
                <ScoreboardStack.Screen name="MyTeams" component={MyTeams} options={{ title: i18n.t("myTeams") }} />
                <ScoreboardStack.Screen name="MyTeamMatches" component={MyTeamMatches} options={{ title: i18n.t("myTeamMatches") }} />
                <ScoreboardStack.Screen name="ScheduledTableMatches" component={ScheduledTableMatches} options={{ title: i18n.t("scheduledMatches") }} />
                <ScoreboardStack.Screen name="TableScoring" component={TableScoring} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="TeamMatchScoring" component={TableScoring} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="MyAccount" component={MyAccount} options={{ title: i18n.t("myAccount") }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="MyPlayerLists" component={MyPlayerLists} options={{ title: i18n.t("playerLists") }} ></ScoreboardStack.Screen>
                {/* <ScoreboardStack.Screen name="QRCodeScreen" component={QRCodeScreen}  ></ScoreboardStack.Screen> */}
                <ScoreboardStack.Screen name="DynamicURLS" component={MyDynamicURLs} options={{ title: i18n.t("dynamicURLs") }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="BulkAddPlayer" component={BulkAddPlayer} options={{ title: "Bulk Add Player" }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="PlayerRegistration" component={PlayerRegistration} options={{ title: i18n.t("playerRegistrationScreen") }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="TableLiveScoringLink" component={TableLiveScoringLink} options={{ title: i18n.t("tableLiveScoring") }} ></ScoreboardStack.Screen>

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


