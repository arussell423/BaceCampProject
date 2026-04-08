import React, {Component} from 'react';
import {
  View, StyleSheet, Platform, Alert, ActivityIndicator,
  TouchableOpacity, KeyboardAvoidingView, ScrollView,
  StatusBar, Image, Dimensions, Text, TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../components/Firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import {Formik} from 'formik';
import * as Yup from 'yup';

const SCREEN_H = Dimensions.get('window').height;

export class LoginScreen extends Component {

    Login = (values) => {
        signInWithEmailAndPassword(auth, values.email, values.password)
          .then(() => {
            // onAuthStateChanged in App.js handles routing automatically
          })
          .catch(err => {
            alert(err.message);
          });
      };
    
    render() {
        return (
          <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="#004d00" />

            {/* ── Branded hero ───────────────────────────── */}
            <View style={styles.hero}>
              <Image
                source={require('../assets/image/bACE_CAMP-logo-light.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.tagline}>Train Smart. Play Hard. Win.</Text>
            </View>

            {/* ── Form card ─────────────────────────────── */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.cardWrap}
            >
              <ScrollView
                contentContainerStyle={styles.card}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.cardTitle}>Sign in to your account</Text>

                <Formik
                  initialValues={{email: '', password: ''}}
                  onSubmit={(values, {setSubmitting}) => {
                    this.Login(values);
                    setSubmitting(false);
                  }}
                  validationSchema={LoginSchema}>
                  {formikProps => (
                    <>
                      <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="email-outline" size={20} color="#008000" />
                        <TextInput
                          style={[styles.inputText, {flex:1, paddingVertical:10, paddingHorizontal:8}]}
                          onChangeText={formikProps.handleChange('email')}
                          placeholder="Email address"
                          placeholderTextColor="#aaa"
                          autoCapitalize="none"
                          secureTextEntry={false}
                          autoCorrect={false}
                          keyboardType="email-address"
                          returnKeyType="next"
                        />
                      </View>
                      {formikProps.errors.email ? <Text style={styles.errorText}>{formikProps.errors.email}</Text> : null}

                      <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="lock-outline" size={20} color="#008000" />
                        <TextInput
                          style={[styles.inputText, {flex:1, paddingVertical:10, paddingHorizontal:8}]}
                          onChangeText={formikProps.handleChange('password')}
                          placeholder="Password"
                          placeholderTextColor="#aaa"
                          autoCapitalize="none"
                          secureTextEntry={true}
                          autoCorrect={false}
                          keyboardType="default"
                          returnKeyType="done"
                          onSubmitEditing={formikProps.handleSubmit}
                        />
                      </View>
                      {formikProps.errors.password ? <Text style={styles.errorText}>{formikProps.errors.password}</Text> : null}

                      <TouchableOpacity
                        onPress={() => Alert.alert('Forgot Password', 'Please contact your coach or re-register.')}
                        style={styles.forgotWrap}
                      >
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.loginBtn, styles.loginBtnContainer, !(formikProps.isValid && formikProps.dirty) && { opacity: 0.5 }]}
                        onPress={formikProps.handleSubmit}
                        disabled={!(formikProps.isValid && formikProps.dirty)}
                      >
                        {formikProps.isSubmitting ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.loginBtnTitle}>Sign In</Text>}
                      </TouchableOpacity>

                      <View style={styles.dividerRow}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>or continue with</Text>
                        <View style={styles.divider} />
                      </View>

                      <View style={styles.socialRow}>
                        <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Google sign-in is coming soon.')} style={{backgroundColor:'#DB4437',borderRadius:20,width:44,height:44,alignItems:'center',justifyContent:'center',marginHorizontal:8}}>
                          <Text style={{color:'white',fontWeight:'bold',fontSize:12}}>G</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Facebook sign-in is coming soon.')} style={{backgroundColor:'#3b5998',borderRadius:20,width:44,height:44,alignItems:'center',justifyContent:'center',marginHorizontal:8}}>
                          <Text style={{color:'white',fontWeight:'bold',fontSize:12}}>f</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        onPress={() => this.props.navigation.navigate('EmailInputScreen')}
                        style={styles.registerWrap}
                      >
                        <Text style={styles.registerText}>
                          New to bACE CAMP? <Text style={styles.registerLink}>Create account</Text>
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </Formik>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        );
    }
}


const LoginSchema = Yup.object().shape({
    email: Yup.string()
      .email('Invalid email')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),
  });


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  // Hero
  hero: {
    height: SCREEN_H * 0.32,
    backgroundColor: '#004d00',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logo: { width: 220, height: 78, marginBottom: 10 },
  tagline: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', letterSpacing: 0.5 },

  // Card
  cardWrap: { flex: 1 },
  card: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 20 },

  // Inputs
  inputContainer: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    paddingHorizontal: 10, backgroundColor: '#FAFAFA', marginBottom: 2,
    flexDirection: 'row', alignItems: 'center',
  },
  inputText: { fontSize: 15, color: '#222' },
  errorText: { color: '#E53935', fontSize: 12 },

  // Forgot password
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -4 },
  forgotText: { color: '#008000', fontSize: 13, fontWeight: '600' },

  // Login button
  loginBtnContainer: { marginBottom: 20 },
  loginBtn: {
    backgroundColor: '#006400', borderRadius: 14, paddingVertical: 14,
  },
  loginBtnTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 0.4 },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  divider: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText: { marginHorizontal: 12, color: '#aaa', fontSize: 12 },

  // Social
  socialRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },

  // Register
  registerWrap: { alignItems: 'center' },
  registerText: { color: '#888', fontSize: 13 },
  registerLink: { color: '#006400', fontWeight: '700' },
});


export default LoginScreen;

