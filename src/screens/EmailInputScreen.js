import React, {Component} from 'react';
import {
  View, StyleSheet, Platform, KeyboardAvoidingView,
  ScrollView, StatusBar, Image, Dimensions, TouchableOpacity,
} from 'react-native';
import { Text, Icon, Input, Button } from 'react-native-elements';
import {Formik} from 'formik';
import * as Yup from 'yup';

const SCREEN_H = Dimensions.get('window').height;

export class EmailInputScreen extends Component {
  render() {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#004d00" />

        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require('../assets/image/bACE_CAMP-logo-light.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Create your account</Text>
          <Text style={styles.heroSub}>Step 1 of 2 — Your details</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.card}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Formik
              initialValues={{ name: '', email: '' }}
              onSubmit={values => {
                this.props.navigation.navigate('PasswordInputScreen', {
                  email: values.email.trim(),
                  displayName: values.name.trim(),
                });
              }}
              validationSchema={SignupSchema}
            >
              {fp => (
                <>
                  <Input
                    leftIcon={<Icon name="account-outline" type="material-community" color="#008000" size={20} />}
                    placeholder="Full name"
                    inputContainerStyle={styles.inputContainer}
                    inputStyle={styles.inputText}
                    placeholderTextColor="#aaa"
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    onChangeText={fp.handleChange('name')}
                    errorMessage={fp.touched.name && fp.errors.name ? fp.errors.name : ''}
                    errorStyle={styles.errorText}
                  />

                  <Input
                    leftIcon={<Icon name="email-outline" type="material-community" color="#008000" size={20} />}
                    placeholder="Email address"
                    inputContainerStyle={styles.inputContainer}
                    inputStyle={styles.inputText}
                    placeholderTextColor="#aaa"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="done"
                    onSubmitEditing={fp.handleSubmit}
                    onChangeText={fp.handleChange('email')}
                    errorMessage={fp.touched.email && fp.errors.email ? fp.errors.email : ''}
                    errorStyle={styles.errorText}
                  />

                  <Button
                    title="Continue →"
                    buttonStyle={styles.btn}
                    titleStyle={styles.btnTitle}
                    containerStyle={styles.btnContainer}
                    onPress={fp.handleSubmit}
                    disabled={!(fp.isValid && fp.dirty)}
                  />

                  <TouchableOpacity
                    style={styles.signinWrap}
                    onPress={() => this.props.navigation.navigate('LoginScreen')}
                  >
                    <Text style={styles.signinText}>
                      Already have an account?{'  '}
                      <Text style={styles.signinLink}>Sign in</Text>
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

const SignupSchema = Yup.object().shape({
  name: Yup.string().min(2, 'Please enter your name').required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  hero: {
    height: SCREEN_H * 0.28,
    backgroundColor: '#004d00',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logo: { width: 160, height: 52, marginBottom: 10 },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  card: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },
  inputContainer: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    paddingHorizontal: 10, backgroundColor: '#FAFAFA', marginBottom: 2,
  },
  inputText: { fontSize: 15, color: '#222' },
  errorText: { color: '#E53935', fontSize: 12 },
  btn: { backgroundColor: '#006400', borderRadius: 14, paddingVertical: 14 },
  btnTitle: { fontSize: 16, fontWeight: '700' },
  btnContainer: { marginTop: 8, marginBottom: 20 },
  signinWrap: { alignItems: 'center' },
  signinText: { color: '#888', fontSize: 13 },
  signinLink: { color: '#006400', fontWeight: '700' },
});

export default EmailInputScreen;
