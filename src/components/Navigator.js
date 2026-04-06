import {createAppContainer} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';

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

export const AuthNavigator = createAppContainer(createStackNavigator({
  onBoardScreen, EmailInputScreen, LoginScreen, PasswordInputScreen,
  SetGoalScreen, CustomizeInterest, SelectGender, TouchAuthentication, SelectProfileScreen,
}, { initialRouteName: 'onBoardScreen', defaultNavigationOptions: { headerShown: false } }));

export const ProfileSelectNavigator = createAppContainer(createStackNavigator({
  SelectProfileScreen,
}, { initialRouteName: 'SelectProfileScreen', defaultNavigationOptions: { headerShown: false } }));

export const PlayerNavigator = createAppContainer(createStackNavigator({
  HomeScreen, EvaluationScreen, DashboardScreen, TrainingScreen, ScheduleScreen,
  MatchReportScreen, SpeedTrackingScreen, AICoachScreen, ProfileScreen,
}, { initialRouteName: 'HomeScreen', defaultNavigationOptions: { headerShown: false } }));

export const CoachNavigator = createAppContainer(createStackNavigator({
  CoachHomeScreen, CoachRosterScreen, CoachPlayerDetailScreen, CoachSendFeedbackScreen,
  CoachAddTrainingScreen, CoachCalendarScreen, CoachDashboardScreen, ProfileScreen,
}, { initialRouteName: 'CoachHomeScreen', defaultNavigationOptions: { headerShown: false } }));

// Keep default export for backward compat
export default AuthNavigator;
