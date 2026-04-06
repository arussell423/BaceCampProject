import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// Required for react-native-gesture-handler on web
import 'react-native-gesture-handler';

// Auth screens
import onBoardScreen from '../screens/onBoardScreen';
import EmailInputScreen from '../screens/EmailInputScreen';
import LoginScreen from '../screens/LoginScreen';
import PasswordInputScreen from '../screens/PasswordInputScreen';
import TouchAuthentication from '../screens/TouchAuthentification';
import SelectProfileScreen from '../screens/SelectProfileScreen';
import SetGoalScreen from '../screens/SetGoalScreen';
import CustomizeInterest from '../screens/CustomizeInterest';
import SelectGender from '../screens/SelectGender';

// Player screens
import HomeScreen from '../screens/HomeScreen';
import EvaluationScreen from '../screens/EvaluationScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TrainingScreen from '../screens/TrainingScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import MatchReportScreen from '../screens/MatchReportScreen';
import SpeedTrackingScreen from '../screens/SpeedTrackingScreen';
import AICoachScreen from '../screens/AICoachScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Coach screens
import CoachHomeScreen from '../screens/coach/CoachHomeScreen';
import CoachRosterScreen from '../screens/coach/CoachRosterScreen';
import CoachPlayerDetailScreen from '../screens/coach/CoachPlayerDetailScreen';
import CoachSendFeedbackScreen from '../screens/coach/CoachSendFeedbackScreen';
import CoachAddTrainingScreen from '../screens/coach/CoachAddTrainingScreen';
import CoachCalendarScreen from '../screens/coach/CoachCalendarScreen';
import CoachDashboardScreen from '../screens/coach/CoachDashboardScreen';

const AuthStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const PlayerStack = createStackNavigator();
const CoachStack = createStackNavigator();

const screenOptions = { headerShown: false };

export function AuthNavigator() {
  return (
    <NavigationContainer>
      <AuthStack.Navigator initialRouteName="onBoardScreen" screenOptions={screenOptions}>
        <AuthStack.Screen name="onBoardScreen" component={onBoardScreen} />
        <AuthStack.Screen name="EmailInputScreen" component={EmailInputScreen} />
        <AuthStack.Screen name="LoginScreen" component={LoginScreen} />
        <AuthStack.Screen name="PasswordInputScreen" component={PasswordInputScreen} />
        <AuthStack.Screen name="SetGoalScreen" component={SetGoalScreen} />
        <AuthStack.Screen name="CustomizeInterest" component={CustomizeInterest} />
        <AuthStack.Screen name="SelectGender" component={SelectGender} />
        <AuthStack.Screen name="TouchAuthentication" component={TouchAuthentication} />
        <AuthStack.Screen name="SelectProfileScreen" component={SelectProfileScreen} />
      </AuthStack.Navigator>
    </NavigationContainer>
  );
}

export function ProfileSelectNavigator() {
  return (
    <NavigationContainer>
      <ProfileStack.Navigator screenOptions={screenOptions}>
        <ProfileStack.Screen name="SelectProfileScreen" component={SelectProfileScreen} />
      </ProfileStack.Navigator>
    </NavigationContainer>
  );
}

export function PlayerNavigator() {
  return (
    <NavigationContainer>
      <PlayerStack.Navigator initialRouteName="HomeScreen" screenOptions={screenOptions}>
        <PlayerStack.Screen name="HomeScreen" component={HomeScreen} />
        <PlayerStack.Screen name="EvaluationScreen" component={EvaluationScreen} />
        <PlayerStack.Screen name="DashboardScreen" component={DashboardScreen} />
        <PlayerStack.Screen name="TrainingScreen" component={TrainingScreen} />
        <PlayerStack.Screen name="ScheduleScreen" component={ScheduleScreen} />
        <PlayerStack.Screen name="MatchReportScreen" component={MatchReportScreen} />
        <PlayerStack.Screen name="SpeedTrackingScreen" component={SpeedTrackingScreen} />
        <PlayerStack.Screen name="AICoachScreen" component={AICoachScreen} />
        <PlayerStack.Screen name="ProfileScreen" component={ProfileScreen} />
      </PlayerStack.Navigator>
    </NavigationContainer>
  );
}

export function CoachNavigator() {
  return (
    <NavigationContainer>
      <CoachStack.Navigator initialRouteName="CoachHomeScreen" screenOptions={screenOptions}>
        <CoachStack.Screen name="CoachHomeScreen" component={CoachHomeScreen} />
        <CoachStack.Screen name="CoachRosterScreen" component={CoachRosterScreen} />
        <CoachStack.Screen name="CoachPlayerDetailScreen" component={CoachPlayerDetailScreen} />
        <CoachStack.Screen name="CoachSendFeedbackScreen" component={CoachSendFeedbackScreen} />
        <CoachStack.Screen name="CoachAddTrainingScreen" component={CoachAddTrainingScreen} />
        <CoachStack.Screen name="CoachCalendarScreen" component={CoachCalendarScreen} />
        <CoachStack.Screen name="CoachDashboardScreen" component={CoachDashboardScreen} />
        <CoachStack.Screen name="ProfileScreen" component={ProfileScreen} />
      </CoachStack.Navigator>
    </NavigationContainer>
  );
}
