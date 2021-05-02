import {createAppContainer} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import IntroScreen from '../screens/IntroScreen';
import LoginScreen from '../screens/LoginScreen';
import EmailInputscreen from '../screens/EmailInpurScreen';
import PasswordInputscreen from '../screens/PasswordInputScreen';
const StackNavigator = createStackNavigator({
  IntroScreen: IntroScreen,
  LoginScreen: LoginScreen,
  EmailInputscreen: EmailInputscreen,
  PasswordInputscreen: PasswordInputscreen,
});
export default createAppContainer(StackNavigator);