import React, {Component} from 'react';
import {
View,
StyleSheet,
ActivityIndicator,
TouchableOpacity,
KeyboardAvoidingView,
ScrollView,
} from 'react-native';
import { Text, Icon, Input, Button, SocialIcon, Image } from 'react-native-elements';
import firebase from 'firebase'
import {Formik} from 'formik';
import * as Yup from 'yup';


export class LoginScreen extends Component {


    Login = (values, navigation) => {
        firebase
          .auth()
          .signInWithEmailAndPassword(values.email, values.password)
          .then(response => {
            let {user} = response;
            this.setState({user});
            alert('Registration success');
            setTimeout(() => {
              navigation.navigate('HomeScreen');
            }, 2000);
          })
          .catch(err => {
            alert(err);
          });
      };
    
    static navigationOptions = {
        headerShown: false,
    };
    
    render() {
        return (
            
            <ScrollView contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled">
            <View style={styles.container}>             
<KeyboardAvoidingView
    behavior={'padding'}
                enabled
                 keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 84}>
<Formik
         initialValues={{email: '', password: ''}}
         onSubmit={(values, {setSubmitting}) => {
           this.Login(values, this.props.navigation);
           setSubmitting(false);
         }}
         validationSchema={LoginSchema}>
         {formikProps => (
        <React.Fragment>
        <View style={styles.headerContainer}>
        <Image
            style={styles.logo}
            source={require('../assets/image/bACE_CAMP-logo.png')}
        />
                    </View>
             <View style={styles.wrapper}>
               <Input
                 leftIcon={
                   <Icon
                     name="md-mail"
                     type="ionicon"
                     color="#87cefa"
                     size={25}
                   />
                 }
                 onChangeText={formikProps.handleChange('email')}
                 placeholder="Email"
                 inputContainerStyle={styles.input}
                 placeholderTextColor="grey"
                autoCapitalize="none"
                secureTextEntry={true}
                 autoCorrect={false}
                 keyboardType="email-address"
                 returnKeyType="next"
               />
               {formikProps.errors.email ? (
                 <Text style={{color: 'red'}}>
                   {formikProps.errors.email}
                 </Text>
               ) : null}
               <Input
                 leftIcon={
                   <Icon
                     name="lock"
                     color="#87cefa"
                     size={25}
                   />
                 }
                 onChangeText={formikProps.handleChange('password')}
                 inputContainerStyle={styles.input}
                 placeholderTextColor="grey"
                 placeholder="Password"
                 autoCapitalize="none"
                 secureTextEntry={true}
                 autoCorrect={false}
                 keyboardType="default"
                 returnKeyType="next"
               />
               {formikProps.errors.password ? (
                 <Text style={{color: 'red'}}>
                   {formikProps.errors.password}
                 </Text>
               ) : null}
             </View>
             <View style={styles.socialWrapper}>
               <Text style={styles.signinwith}>Sign in with</Text>
               <View style={styles.socialLogin}>
                 <SocialIcon type="facebook" light />
                 <SocialIcon type="google" light />
                 <SocialIcon type="twitter" light />
               </View>
               <Button
                 title="Login"
                 loading={false}
                 loadingProps={{size: 'small', color: 'white'}}
                 buttonStyle={{
                   backgroundColor: '#008000',
                   borderRadius: 15,
                 }}
                 titleStyle={{fontWeight: 'bold', fontSize: 23}}
                 containerStyle={{
                   marginVertical: 10,
                   height: 50,
                   width: 300,
                 }}
                 onPress={formikProps.handleSubmit}
                 disabled={!(formikProps.isValid && formikProps.dirty)}
                 underlayColor="transparent"
               />
               <TouchableOpacity
                 onPress={() =>
                   this.props.navigation.navigate('ForgotPasswordScreen')
                 }>
                 <Text h5 style={{textAlign: 'center', color: 'blue'}}>
                   Forgot Password?
                 </Text>
               </TouchableOpacity>
             </View>
           </React.Fragment>
         )}
                    </Formik>         
    </KeyboardAvoidingView>               
                </View>
                </ScrollView>
        )
    }
}


const LoginSchema = Yup.object().shape({
    email: Yup.string()
      .email('Invalid email')
      .required('Email is Required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),
  });


const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F4F6FA',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        paddingVertical: 20,
      },
    headerContainer: {
        marginTop: 200,
        top: 300,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 100,
        marginBottom: 250,
    },
    logo: {
        width: 100,
        height: 200,
        padding: 10,
        marginBottom: 10,
    },
    wrapper:{
    },
    input: {
    borderWidth: 1,
    borderColor: 'white',
    borderLeftWidth: 10,
    borderRightWidth: 300,
    height: 50,
    backgroundColor: 'white',
    marginBottom: 10,
    },
    socialWrapper: {
        marginTop: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    socialLogin: {
        flexDirection: 'row',
        marginTop: 10,
    },
});


export default LoginScreen