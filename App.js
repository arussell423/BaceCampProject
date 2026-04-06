import React, { Component } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
