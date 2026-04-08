import React, {Component} from 'react';
import {
  View, StyleSheet, Platform, KeyboardAvoidingView,
  ScrollView, StatusBar, Image, Dimensions, TouchableOpacity,
  Text, TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="account-outline" size={20} color="#008000" />
                    <TextInput
                      placeholder="Full name"
                      style={[styles.inputText, {flex:1, paddingVertical:10, paddingHorizontal:8}]}
                      placeholderTextColor="#aaa"
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      onChangeText={fp.handleChange('name')}
                    />
                  </View>
                  {fp.touched.name && fp.errors.name ? <Text style={styles.errorText}>{fp.errors.name}</Text> : null}

                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="email-outline" size={20} color="#008000" />
                    <TextInput
                      placeholder="Email address"
                      style={[styles.inputText, {flex:1, paddingVertical:10, paddingHorizontal:8}]}
                      placeholderTextColor="#aaa"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      returnKeyType="done"
                      onSubmitEditing={fp.handleSubmit}
                      onChangeText={fp.handleChange('email')}
                    />
                  </View>
                  {fp.touched.email && fp.errors.email ? <Text style={styles.errorText}>{fp.errors.email}</Text> : null}

                  <TouchableOpacity
                    style={[styles.btn, styles.btnContainer, !(fp.isValid && fp.dirty) && { opacity: 0.5 }]}
                    onPress={fp.handleSubmit}
                    disabled={!(fp.isValid && fp.dirty)}
                  >
                    <Text style={styles.btnTitle}>Continue →</Text>
                  </TouchableOpacity>

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
    flexDirection: 'row', alignItems: 'center',
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
