import React, {Component} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';

import PasswordStrengthMeterBar from 'react-native-password-strength-meter-bar';
import { Text, Icon, Input, Button, SocialIcon, Image } from 'react-native-elements';

import firebase from 'firebase';
import {Formik} from 'formik';
import * as Yup from 'yup';

 

export class PasswordInputScreen extends Component {
  static navigationOptions = {
    headerTransparent: true,
    headerTitle: '',
  };
  state = {
    password: '',
  };

    onChange = password => this.setState({ password });
    
    signUp = (values,navigation) => {
        this.setState({loading: true});
        let email = this.props.navigation.getParam('email');
        firebase
          .auth()
          .createUserWithEmailAndPassword(email, values.password)
          .then(user => {
            this.setState({user});
            alert('Registration success');
          })
      };
    

  render() {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={'padding'}
        enabled
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 84}>
        <ScrollView
          style={styles.container}
                keyboardShouldPersistTaps="handled">
                
                <Formik
  initialValues={{password: '', passwordConfirm: ''}}
  onSubmit={(values, {setSubmitting}) => {
    this.signUp(values, this.props.navigation);
    setSubmitting(false);
  }}
                    validationSchema={SignupSchema}>
                
                {formikProps => (
                        
                        <React.Fragment>

          <View style={styles.headerContainer}>
          <Image
            style={styles.logo}
            source={require('../assets/image/bACE_CAMP-logo.png')}
        />
            <Text h4 style={{textAlign: 'center'}}>
                                Now let's setup your password
            </Text>
                    </View>
                   
          <Input
            leftIcon={
              <Icon
                name="lock"
                color="#87cefa"
                size={25}
              />
            }
            placeholder="Email"
            inputContainerStyle={{
              borderWidth: 1,
              borderColor: 'white',
              borderLeftWidth: 0,
              height: 50,
              backgroundColor: 'white',
              marginBottom: 20,
            }}
            autoCapitalize="none"
            placeholder="Enter your Password"
            secureTextEntry={true}
            autoCorrect={false}
            returnKeyType="next"
            onChangeText={formikProps.handleChange('password')}
                    />
            <Input
            leftIcon={
              <Icon
                name="lock"
                color="#87cefa"
                size={25}
              />
            }
            placeholder="Confirm Password"
            inputContainerStyle={{
              borderWidth: 1,
              borderColor: 'white',
              borderLeftWidth: 0,
              height: 50,
              backgroundColor: 'white',
              marginBottom: 20,
            }}
            autoCapitalize="none"
            secureTextEntry={true}
            autoCorrect={false}
            returnKeyType="next"
            onChangeText={formikProps.handleChange('passwordConfirm')}
            />
                           
            {formikProps.errors.password ? (
        <Text style={{color: 'red'}}>
          {formikProps.errors.password}
        </Text>
      ) : null}
      {formikProps.errors.passwordConfirm ? (
        <Text style={{color: 'red'}}>
          {formikProps.errors.passwordConfirm}
        </Text>
      ) : null}
            <PasswordStrengthMeterBar password={formikProps.values.password} />
                
          <View style={styles.btnWrapper}>
            <TouchableOpacity>
                                <Button
              title="Continue"
              loading={false}
              loadingProps={{size: 'small', color: 'white'}}
              buttonStyle={{
                backgroundColor: '#008000',
                borderRadius: 15,
              }}
              titleStyle={{fontWeight: 'bold', fontSize: 23}}
              containerStyle={{marginVertical: 10, height: 50, width: 300}}
              onPress={() =>
                this.signUp()
              }
              
              underlayColor="transparent"
            />
                </TouchableOpacity>    
                    </View>
                    
                    </React.Fragment>
                    )}

                    </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}



const SignupSchema = Yup.object({
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),
    passwordConfirm: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Password confirm is required'),
  });

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F4F6FA',
    height: '100%',
  },
  headerContainer: {
    top: 30,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    },
    logo: {
        width: 100,
        height: 200,
        padding: 10,
        marginBottom: 10,
    },
  heading: {
    color: 'white',
    marginTop: 10,
    fontSize: 22,
    fontWeight: 'bold',
  },
  btnWrapper: {
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialLogin: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentView: {
    // marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainerStyle: {
    marginTop: 16,
    width: '90%',
  },
  keyboardAvoidingView: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
});
export default PasswordInputScreen;