import React, { Component } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './src/components/Firebase';
import { RootNavigator } from './src/components/Navigator';
import { registerRoleChangeCallback } from './src/components/roleManager';
import { registerForPushNotifications, saveTokenToFirestore } from './src/services/notificationService';

export class App extends Component {
  state = { loading: true, user: null, role: null };

  componentDidMount() {
    // Allow any screen to directly update role state (bypasses onSnapshot delay)
    registerRoleChangeCallback((newRole) => {
      this.setState({ role: newRole });
    });

    this.authUnsub = onAuthStateChanged(auth, (user) => {
      if (this.roleUnsub) { this.roleUnsub(); this.roleUnsub = null; }
      if (user) {
        // Register push notifications and save token for this user
        registerForPushNotifications()
          .then((token) => { if (token) saveTokenToFirestore(user.uid, token); })
          .catch(() => {});
        this.roleUnsub = onSnapshot(
          doc(db, 'users', user.uid),
          (snap) => {
            const role = snap.exists() ? (snap.data().role || null) : null;
            this.setState({ user, role, loading: false });
          },
          () => this.setState({ user, role: 'player', loading: false })
        );
      } else {
        this.setState({ user: null, role: null, loading: false });
      }
    });
  }

  componentWillUnmount() {
    if (this.authUnsub) this.authUnsub();
    if (this.roleUnsub) this.roleUnsub();
  }

  render() {
    const { loading, user, role } = this.state;

    if (loading) {
      return (
        <GestureHandlerRootView style={styles.root}>
          <SafeAreaProvider>
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#008000" />
            </View>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      );
    }

    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <RootNavigator user={user} role={role} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default App;
