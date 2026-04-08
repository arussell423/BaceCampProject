import React, { Component } from "react";
import {
  View, StyleSheet, Platform, KeyboardAvoidingView,
  ScrollView, StatusBar, Image, Dimensions, TouchableOpacity,
  Text, TextInput, ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from "../components/Firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Formik } from "formik";
import * as Yup from "yup";

const SCREEN_H = Dimensions.get("window").height;

export class PasswordInputScreen extends Component {
  signUp = async (values) => {
    const email = this.props.route?.params?.email || "";
    const displayName = this.props.route?.params?.displayName || "";
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, values.password);
      // Save display name to Firebase Auth profile
      await updateProfile(cred.user, { displayName });
      // Save to Firestore so the app can read it immediately
      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        displayName,
      }, { merge: true });
      // onAuthStateChanged in App.js will pick up the new user and route to SelectProfileScreen
    } catch (err) {
      alert(err.message);
    }
  };

  render() {
    const email = this.props.route?.params?.email || "";

    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#004d00" />

        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require("../assets/image/bACE_CAMP-logo-light.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Set your password</Text>
          <Text style={styles.heroSub}>Step 2 of 2 — for {email}</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.card}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Formik
              initialValues={{ password: "", passwordConfirm: "" }}
              onSubmit={(values, { setSubmitting }) => {
                this.signUp(values).finally(() => setSubmitting(false));
              }}
              validationSchema={SignupSchema}
            >
              {fp => (
                <>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color="#008000" />
                    <TextInput
                      placeholder="Password"
                      style={[styles.inputText, {flex:1, paddingVertical:10, paddingHorizontal:8}]}
                      placeholderTextColor="#aaa"
                      autoCapitalize="none"
                      secureTextEntry={true}
                      autoCorrect={false}
                      returnKeyType="next"
                      onChangeText={fp.handleChange("password")}
                    />
                  </View>
                  {fp.touched.password && fp.errors.password ? <Text style={styles.errorText}>{fp.errors.password}</Text> : null}

                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="lock-check-outline" size={20} color="#008000" />
                    <TextInput
                      placeholder="Confirm password"
                      style={[styles.inputText, {flex:1, paddingVertical:10, paddingHorizontal:8}]}
                      placeholderTextColor="#aaa"
                      autoCapitalize="none"
                      secureTextEntry={true}
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={fp.handleSubmit}
                      onChangeText={fp.handleChange("passwordConfirm")}
                    />
                  </View>
                  {fp.touched.passwordConfirm && fp.errors.passwordConfirm ? <Text style={styles.errorText}>{fp.errors.passwordConfirm}</Text> : null}

                  <TouchableOpacity
                    style={[styles.btn, styles.btnContainer, !(fp.isValid && fp.dirty) && { opacity: 0.5 }]}
                    onPress={fp.handleSubmit}
                    disabled={!(fp.isValid && fp.dirty) || fp.isSubmitting}
                  >
                    {fp.isSubmitting ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.btnTitle}>Create Account</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backWrap}
                    onPress={() => this.props.navigation.goBack()}
                  >
                    <Text style={styles.backText}>← Back to details</Text>
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

const SignupSchema = Yup.object({
  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
  passwordConfirm: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Please confirm your password"),
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  hero: {
    height: SCREEN_H * 0.28,
    backgroundColor: "#004d00",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logo: { width: 160, height: 52, marginBottom: 10 },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  heroSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4, paddingHorizontal: 20, textAlign: "center" },
  card: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },
  inputContainer: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 12,
    paddingHorizontal: 10, backgroundColor: "#FAFAFA", marginBottom: 2,
    flexDirection: 'row', alignItems: 'center',
  },
  inputText: { fontSize: 15, color: "#222" },
  errorText: { color: "#E53935", fontSize: 12 },
  btn: { backgroundColor: "#006400", borderRadius: 14, paddingVertical: 14 },
  btnTitle: { fontSize: 16, fontWeight: "700" },
  btnContainer: { marginTop: 8, marginBottom: 20 },
  backWrap: { alignItems: "center" },
  backText: { color: "#008000", fontSize: 13, fontWeight: "600" },
});

export default PasswordInputScreen;
