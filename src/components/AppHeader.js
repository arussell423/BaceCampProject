import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Shared header bar for all post-login screens.
 * - Back arrow (left) → navigation.goBack()
 * - Title (centre)
 * - Logo (right) → navigate to homeScreen (default 'HomeScreen')
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

      {/* Logo taps → navigate to homeScreen or fall back to stack root */}
      <TouchableOpacity
        onPress={() => homeScreen ? navigation.navigate(homeScreen) : navigation.popToTop()}
        style={styles.side}
        activeOpacity={0.7}
      >
        <Image
          source={require('../assets/image/bACE_CAMP-logo-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </TouchableOpacity>
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
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#222' },
  logo: { width: 68, height: 24 },
});

export default AppHeader;
