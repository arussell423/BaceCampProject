import {createAppContainer} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import IntroScreen from '../screens/IntroScreen';
import LoginScreen from '../screens/LoginScreen';
import EmailInputScreen from '../screens/EmailInputScreen';
import PasswordInputScreen from '../screens/PasswordInputScreen';
import onBoardScreen from '../screens/onBoardScreen';
import TouchAuthentication from '../screens/TouchAuthentification';
import SelectProfileScreen from '../screens/SelectProfileScreen';
import SetGoalScreen from '../screens/SetGoalScreen';
import CustomizeInterest from '../screens/CustomizeInterest';
import SelectGender from '../screens/SelectGender';
import HomeScreen from '../screens/HomeScreen';
import EvaluationScreen from '../screens/EvaluationScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TrainingScreen from '../screens/TrainingScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import MatchReportScreen from '../screens/MatchReportScreen';

const StackNavigator = createStackNavigator(
  {
    // Onboarding & Auth
    onBoardScreen: { screen: onBoardScreen },
    EmailInputScreen: EmailInputScreen,
    LoginScreen: LoginScreen,
    PasswordInputScreen: PasswordInputScreen,
    TouchAuthentication: TouchAuthentication,

    // Profile setup
    SetGoalScreen: SetGoalScreen,
    CustomizeInterest: CustomizeInterest,
    SelectGender: SelectGender,
    SelectProfileScreen: SelectProfileScreen,

    // Main app
    HomeScreen: HomeScreen,
    EvaluationScreen: EvaluationScreen,
    DashboardScreen: DashboardScreen,
    TrainingScreen: TrainingScreen,
    ScheduleScreen: ScheduleScreen,
    MatchReportScreen: MatchReportScreen,
  },
  {
    initialRouteName: 'onBoardScreen',
    defaultNavigationOptions: {
      headerShown: false,
    },
  }
);

export default createAppContainer(StackNavigator);