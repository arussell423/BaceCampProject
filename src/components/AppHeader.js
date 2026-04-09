import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from './Firebase';

/**
 * Shared header bar for all post-login screens.
 * - Back arrow (left) → navigation.goBack()
 * - Title (centre)
 * - Logout icon + Logo (right)
 */
export function AppHeader({ navigation, title, homeScreen }) {
  const canGoBack = navigation.canGoBack();
  return (
    <View style={styles.bar}>
      {canGoBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.side}>
        <MaterialIcons name="arrow-back" size={24} color="#008000" />
        </TouchableOpacity>
      ) : (
        <View style={styles.side} />
      )}

      <Text style={styles.title}>{title}</Text>

      {/* Right side: logout icon + logo */}
      <View style={[styles.side, styles.rightSide]}>
        <TouchableOpacity
          onPress={() => signOut(auth).catch(() => {})}
          style={styles.logoutBtn}
          activeOpacity={0.7}
        >
          <MaterialIcons name="logout" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => homeScreen ? navigation.navigate(homeScreen) : navigation.popToTop()}
          activeOpacity={0.7}
        >
          <Image
            source={require('../assets/image/bACE_CAMP-logo-transparent.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  side: { width: 72, alignItems: 'flex-start', justifyContent: 'center' },
  rightSide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  logoutBtn: { marginRight: 6, padding: 2 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#222' },
  logo: { width: 52, height: 20 },
});

export default AppHeader;
