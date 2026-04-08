import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import 'react-native-gesture-handler';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

// Deferred screen loader — screens are require()'d only when first rendered,
// so a crash in any one screen won't prevent the app from starting.
function lazy(loader) {
  let Comp = null;
  return function LazyScreen(props) {
    if (!Comp) { const m = loader(); Comp = m.default || m; }
    return <Comp {...props} />;
  };
}

// Auth screens
const onBoardScreen       = lazy(() => require('../screens/onBoardScreen'));
const EmailInputScreen    = lazy(() => require('../screens/EmailInputScreen'));
const LoginScreen         = lazy(() => require('../screens/LoginScreen'));
const PasswordInputScreen = lazy(() => require('../screens/PasswordInputScreen'));
const TouchAuthentication = lazy(() => require('../screens/TouchAuthentification'));
const SelectProfileScreen = lazy(() => require('../screens/SelectProfileScreen'));
const SetGoalScreen       = lazy(() => require('../screens/SetGoalScreen'));
const CustomizeInterest   = lazy(() => require('../screens/CustomizeInterest'));
const SelectGender        = lazy(() => require('../screens/SelectGender'));

// Player screens
const HomeScreen          = lazy(() => require('../screens/HomeScreen'));
const EvaluationScreen    = lazy(() => require('../screens/EvaluationScreen'));
const DashboardScreen     = lazy(() => require('../screens/DashboardScreen'));
const TrainingScreen      = lazy(() => require('../screens/TrainingScreen'));
const ScheduleScreen      = lazy(() => require('../screens/ScheduleScreen'));
const ChatScreen          = lazy(() => require('../screens/ChatScreen'));
const MatchReportScreen   = lazy(() => require('../screens/MatchReportScreen'));
const SpeedTrackingScreen = lazy(() => require('../screens/SpeedTrackingScreen'));
const AICoachScreen       = lazy(() => require('../screens/AICoachScreen'));
const ProfileScreen       = lazy(() => require('../screens/ProfileScreen'));

// Coach screens
const CoachHomeScreen         = lazy(() => require('../screens/coach/CoachHomeScreen'));
const CoachRosterScreen       = lazy(() => require('../screens/coach/CoachRosterScreen'));
const CoachPlayerDetailScreen = lazy(() => require('../screens/coach/CoachPlayerDetailScreen'));
const CoachSendFeedbackScreen = lazy(() => require('../screens/coach/CoachSendFeedbackScreen'));
const CoachAddTrainingScreen  = lazy(() => require('../screens/coach/CoachAddTrainingScreen'));
const CoachCalendarScreen     = lazy(() => require('../screens/coach/CoachCalendarScreen'));
const CoachDashboardScreen    = lazy(() => require('../screens/coach/CoachDashboardScreen'));

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();
const stackOptions = { headerShown: false };

// ── Tab icon helper ──────────────────────────────────────────────────────────

function TabIcon({ name, type, focused }) {
  const color = focused ? '#006400' : '#9E9E9E';
  const size  = focused ? 24 : 22;
  const IconComponent = type === 'material-community' ? MaterialCommunityIcons : MaterialIcons;
  return (
    <View style={{
      width: 40, height: 32, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: focused ? '#E8F5E9' : 'transparent',
    }}>
      <IconComponent name={name} size={size} color={color} />
    </View>
  );
}

// ── Player stack stacks (each tab gets its own stack) ────────────────────────

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="HomeScreen"         component={HomeScreen} />
      <Stack.Screen name="DashboardScreen"    component={DashboardScreen} />
      <Stack.Screen name="MatchReportScreen"  component={MatchReportScreen} />
      <Stack.Screen name="SpeedTrackingScreen" component={SpeedTrackingScreen} />
      <Stack.Screen name="AICoachScreen"      component={AICoachScreen} />
      <Stack.Screen name="ProfileScreen"      component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function EvaluationStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="EvaluationScreen" component={EvaluationScreen} />
    </Stack.Navigator>
  );
}

function ScheduleStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="ScheduleScreen" component={ScheduleScreen} />
    </Stack.Navigator>
  );
}

function ChatStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function TrainingStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="TrainingScreen" component={TrainingScreen} />
    </Stack.Navigator>
  );
}

// ── Player bottom tab navigator ──────────────────────────────────────────────

function PlayerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#006400',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOpacity: 0.10,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
        tabBarItemStyle: { paddingTop: 2 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Evaluation"
        component={EvaluationStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="clipboard-list" type="material-community" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="calendar-month" type="material-community" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="chat-bubble-outline" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Training"
        component={TrainingStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="dumbbell" type="material-community" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ── Root navigator ───────────────────────────────────────────────────────────

export function RootNavigator({ user, role }) {
  const navKey = `${user?.uid || 'guest'}-${role || 'none'}`;
  return (
    <NavigationContainer key={navKey}>
      <Stack.Navigator screenOptions={stackOptions}>
        {!user ? (
          // ── Auth flow ──────────────────────────────────────────────────────
          <>
            <Stack.Screen name="onBoardScreen"       component={onBoardScreen} />
            <Stack.Screen name="EmailInputScreen"    component={EmailInputScreen} />
            <Stack.Screen name="LoginScreen"         component={LoginScreen} />
            <Stack.Screen name="PasswordInputScreen" component={PasswordInputScreen} />
            <Stack.Screen name="SetGoalScreen"       component={SetGoalScreen} />
            <Stack.Screen name="CustomizeInterest"   component={CustomizeInterest} />
            <Stack.Screen name="SelectGender"        component={SelectGender} />
            <Stack.Screen name="TouchAuthentication" component={TouchAuthentication} />
            <Stack.Screen name="SelectProfileScreen" component={SelectProfileScreen} />
          </>
        ) : !role ? (
          // ── Role selection ─────────────────────────────────────────────────
          <>
            <Stack.Screen name="SelectProfileScreen" component={SelectProfileScreen} />
          </>
        ) : role === 'coach' ? (
          // ── Coach flow ─────────────────────────────────────────────────────
          <>
            <Stack.Screen name="CoachHomeScreen"         component={CoachHomeScreen} />
            <Stack.Screen name="CoachRosterScreen"       component={CoachRosterScreen} />
            <Stack.Screen name="CoachPlayerDetailScreen" component={CoachPlayerDetailScreen} />
            <Stack.Screen name="CoachSendFeedbackScreen" component={CoachSendFeedbackScreen} />
            <Stack.Screen name="CoachAddTrainingScreen"  component={CoachAddTrainingScreen} />
            <Stack.Screen name="CoachCalendarScreen"     component={CoachCalendarScreen} />
            <Stack.Screen name="CoachDashboardScreen"    component={CoachDashboardScreen} />
            <Stack.Screen name="ProfileScreen"           component={ProfileScreen} />
          </>
        ) : (
          // ── Player flow — bottom tab navigator ─────────────────────────────
          <>
            <Stack.Screen name="PlayerTabs" component={PlayerTabNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    height: 68,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  tabItem: { paddingTop: 2 },
  tabLabel: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  iconWrap: {
    width: 40, height: 32, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12,
  },
  iconWrapActive: {
    width: 40, height: 32, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, backgroundColor: '#E8F5E9',
  },
});

// Keep legacy exports as aliases
export const AuthNavigator          = () => <RootNavigator user={null} role={null} />;
export const ProfileSelectNavigator = () => <RootNavigator user={{}} role={null} />;
export const PlayerNavigator        = () => <RootNavigator user={{}} role="player" />;
export const CoachNavigator         = () => <RootNavigator user={{}} role="coach" />;
