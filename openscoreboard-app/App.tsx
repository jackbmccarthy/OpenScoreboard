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
import { isFirebaseAuthRequired, subFolderPath } from './openscoreboard.config';
import Home from './src/Home';
import Login from './src/Login';
import ScheduledTableMatches from './src/ScheduledTableMatches';
import { LinearGradient } from 'expo-linear-gradient';
import { authStateListener, migrateLocalUserDataToFirebaseUser } from './database';
import MyAccount from './src/MyAccount';
import LoadingPage from './src/LoadingPage';
import MyPlayerLists from './src/MyPlayerLists';
import VerifyEmail from './src/VerifyEmail';
//import QRCodeScreen from './src/QRCode';
import MyDynamicURLs from './src/MyDynamicURLs';
import BulkAddPlayer from './src/BulkAddPlayers';
import PlayerRegistration from './src/PlayerRegistration';
import i18n from './src/translations/translate';
import TableLiveScoringLink from './src/TableLiveScoringLink';
import { HeaderActions } from './src/components/HeaderActions';
import TeamEditor from './src/TeamEditor';
import TeamMatchEditor from './src/TeamMatchEditor';
import TeamMatchPublicView from './src/TeamMatchPublicView';
import TableEditor from './src/TableEditor';
import ScorekeeperSessions from './src/ScorekeeperSessions';
import SchedulingManager from './src/SchedulingManager';
import MyCompetitions from './src/MyCompetitions';
import CompetitionEditor from './src/CompetitionEditor';

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
    TeamManager: {
      path: subFolderPath + "/teammanager/:teamID/:password",
    },
    TeamMatchPublicView: {
      path: subFolderPath + "/teammatches/view/:teamMatchID",
      parse: {
        embed: (embed) => embed === true || embed === "true",
      },
    },
    VerifyEmail: subFolderPath + "/verify-email",
    Login: subFolderPath + "/login",
    Home: {
      path: subFolderPath + "/",
      screens: {
        MyTables: subFolderPath + "/tables",
        ArchivedMatchList: subFolderPath + "/archivedmatches",
        AddPlayers: subFolderPath + "/addplayers",
        MyScoreboards: subFolderPath + "/scoreboards",
        MyTeams: subFolderPath + "/teams",
        TeamEditor: subFolderPath + "/teams/:myTeamID/edit/:teamID",
        TableEditor: subFolderPath + "/tables/:myTableID/manage/:tableID",
        MyTeamMatches: subFolderPath + "/teammatches",
        TeamMatchEditor: subFolderPath + "/teammatches/:myTeamMatchID/edit/:teamMatchID",
        SchedulingManager: subFolderPath + "/scheduling/:sourceType/:sourceID",
        MyCompetitions: subFolderPath + "/scoreboards/brackets-groups",
        CompetitionEditor: subFolderPath + "/scoreboards/brackets-groups/:competitionID/edit",
        ScorekeeperSessions: subFolderPath + "/scorekeeper-sessions",
        ScheduledTableMatches: subFolderPath + "/scheduledtablematches",
        //QRCodeScreen:subFolderPath+"/qrcode",
        BulkAddPlayer: subFolderPath + "/bulkplayer"
      }
    },


  }
}
console.log(linkingConfig)
const ScoreboardStack = createNativeStackNavigator()

function isEmbeddedRoute(route) {
  return route?.params?.embed === true || route?.params?.embed === "true"
}

function ScoreboardNavigation() {

  let [doneLoading, setDoneLoading] = useState(false)
  let [isSignedIn, setIsSignedIn] = useState(false)
  let [needsEmailVerification, setNeedsEmailVerification] = useState(false)
  let [hasLoadedLogin, setHasLoadedLogin] = useState(false)


  function isUnverifiedPasswordUser(user) {
    return user?.emailVerified === false &&
      user?.providerData?.some((provider) => provider?.providerId === "password")
  }

  async function handleEmailVerified(user) {
    try {
      await migrateLocalUserDataToFirebaseUser(user)
      setIsSignedIn(true)
      setNeedsEmailVerification(false)
      setDoneLoading(true)
    }
    catch (err) {
      console.error(err)
      setIsSignedIn(false)
      setNeedsEmailVerification(false)
      setDoneLoading(true)
    }
  }


  useEffect(() => {
    if (!isFirebaseAuthRequired) {
      setIsSignedIn(true)
      setDoneLoading(true)
      return
    }

    return authStateListener(async (user) => {

      if (user) {
        if (isUnverifiedPasswordUser(user)) {
          setIsSignedIn(false)
          setNeedsEmailVerification(true)
          setDoneLoading(true)
          return
        }

        try {
          await migrateLocalUserDataToFirebaseUser(user)
          setIsSignedIn(true)
          setNeedsEmailVerification(false)
          setDoneLoading(true)
        }
        catch (err) {
          console.error(err)
          setIsSignedIn(false)
          setNeedsEmailVerification(false)
          setDoneLoading(true)
        }

      }
      else {
        setIsSignedIn(false)
        setNeedsEmailVerification(false)
        setDoneLoading(true)
      }



    })
  }, [])

  if (doneLoading) {
    return (


      <NavigationContainer linking={{ config: linkingConfig, }}>


        <ScoreboardStack.Navigator screenOptions={({ navigation }) => ({
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

          headerRight: () => <HeaderActions navigation={navigation} />,
          headerTintColor: "white"
        })} >


          {


            isSignedIn ? <>
              <ScoreboardStack.Group navigationKey={isSignedIn === true ? "user" : "guest"}>
                <ScoreboardStack.Screen name="Home" component={Home} options={{ title: "Open Scoreboard" }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name={"MyTables"} component={MyTables} options={{ title: i18n.t("myTables") }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="TableEditor" component={TableEditor} options={{ title: "Manage Table/Court" }} />
                <ScoreboardStack.Screen name="ArchivedMatchList" component={ArchivedMatchList} options={{ title: i18n.t("archivedMatches") }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="AddPlayers" component={AddPlayers} options={{ title: i18n.t("managePlayers") }} />
                <ScoreboardStack.Screen name="MyScoreboards" component={MyScoreboards} options={{ title: i18n.t("myScoreboards") }} />
                <ScoreboardStack.Screen name="MyTeams" component={MyTeams} options={{ title: i18n.t("myTeams") }} />
                <ScoreboardStack.Screen name="TeamEditor" component={TeamEditor} options={{ title: "Edit Team" }} />
                <ScoreboardStack.Screen name="MyTeamMatches" component={MyTeamMatches} options={{ title: i18n.t("myTeamMatches") }} />
                <ScoreboardStack.Screen name="TeamMatchEditor" component={TeamMatchEditor} options={{ title: i18n.t("editTeamMatch") }} />
                <ScoreboardStack.Screen name="SchedulingManager" component={SchedulingManager} options={{ title: "Scheduling Manager" }} />
                <ScoreboardStack.Screen name="MyCompetitions" component={MyCompetitions} options={{ title: "Brackets & Groups" }} />
                <ScoreboardStack.Screen name="CompetitionEditor" component={CompetitionEditor} options={{ title: "Edit Competition Graphic" }} />
                <ScoreboardStack.Screen name="ScorekeeperSessions" component={ScorekeeperSessions} options={{ title: "Scorekeeper Sessions" }} />
                <ScoreboardStack.Screen
                  name="TeamMatchPublicView"
                  component={TeamMatchPublicView}
                  options={({ route }) => ({ title: i18n.t("teamMatch"), headerShown: !isEmbeddedRoute(route) })}
                />
                <ScoreboardStack.Screen name="ScheduledTableMatches" component={ScheduledTableMatches} options={{ title: i18n.t("scheduledMatches") }} />
                <ScoreboardStack.Screen name="TableScoring" component={TableScoring} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="TeamMatchScoring" component={TableScoring} ></ScoreboardStack.Screen>
                {isFirebaseAuthRequired ? <ScoreboardStack.Screen name="MyAccount" component={MyAccount} options={{ title: i18n.t("myAccount") }} ></ScoreboardStack.Screen> : null}
                <ScoreboardStack.Screen name="MyPlayerLists" component={MyPlayerLists} options={{ title: i18n.t("playerLists") }} ></ScoreboardStack.Screen>
                {/* <ScoreboardStack.Screen name="QRCodeScreen" component={QRCodeScreen}  ></ScoreboardStack.Screen> */}
                <ScoreboardStack.Screen name="DynamicURLS" component={MyDynamicURLs} options={{ title: i18n.t("dynamicURLs") }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="BulkAddPlayer" component={BulkAddPlayer} options={{ title: "Bulk Add Player" }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="PlayerRegistration" component={PlayerRegistration} options={{ headerShown: false }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="TeamManager" component={TeamEditor} options={{ headerShown: false }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="TableLiveScoringLink" component={TableLiveScoringLink} options={{ title: i18n.t("tableLiveScoring") }} ></ScoreboardStack.Screen>

              </ScoreboardStack.Group>

            </>
              : needsEmailVerification ? <>
                <ScoreboardStack.Group navigationKey={"verify-email"}>
                  <ScoreboardStack.Screen
                    name="VerifyEmail"
                    options={{
                      headerRight: () => null,
                      title: "Verify Email",
                    }}
                  >
                    {(screenProps) => <VerifyEmail {...screenProps} onVerified={handleEmailVerified} />}
                  </ScoreboardStack.Screen>
                </ScoreboardStack.Group>
              </>

              : <>
                <ScoreboardStack.Screen name="Login" component={Login} />
                <ScoreboardStack.Screen name="TableScoring" component={TableScoring} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="TeamMatchScoring" component={TableScoring} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="PlayerRegistration" component={PlayerRegistration} options={{ headerShown: false }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="TeamManager" component={TeamEditor} options={{ headerShown: false }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen
                  name="TeamMatchPublicView"
                  component={TeamMatchPublicView}
                  options={({ route }) => ({ title: i18n.t("teamMatch"), headerShown: !isEmbeddedRoute(route) })}
                />
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
