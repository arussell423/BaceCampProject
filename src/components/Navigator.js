import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler';

// Auth screens
import onBoardScreen      from '../screens/onBoardScreen';
import EmailInputScreen   from '../screens/EmailInputScreen';
import LoginScreen        from '../screens/LoginScreen';
import PasswordInputScreen from '../screens/PasswordInputScreen';
import TouchAuthentication from '../screens/TouchAuthentification';
import SelectProfileScreen from '../screens/SelectProfileScreen';
import SetGoalScreen      from '../screens/SetGoalScreen';
import CustomizeInterest  from '../screens/CustomizeInterest';
import SelectGender       from '../screens/SelectGender';

// Player screens
import HomeScreen         from '../screens/HomeScreen';
import EvaluationScreen   from '../screens/EvaluationScreen';
import DashboardScreen    from '../screens/DashboardScreen';
import TrainingScreen     from '../screens/TrainingScreen';
import ScheduleScreen     from '../screens/ScheduleScreen';
import MatchReportScreen  from '../screens/MatchReportScreen';
import SpeedTrackingScreen from '../screens/SpeedTrackingScreen';
import AICoachScreen      from '../screens/AICoachScreen';
import ProfileScreen      from '../screens/ProfileScreen';

// Coach screens
import CoachHomeScreen         from '../screens/coach/CoachHomeScreen';
import CoachRosterScreen       from '../screens/coach/CoachRosterScreen';
import CoachPlayerDetailScreen from '../screens/coach/CoachPlayerDetailScreen';
import CoachSendFeedbackScreen from '../screens/coach/CoachSendFeedbackScreen';
import CoachAddTrainingScreen  from '../screens/coach/CoachAddTrainingScreen';
import CoachCalendarScreen     from '../screens/coach/CoachCalendarScreen';
import CoachDashboardScreen    from '../screens/coach/CoachDashboardScreen';

const Stack = createStackNavigator();
const screenOptions = { headerShown: false };

export function RootNavigator({ user, role }) {
  // Changing the key forces NavigationContainer to fully remount when
  // role changes — this ensures the correct initial screen is shown
  const navKey = `${user?.uid || 'guest'}-${role || 'none'}`;
  return (
    <NavigationContainer key={navKey}>
      <Stack.Navigator screenOptions={screenOptions}>
        {!user ? (
          // ── Auth flow ────────────────────────────────────────────────
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
          // ── Role selection ───────────────────────────────────────────
          <>
            <Stack.Screen name="SelectProfileScreen" component={SelectProfileScreen} />
          </>
        ) : role === 'coach' ? (
          // ── Coach flow ───────────────────────────────────────────────
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
          // ── Player flow ──────────────────────────────────────────────
          <>
            <Stack.Screen name="HomeScreen"         component={HomeScreen} />
            <Stack.Screen name="EvaluationScreen"   component={EvaluationScreen} />
            <Stack.Screen name="DashboardScreen"    component={DashboardScreen} />
            <Stack.Screen name="TrainingScreen"     component={TrainingScreen} />
            <Stack.Screen name="ScheduleScreen"     component={ScheduleScreen} />
            <Stack.Screen name="MatchReportScreen"  component={MatchReportScreen} />
            <Stack.Screen name="SpeedTrackingScreen" component={SpeedTrackingScreen} />
            <Stack.Screen name="AICoachScreen"      component={AICoachScreen} />
            <Stack.Screen name="ProfileScreen"      component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Keep legacy exports as aliases so any remaining imports don't break
export const AuthNavigator          = () => <RootNavigator user={null} role={null} />;
export const ProfileSelectNavigator = () => <RootNavigator user={{}} role={null} />;
export const PlayerNavigator        = () => <RootNavigator user={{}} role="player" />;
export const CoachNavigator         = () => <RootNavigator user={{}} role="coach" />;
