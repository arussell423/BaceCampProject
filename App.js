import React, { Component } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './src/components/Firebase';
import { AuthNavigator, PlayerNavigator, CoachNavigator, ProfileSelectNavigator } from './src/components/Navigator';

export class App extends Component {
  state = { loading: true, user: null, role: null };

  componentDidMount() {
    this.authUnsub = onAuthStateChanged(auth, (user) => {
      if (this.roleUnsub) { this.roleUnsub(); this.roleUnsub = null; }
      if (user) {
        this.roleUnsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
          const role = snap.exists() ? (snap.data().role || null) : null;
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
    if (this.authUnsub) this.authUnsub();
    if (this.roleUnsub) this.roleUnsub();
  }

  render() {
    const { loading, user, role } = this.state;

    let content;
    if (loading) {
      content = (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#008000" />
        </View>
      );
    } else if (!user) {
      content = <AuthNavigator />;
    } else if (!role) {
      content = <ProfileSelectNavigator />;
    } else if (role === 'coach') {
      content = <CoachNavigator />;
    } else {
      content = <PlayerNavigator />;
    }

    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          {content}
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
