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

/*const StackNavigator = createStackNavigator(
    {
      IntroScreen: IntroScreen,
      LoginScreen: LoginScreen,
      EmailInputScreen: EmailInputScreen,
      PasswordInputScreen: PasswordInputScreen,
      HomeScreen: HomeScreen,
    },
    {
      initialRouteName: 'LoginScreen',
    },
  );*/
  
  
  const StackNavigator = createStackNavigator(
    {
      onBoardScreen: {
        screen: onBoardScreen,
      },
      EmailInputScreen: EmailInputScreen,
      LoginScreen: LoginScreen,
      TouchAuthentication: TouchAuthentication,
      PasswordInputScreen: PasswordInputScreen,
      SelectProfileScreen: SelectProfileScreen,
      SetGoalScreen: SetGoalScreen,
      CustomizeInterest: CustomizeInterest,
      SelectGender: SelectGender,
    },
    {
      initialRouteName: 'EmailInputScreen',
    }
  );



export default createAppContainer(StackNavigator);