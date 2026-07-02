import React, { useEffect, useRef, useState } from 'react';
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
import DynamicURLEditor from './src/DynamicURLEditor';
import BulkAddPlayer from './src/BulkAddPlayers';
import PlayerRegistration from './src/PlayerRegistration';
import i18n from './src/translations/translate';
import { HeaderActions } from './src/components/HeaderActions';
import TeamEditor from './src/TeamEditor';
import TeamMatchEditor from './src/TeamMatchEditor';
import TeamMatchPublicView from './src/TeamMatchPublicView';
import TableEditor from './src/TableEditor';
import ScorekeeperSessions from './src/ScorekeeperSessions';
import SchedulingManager from './src/SchedulingManager';
import MyCompetitions from './src/MyCompetitions';
import CompetitionEditor from './src/CompetitionEditor';
import MyBracketGroupStyles from './src/MyBracketGroupStyles';
import DynamicBracketGroupDisplayEditor from './src/DynamicBracketGroupDisplayEditor';
import BracketGroupStyleEditor from './src/BracketGroupStyleEditor';
import TeamCompetitionPortal from './src/TeamCompetitionPortal';
import Tutorials from './src/Tutorials';
import { AppDrawer, HeaderBackAndMenu } from './src/components/AppDrawer';

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
    TeamCompetitionPortal: {
      path: subFolderPath + "/competitions/:competitionID/team/:teamID/:password",
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
        MyCompetitions: subFolderPath + "/competitions",
        CompetitionEditor: subFolderPath + "/competitions/:competitionID/edit",
        DynamicURLS: subFolderPath + "/scoreboards/dynamic-urls",
        DynamicURLEditor: subFolderPath + "/scoreboards/dynamic-urls/:myDynamicURLID/edit",
        MyBracketGroupStyles: subFolderPath + "/scoreboards/brackets-groups",
        DynamicBracketGroupDisplayEditor: subFolderPath + "/scoreboards/brackets-groups/displays/:myDisplayID/edit",
        BracketGroupStyleEditor: subFolderPath + "/scoreboards/brackets-groups/:styleID/edit",
        ScorekeeperSessions: subFolderPath + "/scorekeeper-sessions",
        Tutorials: subFolderPath + "/tutorials",
        ScheduledTableMatches: subFolderPath + "/scheduledtablematches",
        //QRCodeScreen:subFolderPath+"/qrcode",
        BulkAddPlayer: subFolderPath + "/bulkplayer"
      }
    },


  }
}
console.log(linkingConfig)
const ScoreboardStack = createNativeStackNavigator()

const HIDE_APP_DRAWER_ROUTES = new Set([
  "TableScoring",
  "TeamMatchScoring",
  "PlayerRegistration",
  "TeamManager",
  "TeamMatchPublicView",
  "TeamCompetitionPortal",
  "Login",
  "VerifyEmail",
]);

function isEmbeddedRoute(route) {
  return route?.params?.embed === true || route?.params?.embed === "true"
}

function shouldShowAppDrawer(route) {
  return !HIDE_APP_DRAWER_ROUTES.has(route?.name || "")
}

function ScoreboardNavigation() {

  let [doneLoading, setDoneLoading] = useState(false)
  let [isSignedIn, setIsSignedIn] = useState(false)
  let [needsEmailVerification, setNeedsEmailVerification] = useState(false)
  let [hasLoadedLogin, setHasLoadedLogin] = useState(false)
  let [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const navigationRef = useRef<any>(null)


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


      <NavigationContainer ref={navigationRef} linking={{ config: linkingConfig, }}>


        <ScoreboardStack.Navigator screenOptions={({ navigation, route }) => ({
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
          headerLeft: isSignedIn && shouldShowAppDrawer(route) ? ({ canGoBack }) => (
            <HeaderBackAndMenu
              canGoBack={canGoBack}
              onBack={() => navigation.goBack()}
              onOpenMenu={() => setIsDrawerOpen(true)}
            />
          ) : undefined,
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
                <ScoreboardStack.Screen name="MyCompetitions" component={MyCompetitions} options={{ title: "Competitions" }} />
                <ScoreboardStack.Screen name="CompetitionEditor" component={CompetitionEditor} options={{ title: "Edit Competition" }} />
                <ScoreboardStack.Screen name="MyBracketGroupStyles" component={MyBracketGroupStyles} options={{ title: "Dynamic Brackets & Groups" }} />
                <ScoreboardStack.Screen name="DynamicBracketGroupDisplayEditor" component={DynamicBracketGroupDisplayEditor} options={{ title: "Manage Dynamic Display" }} />
                <ScoreboardStack.Screen name="BracketGroupStyleEditor" component={BracketGroupStyleEditor} options={{ title: "Edit Bracket/Group Style" }} />
                <ScoreboardStack.Screen name="ScorekeeperSessions" component={ScorekeeperSessions} options={{ title: "Scorekeeper Sessions" }} />
                <ScoreboardStack.Screen name="Tutorials" component={Tutorials} options={{ title: "Tutorials" }} />
                <ScoreboardStack.Screen
                  name="TeamMatchPublicView"
                  component={TeamMatchPublicView}
                  options={({ route }) => ({ title: i18n.t("teamMatch"), headerShown: !isEmbeddedRoute(route) })}
                />
                <ScoreboardStack.Screen name="TeamCompetitionPortal" component={TeamCompetitionPortal} options={{ title: "Team Competition Portal" }} />
                <ScoreboardStack.Screen name="ScheduledTableMatches" component={ScheduledTableMatches} options={{ title: i18n.t("scheduledMatches") }} />
                <ScoreboardStack.Screen name="TableScoring" component={TableScoring} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="TeamMatchScoring" component={TableScoring} ></ScoreboardStack.Screen>
                {isFirebaseAuthRequired ? <ScoreboardStack.Screen name="MyAccount" component={MyAccount} options={{ title: i18n.t("myAccount") }} ></ScoreboardStack.Screen> : null}
                <ScoreboardStack.Screen name="MyPlayerLists" component={MyPlayerLists} options={{ title: i18n.t("playerLists") }} ></ScoreboardStack.Screen>
                {/* <ScoreboardStack.Screen name="QRCodeScreen" component={QRCodeScreen}  ></ScoreboardStack.Screen> */}
                <ScoreboardStack.Screen name="DynamicURLS" component={MyDynamicURLs} options={{ title: i18n.t("dynamicURLs") }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="DynamicURLEditor" component={DynamicURLEditor} options={{ title: "Manage Dynamic URL" }} />
                <ScoreboardStack.Screen name="BulkAddPlayer" component={BulkAddPlayer} options={{ title: "Bulk Add Player" }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="PlayerRegistration" component={PlayerRegistration} options={{ headerShown: false }} ></ScoreboardStack.Screen>
                <ScoreboardStack.Screen name="TeamManager" component={TeamEditor} options={{ headerShown: false }} ></ScoreboardStack.Screen>
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
                <ScoreboardStack.Screen name="TeamCompetitionPortal" component={TeamCompetitionPortal} options={{ title: "Team Competition Portal" }} />
              </>


          }
        </ScoreboardStack.Navigator>
        <AppDrawer
          isOpen={isSignedIn && isDrawerOpen}
          navigationRef={navigationRef}
          onClose={() => setIsDrawerOpen(false)}
        />

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
