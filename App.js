import React, { Component } from 'react';
import { View, ActivityIndicator } from 'react-native';
import {firebase} from "@firebase/app";
import '@firebase/auth';
import '@firebase/firestore';
import { AuthNavigator, PlayerNavigator, CoachNavigator, ProfileSelectNavigator } from './src/components/Navigator';

const firebaseConfig = {
  apiKey: "AIzaSyCoiO6loHTb747_Uxmv_-8ofeV3uMOLNgA",
  authDomain: "bace-camp-project.firebaseapp.com",
  projectId: "bace-camp-project",
  storageBucket: "bace-camp-project.appspot.com",
  messagingSenderId: "425785697698",
  appId: "1:425785697698:web:e0ef45e7120d61a2a5fefb",
  measurementId: "G-VX7CGLB4TJ"
};

if (!firebase.apps.length) {
  firebase.initializeApp({firebaseConfig});
} else {
  firebase.app();
}

export class App extends Component {
  state = { loading: true, user: null, role: null };

  componentDidMount() {
    this.unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (this.roleUnsub) { this.roleUnsub(); this.roleUnsub = null; }
      if (user) {
        this.roleUnsub = firebase.firestore().collection('users').doc(user.uid)
          .onSnapshot((doc) => {
            const role = doc.exists ? (doc.data().role || null) : null;
            this.setState({ user, role, loading: false });
          }, () => {
            this.setState({ user, role: 'player', loading: false });
          });
      } else {
        this.setState({ user: null, role: null, loading: false });
      }
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.roleUnsub) this.roleUnsub();
  }

  render() {
    const { loading, user, role } = this.state;
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#008000" />
        </View>
      );
    }
    if (!user) return <AuthNavigator />;
    if (!role) return <ProfileSelectNavigator />;
    if (role === 'coach') return <CoachNavigator />;
    return <PlayerNavigator />;
  }
}

export default App;
